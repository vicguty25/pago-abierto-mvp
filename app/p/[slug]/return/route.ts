import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { paymentRequests } from "@/db/schema";
import { db } from "@/lib/db";
import { getPaymentProvider } from "@/lib/payments";
import { getRequestBySlug, recordEvent } from "@/lib/requests";

export const runtime = "nodejs";

/**
 * Aqui aterriza el cliente despues de aprobar (o rechazar) el pago en la
 * pantalla de su wallet.
 *
 * Es un route handler y no una pagina porque no tiene nada que mostrar: hace el
 * trabajo y redirige a /p/[slug], que es la pantalla que ya sabe representar
 * cualquier estado.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const url = new URL(request.url);
  const interactRef = url.searchParams.get("interact_ref");
  const destino = new URL(`/p/${slug}`, url.origin);

  const solicitud = await getRequestBySlug(slug);

  if (!solicitud) {
    return NextResponse.redirect(new URL("/", url.origin));
  }

  // Sin interact_ref el cliente rechazo el pago o cerro la pantalla. No es un
  // error del sistema: se devuelve la solicitud a "sin pagar" para que pueda
  // intentarlo otra vez.
  if (!interactRef) {
    await db
      .update(paymentRequests)
      .set({ status: "created", updatedAt: new Date() })
      .where(eq(paymentRequests.id, slug));

    await recordEvent(slug, "grant.rejected");
    destino.searchParams.set("estado", "rechazado");
    return NextResponse.redirect(destino);
  }

  if (!solicitud.grantContinueUri || !solicitud.grantContinueToken || !solicitud.quoteId) {
    await recordEvent(slug, "grant.missing_continuation");
    destino.searchParams.set("estado", "error");
    return NextResponse.redirect(destino);
  }

  const provider = getPaymentProvider();

  try {
    const { outgoingPaymentId } = await provider.finishPayment({
      payerWalletAddress: solicitud.payerWalletAddress ?? "",
      continueUri: solicitud.grantContinueUri,
      continueToken: solicitud.grantContinueToken,
      interactRef,
      quoteId: solicitud.quoteId,
    });

    // El pago se ordeno. Ahora se comprueba cuanto llego de verdad: ordenar y
    // liquidar no son lo mismo.
    const recibido = solicitud.incomingPaymentUrl
      ? await provider.getReceivedAmount(solicitud.incomingPaymentUrl)
      : null;

    // El mock no puede verificar (devuelve null). En ese caso se toma el monto
    // solicitado como recibido, que es la unica lectura posible en una demo.
    const recibidoMinor = recibido?.value ?? solicitud.amountMinor;
    const completo = recibidoMinor >= solicitud.amountMinor;

    await db
      .update(paymentRequests)
      .set({
        status: completo ? "paid" : "pending",
        outgoingPaymentId,
        receivedMinor: recibidoMinor,
        paidAt: completo ? new Date() : null,
        // El grant ya se consumio: los secretos dejan de ser necesarios.
        grantContinueToken: null,
        updatedAt: new Date(),
      })
      .where(eq(paymentRequests.id, slug));

    await recordEvent(slug, completo ? "payment.paid" : "payment.partial", {
      outgoingPaymentId,
      recibidoMinor,
      verificado: recibido !== null,
    });

    destino.searchParams.set("estado", completo ? "pagado" : "parcial");
    return NextResponse.redirect(destino);
  } catch (error) {
    console.error("[pago-abierto] fallo al ejecutar el pago", error);

    await db
      .update(paymentRequests)
      .set({ status: "failed", updatedAt: new Date() })
      .where(eq(paymentRequests.id, slug));

    await recordEvent(slug, "payment.failed", {
      motivo: error instanceof Error ? error.message : "desconocido",
    });

    destino.searchParams.set("estado", "error");
    return NextResponse.redirect(destino);
  }
}

import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";

import { paymentRequests } from "@/db/schema";
import { appUrlFrom } from "@/lib/app-url";
import { db } from "@/lib/db";
import { getPaymentProvider } from "@/lib/payments";
import { PaymentProviderError } from "@/lib/payments/types";
import { getRequestBySlug, recordEvent } from "@/lib/requests";
import { payRequestSchema } from "@/lib/validation";

export const runtime = "nodejs";

/**
 * Prepara el pago: cotiza contra la wallet del cliente y pide el grant
 * interactivo. Devuelve la URL de consentimiento a la que hay que enviarlo.
 *
 * No mueve dinero todavia. Eso ocurre en /p/[slug]/return, cuando el cliente
 * vuelve habiendo aprobado.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const solicitud = await getRequestBySlug(slug);

  if (!solicitud) {
    return NextResponse.json(
      { error: "Esta solicitud de cobro no existe." },
      { status: 404 },
    );
  }

  if (solicitud.status === "paid") {
    return NextResponse.json(
      { error: "Esta solicitud ya fue pagada." },
      { status: 409 },
    );
  }

  if (solicitud.status === "expired" || solicitud.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "Esta solicitud expiro. Pidele una nueva a quien te cobra." },
      { status: 409 },
    );
  }

  if (!solicitud.incomingPaymentUrl) {
    return NextResponse.json(
      { error: "La solicitud esta incompleta y no se puede pagar." },
      { status: 409 },
    );
  }

  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json(
      { error: "El cuerpo de la peticion no es JSON valido." },
      { status: 400 },
    );
  }

  const parsed = payRequestSchema.safeParse(cuerpo);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos invalidos." },
      { status: 400 },
    );
  }

  const provider = getPaymentProvider();
  const appUrl = appUrlFrom(request);
  const nonce = nanoid(16);

  try {
    const resultado = await provider.startPayment({
      payerWalletAddress: parsed.data.payerWalletAddress,
      incomingPaymentUrl: solicitud.incomingPaymentUrl,
      returnUrl: `${appUrl}/p/${slug}/return`,
      nonce,
    });

    await db
      .update(paymentRequests)
      .set({
        status: "pending",
        payerWalletAddress: parsed.data.payerWalletAddress,
        quoteId: resultado.quoteId,
        grantContinueUri: resultado.continueUri,
        grantContinueToken: resultado.continueToken,
        updatedAt: new Date(),
      })
      .where(eq(paymentRequests.id, slug));

    await recordEvent(slug, "grant.pending", {
      payerWalletAddress: parsed.data.payerWalletAddress,
      debitAmount: resultado.debitAmount,
    });

    return NextResponse.json({ redirectUrl: resultado.redirectUrl });
  } catch (error) {
    console.error("[pago-abierto] fallo al preparar el pago", error);

    await recordEvent(slug, "grant.failed", {
      motivo: error instanceof Error ? error.message : "desconocido",
    });

    const mensaje =
      error instanceof PaymentProviderError
        ? error.message
        : "No se pudo preparar el pago.";

    return NextResponse.json({ error: mensaje }, { status: 502 });
  }
}

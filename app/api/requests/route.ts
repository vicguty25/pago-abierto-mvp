import { NextResponse } from "next/server";
import { nanoid } from "nanoid";

import { paymentRequests } from "@/db/schema";
import { db } from "@/lib/db";
import { getPaymentProvider } from "@/lib/payments";
import { PaymentProviderError } from "@/lib/payments/types";
import { recordEvent, REQUEST_TTL_DAYS } from "@/lib/requests";
import {
  ASSET_SCALES,
  createRequestSchema,
  toMinorUnits,
} from "@/lib/validation";

// El SDK de Open Payments firma con node:crypto. En edge no existe.
export const runtime = "nodejs";

export async function POST(request: Request) {
  let cuerpo: unknown;

  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json(
      { error: "El cuerpo de la peticion no es JSON valido." },
      { status: 400 },
    );
  }

  const parsed = createRequestSchema.safeParse(cuerpo);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos invalidos." },
      { status: 400 },
    );
  }

  const datos = parsed.data;
  const assetScale = ASSET_SCALES[datos.assetCode] ?? 2;
  const amountMinor = toMinorUnits(datos.amount, assetScale);
  const id = nanoid(12);
  const expiresAt = new Date(
    Date.now() + REQUEST_TTL_DAYS * 24 * 60 * 60 * 1000,
  );

  const provider = getPaymentProvider();

  try {
    // Primero se abre el cobro en la red: si eso falla no tiene sentido dejar
    // una solicitud huerfana en la base que nunca podra cobrarse.
    const { incomingPaymentUrl } = await provider.createIncomingPayment({
      amount: { value: amountMinor, assetCode: datos.assetCode, assetScale },
      description: datos.description,
      requestId: id,
      expiresAt,
    });

    await db.insert(paymentRequests).values({
      id,
      amountMinor,
      assetCode: datos.assetCode,
      assetScale,
      description: datos.description,
      payeeName: datos.payeeName,
      clientName: datos.clientName || null,
      clientCountry: datos.clientCountry || null,
      status: "created",
      provider: provider.name,
      incomingPaymentUrl,
      expiresAt,
    });

    await recordEvent(id, "request.created", {
      provider: provider.name,
      amountMinor,
      assetCode: datos.assetCode,
    });

    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error("[pago-abierto] fallo al crear la solicitud", error);

    const mensaje =
      error instanceof PaymentProviderError
        ? error.message
        : "No se pudo crear la solicitud de cobro.";

    return NextResponse.json({ error: mensaje }, { status: 502 });
  }
}

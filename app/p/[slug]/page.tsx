import { notFound } from "next/navigation";

import { PayForm } from "@/components/pay-form";
import { StatusPill } from "@/components/status-pill";
import { getRequestBySlug } from "@/lib/requests";
import { formatAmount } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** Mensajes con los que vuelve el cliente desde la pantalla de consentimiento. */
const AVISOS: Record<string, { texto: string; tono: "ok" | "aviso" | "error" }> =
  {
    pagado: {
      texto: "El pago se completo. Ya no hay nada pendiente.",
      tono: "ok",
    },
    parcial: {
      texto:
        "El pago se autorizo pero todavia no llego el monto completo. Puede tardar unos segundos.",
      tono: "aviso",
    },
    rechazado: {
      texto: "No se autorizo el pago. Puedes intentarlo de nuevo.",
      tono: "aviso",
    },
    error: {
      texto:
        "Algo fallo al ejecutar el pago. No se descontaron fondos; intentalo otra vez.",
      tono: "error",
    },
  };

export default async function PaymentPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ estado?: string }>;
}) {
  const { slug } = await params;
  const { estado } = await searchParams;

  const solicitud = await getRequestBySlug(slug);
  if (!solicitud) notFound();

  const aviso = estado ? AVISOS[estado] : undefined;
  const pagada = solicitud.status === "paid";
  const cerrada =
    pagada || solicitud.status === "expired" || solicitud.expiresAt < new Date();

  return (
    <div className="mx-auto max-w-lg">
      {aviso ? (
        <p
          role="status"
          className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
            aviso.tono === "ok"
              ? "border-esmeralda/30 bg-esmeralda/8 text-profundo"
              : aviso.tono === "error"
                ? "border-alerta/30 bg-alerta/8 text-alerta"
                : "border-ambar/30 bg-ambar/8 text-ambar"
          }`}
        >
          {aviso.texto}
        </p>
      ) : null}

      <div className="rounded-xl border border-borde bg-white p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-tenue">Solicitud de cobro de</p>
            <p className="font-display text-lg font-semibold">
              {solicitud.payeeName}
            </p>
          </div>
          <StatusPill status={solicitud.status} />
        </div>

        <p className="monto mt-7 text-4xl font-medium tracking-tight">
          {formatAmount(
            solicitud.amountMinor,
            solicitud.assetCode,
            solicitud.assetScale,
          )}
        </p>

        <p className="mt-2.5 text-[15px] text-tenue">
          {solicitud.description}
        </p>

        <dl className="mt-7 space-y-2.5 border-t border-borde pt-6 text-sm">
          {solicitud.clientName ? (
            <Fila etiqueta="Para">{solicitud.clientName}</Fila>
          ) : null}
          {solicitud.clientCountry ? (
            <Fila etiqueta="Pais">{solicitud.clientCountry}</Fila>
          ) : null}
          <Fila etiqueta="Vence">
            {solicitud.expiresAt.toLocaleDateString("es-CO", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </Fila>
          <Fila etiqueta="Red">
            {solicitud.provider === "testnet"
              ? "Interledger — red de pruebas"
              : "Simulacion local"}
          </Fila>
        </dl>
      </div>

      {pagada ? (
        <p className="mt-6 text-center text-sm text-tenue">
          Este cobro ya esta saldado. No hay que hacer nada mas.
        </p>
      ) : cerrada ? (
        <p className="mt-6 text-center text-sm text-tenue">
          Esta solicitud ya no acepta pagos. Pidele una nueva a{" "}
          {solicitud.payeeName}.
        </p>
      ) : (
        <div className="mt-6 rounded-xl border border-borde bg-white p-7">
          <h2 className="mb-5 font-display font-semibold">Pagar</h2>
          <PayForm slug={slug} />
        </div>
      )}
    </div>
  );
}

function Fila({
  etiqueta,
  children,
}: {
  etiqueta: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-tenue">{etiqueta}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}

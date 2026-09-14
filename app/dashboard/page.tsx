import Link from "next/link";

import { StatusPill } from "@/components/status-pill";
import { expireStaleRequests, getFunnel, listRequests } from "@/lib/requests";
import { formatAmount } from "@/lib/validation";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Se limpian las vencidas antes de medir: un embudo que cuenta como
  // "pendientes" cobros de hace un mes miente.
  await expireStaleRequests();

  const [embudo, solicitudes] = await Promise.all([
    getFunnel(),
    listRequests(),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight">
        Historial
      </h1>
      <p className="mt-1.5 text-sm text-tenue">
        La metrica que decide si este producto sirve es una sola: cuantas
        solicitudes terminan pagadas.
      </p>

      <div className="mt-7 grid gap-4 sm:grid-cols-4">
        <Metrica
          etiqueta="Pagadas"
          valor={`${embudo.conversion}%`}
          detalle={`${embudo.paid} de ${embudo.created}`}
          destacada
        />
        <Metrica etiqueta="Creadas" valor={String(embudo.created)} />
        <Metrica etiqueta="En proceso" valor={String(embudo.pending)} />
        <Metrica
          etiqueta="Horas hasta el pago"
          valor={
            embudo.horasPromedioHastaPago === null
              ? "—"
              : String(embudo.horasPromedioHastaPago)
          }
          detalle="promedio"
        />
      </div>

      <div className="mt-10">
        {solicitudes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-borde px-6 py-14 text-center">
            <p className="text-sm text-tenue">
              Todavia no hay solicitudes de cobro.
            </p>
            <Link
              href="/"
              className="mt-3 inline-block text-sm font-medium underline"
            >
              Crear la primera
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-borde overflow-hidden rounded-xl border border-borde bg-white">
            {solicitudes.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/p/${s.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-papel"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[15px]">{s.description}</p>
                    <p className="mt-0.5 text-xs text-tenue">
                      {s.clientName ? `${s.clientName} · ` : ""}
                      {s.createdAt.toLocaleDateString("es-CO", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    <span className="monto text-sm">
                      {formatAmount(s.amountMinor, s.assetCode, s.assetScale)}
                    </span>
                    <StatusPill status={s.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Metrica({
  etiqueta,
  valor,
  detalle,
  destacada,
}: {
  etiqueta: string;
  valor: string;
  detalle?: string;
  destacada?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-5 ${
        destacada
          ? "border-esmeralda/30 bg-esmeralda/6"
          : "border-borde bg-white"
      }`}
    >
      <p className="text-xs font-medium tracking-wide text-tenue uppercase">
        {etiqueta}
      </p>
      <p
        className={`monto mt-2 text-2xl font-medium ${
          destacada ? "text-profundo" : ""
        }`}
      >
        {valor}
      </p>
      {detalle ? (
        <p className="mt-0.5 text-xs text-tenue">{detalle}</p>
      ) : null}
    </div>
  );
}

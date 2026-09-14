type Status = "created" | "pending" | "paid" | "failed" | "expired";

/**
 * Los estados se nombran por lo que le pasa al dinero, no por lo que hace el
 * sistema. "Esperando confirmacion" le dice algo a quien cobra; "pending" no.
 */
const ETIQUETAS: Record<Status, { texto: string; clase: string }> = {
  created: {
    texto: "Sin pagar",
    clase: "bg-borde/60 text-tenue",
  },
  pending: {
    texto: "Esperando confirmacion",
    clase: "bg-ambar/12 text-ambar",
  },
  paid: {
    texto: "Pagado",
    clase: "bg-esmeralda/12 text-profundo",
  },
  failed: {
    texto: "Fallo",
    clase: "bg-alerta/12 text-alerta",
  },
  expired: {
    texto: "Expirado",
    clase: "bg-borde/60 text-tenue",
  },
};

export function StatusPill({ status }: { status: Status }) {
  const { texto, clase } = ETIQUETAS[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${clase}`}
    >
      {texto}
    </span>
  );
}

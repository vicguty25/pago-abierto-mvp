"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const MONEDAS = ["USD", "EUR", "MXN", "COP"];

export function RequestForm() {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setEnviando(true);

    const datos = new FormData(event.currentTarget);

    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          amount: Number(datos.get("amount")),
          assetCode: String(datos.get("assetCode")),
          description: String(datos.get("description")),
          payeeName: String(datos.get("payeeName")),
          clientName: String(datos.get("clientName") ?? ""),
          clientCountry: String(datos.get("clientCountry") ?? ""),
        }),
      });

      const cuerpo = await res.json();

      if (!res.ok) {
        setError(cuerpo.error ?? "No se pudo crear la solicitud.");
        setEnviando(false);
        return;
      }

      router.push(`/p/${cuerpo.id}`);
    } catch {
      setError("No se pudo conectar. Revisa tu conexion e intenta de nuevo.");
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
        <Campo etiqueta="Monto" htmlFor="amount">
          <input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            defaultValue="450"
            className="monto w-full rounded-lg border border-borde bg-white px-3.5 py-2.5 text-lg outline-none focus:border-esmeralda"
          />
        </Campo>

        <Campo etiqueta="Moneda" htmlFor="assetCode">
          <select
            id="assetCode"
            name="assetCode"
            defaultValue="USD"
            className="w-full rounded-lg border border-borde bg-white px-3.5 py-2.5 text-lg outline-none focus:border-esmeralda"
          >
            {MONEDAS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </Campo>
      </div>

      <Campo etiqueta="Concepto" htmlFor="description">
        <input
          id="description"
          name="description"
          required
          maxLength={140}
          placeholder="Campana de lanzamiento + piezas graficas"
          className="w-full rounded-lg border border-borde bg-white px-3.5 py-2.5 outline-none focus:border-esmeralda"
        />
      </Campo>

      <Campo etiqueta="Tu nombre" htmlFor="payeeName">
        <input
          id="payeeName"
          name="payeeName"
          required
          maxLength={80}
          placeholder="Como quieres que te vea el cliente"
          className="w-full rounded-lg border border-borde bg-white px-3.5 py-2.5 outline-none focus:border-esmeralda"
        />
      </Campo>

      <details className="group">
        <summary className="cursor-pointer text-sm text-tenue hover:text-tinta">
          Datos del cliente (opcional)
        </summary>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Nombre del cliente" htmlFor="clientName">
            <input
              id="clientName"
              name="clientName"
              maxLength={80}
              className="w-full rounded-lg border border-borde bg-white px-3.5 py-2.5 outline-none focus:border-esmeralda"
            />
          </Campo>
          <Campo etiqueta="Pais" htmlFor="clientCountry">
            <input
              id="clientCountry"
              name="clientCountry"
              maxLength={60}
              placeholder="Estados Unidos"
              className="w-full rounded-lg border border-borde bg-white px-3.5 py-2.5 outline-none focus:border-esmeralda"
            />
          </Campo>
        </div>
      </details>

      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-alerta/30 bg-alerta/8 px-3.5 py-2.5 text-sm text-alerta"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded-lg bg-esmeralda px-5 py-3 font-display font-semibold text-white transition hover:bg-profundo disabled:opacity-60"
      >
        {enviando ? "Abriendo el cobro..." : "Crear solicitud de cobro"}
      </button>
    </form>
  );
}

function Campo({
  etiqueta,
  htmlFor,
  children,
}: {
  etiqueta: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-sm font-medium text-tenue"
      >
        {etiqueta}
      </label>
      {children}
    </div>
  );
}

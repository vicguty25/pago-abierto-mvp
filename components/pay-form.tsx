"use client";

import { useState } from "react";

export function PayForm({ slug }: { slug: string }) {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setEnviando(true);

    const datos = new FormData(event.currentTarget);

    try {
      const res = await fetch(`/api/requests/${slug}/pay`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          payerWalletAddress: String(datos.get("payerWalletAddress")),
        }),
      });

      const cuerpo = await res.json();

      if (!res.ok) {
        setError(cuerpo.error ?? "No se pudo preparar el pago.");
        setEnviando(false);
        return;
      }

      // Se sale del sitio hacia la pantalla de consentimiento de la wallet.
      window.location.href = cuerpo.redirectUrl;
    } catch {
      setError("No se pudo conectar. Revisa tu conexion e intenta de nuevo.");
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="payerWalletAddress"
          className="mb-1.5 block text-sm font-medium text-tenue"
        >
          Tu wallet address
        </label>
        <input
          id="payerWalletAddress"
          name="payerWalletAddress"
          required
          placeholder="https://ilp.interledger-test.dev/tu-nombre"
          className="w-full rounded-lg border border-borde bg-white px-3.5 py-2.5 outline-none focus:border-esmeralda"
        />
        <p className="mt-1.5 text-xs text-tenue">
          La encuentras en tu wallet de Interledger. Autorizas el pago en tu
          propia wallet, no aqui.
        </p>
      </div>

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
        {enviando ? "Preparando el pago..." : "Continuar al pago"}
      </button>
    </form>
  );
}

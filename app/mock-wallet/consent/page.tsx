import Link from "next/link";

/**
 * Pantalla de consentimiento simulada.
 *
 * Solo se usa con el proveedor mock. Ocupa el lugar de la pantalla real de la
 * wallet del cliente, para que el flujo tenga la misma forma — salir del sitio,
 * aprobar, volver con un interact_ref — sin necesidad de credenciales.
 *
 * Se ve distinta a propósito: nadie debe confundirla con la app.
 */
export default async function MockConsentPage({
  searchParams,
}: {
  searchParams: Promise<{
    return?: string;
    nonce?: string;
    interact_ref?: string;
  }>;
}) {
  const params = await searchParams;
  const returnUrl = params.return;
  const interactRef = params.interact_ref;

  if (!returnUrl || !interactRef) {
    return (
      <div className="mx-auto max-w-md text-center">
        <p className="text-sm text-tenue">
          Falta informacion para mostrar el consentimiento.
        </p>
        <Link href="/" className="mt-4 inline-block text-sm underline">
          Volver al inicio
        </Link>
      </div>
    );
  }

  const aprobar = new URL(returnUrl);
  aprobar.searchParams.set("interact_ref", interactRef);
  if (params.nonce) aprobar.searchParams.set("hash", params.nonce);

  // Rechazar es simplemente volver sin interact_ref.
  const rechazar = new URL(returnUrl);

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-xl border-2 border-dashed border-borde bg-white p-7">
        <p className="text-xs font-medium tracking-wide text-tenue uppercase">
          Wallet simulada
        </p>

        <h1 className="mt-3 font-display text-xl font-semibold">
          Autorizar este pago
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-tenue">
          En la red real esta pantalla la muestra tu proveedor de wallet, no
          Pago Abierto. Ahi verias el monto exacto a debitar y las comisiones de
          red antes de aprobar.
        </p>

        <div className="mt-7 flex flex-col gap-3">
          <a
            href={aprobar.toString()}
            className="rounded-lg bg-esmeralda px-5 py-3 text-center font-display font-semibold text-white transition hover:bg-profundo"
          >
            Aprobar el pago
          </a>
          <a
            href={rechazar.toString()}
            className="rounded-lg border border-borde px-5 py-3 text-center text-sm text-tenue transition hover:text-tinta"
          >
            Rechazar
          </a>
        </div>
      </div>
    </div>
  );
}

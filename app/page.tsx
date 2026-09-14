import { RequestForm } from "@/components/request-form";
import { getProviderName } from "@/lib/payments";

export default function Home() {
  const provider = getProviderName();

  return (
    <div className="grid gap-12 md:grid-cols-[1fr_1.1fr] md:gap-16">
      <div>
        <h1 className="font-display text-3xl leading-[1.15] font-semibold tracking-tight sm:text-4xl">
          Cobra al exterior sin explicar un SWIFT
        </h1>

        <p className="mt-4 text-[15px] leading-relaxed text-tenue">
          Tu cliente en Estados Unidos abre un link, ve cuanto debe y a quien le
          paga, y autoriza desde su propia wallet. Tu ves el estado cambiar en
          tiempo real, sin perseguir a nadie por WhatsApp.
        </p>

        <dl className="mt-8 space-y-5 border-t border-borde pt-7 text-sm">
          <div>
            <dt className="font-medium">Sobre Interledger Open Payments</dt>
            <dd className="mt-1 text-tenue">
              Un estandar abierto para pedir y autorizar pagos entre wallets
              distintas. Aqui corre sobre la red de pruebas.
            </dd>
          </div>
          <div>
            <dt className="font-medium">El monto que pides es el que llega</dt>
            <dd className="mt-1 text-tenue">
              La cotizacion fija las comisiones de red antes de que tu cliente
              autorice. Nadie descubre un descuento al final.
            </dd>
          </div>
          <div>
            <dt className="font-medium">Sin cuenta, sin instalar nada</dt>
            <dd className="mt-1 text-tenue">
              El link de la solicitud es todo lo que tu cliente necesita.
            </dd>
          </div>
        </dl>

        {provider === "mock" ? (
          <p className="mt-8 rounded-lg border border-borde bg-white px-4 py-3 text-sm text-tenue">
            <strong className="font-medium text-tinta">
              Modo demostracion.
            </strong>{" "}
            No hay credenciales configuradas, asi que el pago se simula en local
            y no toca la red de Interledger. El flujo es identico.
          </p>
        ) : null}
      </div>

      <div className="rounded-xl border border-borde bg-white p-6 sm:p-7">
        <h2 className="font-display text-lg font-semibold">
          Nueva solicitud de cobro
        </h2>
        <p className="mt-1 mb-6 text-sm text-tenue">
          Toma menos de un minuto.
        </p>
        <RequestForm />
      </div>
    </div>
  );
}

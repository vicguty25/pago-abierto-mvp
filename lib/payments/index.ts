import { MockPaymentProvider } from "./mock";
import { TestnetPaymentProvider } from "./testnet";
import type { PaymentProvider } from "./types";

export * from "./types";

let cached: PaymentProvider | null = null;

/**
 * Decide con que proveedor corre la aplicacion.
 *
 * La regla es deliberadamente conservadora: solo se usa la red real si el
 * operador la pidio explicitamente Y estan las tres credenciales. Un despliegue
 * al que le falta una variable cae al mock y sigue funcionando, en vez de
 * romperse en mitad de una demo.
 *
 * El caso contrario tambien importa: nunca se habla con la red real "por
 * accidente", porque ahi hay dinero de por medio — de juego hoy, no siempre.
 */
export function getPaymentProvider(): PaymentProvider {
  if (cached) return cached;

  const requested = process.env.PAYMENT_PROVIDER?.trim().toLowerCase();

  const walletAddressUrl = process.env.OPEN_PAYMENTS_WALLET_ADDRESS?.trim();
  const keyId = process.env.OPEN_PAYMENTS_KEY_ID?.trim();
  const privateKey = process.env.OPEN_PAYMENTS_PRIVATE_KEY?.trim();

  if (requested === "testnet") {
    if (walletAddressUrl && keyId && privateKey) {
      cached = new TestnetPaymentProvider({
        walletAddressUrl,
        keyId,
        // Vercel guarda los saltos de linea como \n literales; el SDK espera
        // saltos reales. Sin esta linea la llave se rechaza en produccion
        // aunque funcione en local.
        privateKey: privateKey.replace(/\\n/g, "\n"),
      });
      return cached;
    }

    console.warn(
      "[pago-abierto] PAYMENT_PROVIDER=testnet pero faltan credenciales de Open Payments. Se usa el proveedor mock.",
    );
  }

  cached = new MockPaymentProvider();
  return cached;
}

/** Util para mostrar en la interfaz contra que esta corriendo la app. */
export function getProviderName(): "testnet" | "mock" {
  return getPaymentProvider().name;
}

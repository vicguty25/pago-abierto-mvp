import { nanoid } from "nanoid";

import type {
  CreateIncomingPaymentInput,
  CreateIncomingPaymentResult,
  FinishPaymentInput,
  FinishPaymentResult,
  PaymentProvider,
  StartPaymentInput,
  StartPaymentResult,
} from "./types";

/**
 * Proveedor simulado.
 *
 * Existe por una razon concreta: que cualquiera pueda clonar el repositorio y
 * ver el flujo completo en un minuto, sin abrir cuenta en ninguna parte. Imita
 * la forma de Open Payments — incluida la redireccion a una pantalla de
 * consentimiento — para que la version real no requiera cambiar ni una linea
 * de la aplicacion.
 *
 * Lo que NO hace: mover dinero, validar firmas, ni hablar con la red. Todo lo
 * que devuelve es local.
 */
export class MockPaymentProvider implements PaymentProvider {
  readonly name = "mock" as const;

  constructor(private readonly appUrl: string) {}

  async createIncomingPayment(
    input: CreateIncomingPaymentInput,
  ): Promise<CreateIncomingPaymentResult> {
    // La URL es ficticia pero conserva la forma de un recurso de Open Payments,
    // para que nada en la app dependa de si es real.
    return {
      incomingPaymentUrl: `${this.appUrl}/mock-wallet/incoming/${input.requestId}`,
    };
  }

  async startPayment(input: StartPaymentInput): Promise<StartPaymentResult> {
    const consent = new URL("/mock-wallet/consent", this.appUrl);
    consent.searchParams.set("return", input.returnUrl);
    consent.searchParams.set("nonce", input.nonce);
    consent.searchParams.set("interact_ref", nanoid(16));

    return {
      redirectUrl: consent.toString(),
      continueUri: `${this.appUrl}/mock-wallet/continue/${nanoid(10)}`,
      continueToken: nanoid(24),
      quoteId: `mock-quote-${nanoid(10)}`,
      // El mock no cobra comision: el debito es igual al monto solicitado.
      // La testnet si la cobra, y ahi los numeros difieren.
      debitAmount: { value: 0, assetCode: "USD", assetScale: 2 },
    };
  }

  async finishPayment(
    input: FinishPaymentInput,
  ): Promise<FinishPaymentResult> {
    if (!input.interactRef) {
      throw new Error("Falta interact_ref en el retorno del consentimiento");
    }
    return { outgoingPaymentId: `mock-outgoing-${nanoid(10)}` };
  }

  /**
   * El mock no liquida nada, asi que no tiene un monto recibido que reportar.
   * Devolver null es mas honesto que inventar una cifra: quien llama ya sabe
   * cuanto se solicito y decide como cerrar la solicitud.
   */
  async getReceivedAmount(): Promise<null> {
    return null;
  }
}

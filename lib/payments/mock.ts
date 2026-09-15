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

  async createIncomingPayment(
    input: CreateIncomingPaymentInput,
  ): Promise<CreateIncomingPaymentResult> {
    // Un identificador opaco, no una URL de este servidor: asi el mock no
    // necesita saber en que dominio corre la app.
    return { incomingPaymentUrl: `urn:mock:incoming:${input.requestId}` };
  }

  async startPayment(input: StartPaymentInput): Promise<StartPaymentResult> {
    // El origen sale de la URL de retorno, que ya viene resuelta por quien
    // llama. Un componente menos que configurar mal.
    const origen = new URL(input.returnUrl).origin;
    const consent = new URL("/mock-wallet/consent", origen);
    consent.searchParams.set("return", input.returnUrl);
    consent.searchParams.set("nonce", input.nonce);
    consent.searchParams.set("interact_ref", nanoid(16));

    return {
      redirectUrl: consent.toString(),
      continueUri: `urn:mock:continue:${nanoid(10)}`,
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

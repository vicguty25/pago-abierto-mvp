/**
 * Contrato entre la aplicacion y el mundo de los pagos.
 *
 * La app nunca importa el SDK de Open Payments directamente. Habla con esta
 * interfaz, y el archivo index.ts decide si detras hay una red real o una
 * simulacion. Gracias a eso el repositorio se puede clonar y correr sin
 * credenciales, y el codigo que se demuestra en el hackathon es exactamente el
 * mismo que corre contra la red de pruebas.
 */

export type ProviderName = "testnet" | "mock";

export interface Money {
  /** Unidades minimas, siempre entero. 45000 = 450.00 con escala 2 */
  value: number;
  assetCode: string;
  assetScale: number;
}

export interface CreateIncomingPaymentInput {
  amount: Money;
  description: string;
  /** Slug publico de la solicitud, para poder rastrearla desde el wallet. */
  requestId: string;
  expiresAt: Date;
}

export interface CreateIncomingPaymentResult {
  /** URL absoluta del incoming payment. Es el "receiver" de la cotizacion. */
  incomingPaymentUrl: string;
}

export interface StartPaymentInput {
  /** Wallet address de quien paga. */
  payerWalletAddress: string;
  incomingPaymentUrl: string;
  /** Hacia donde vuelve el navegador tras aprobar o rechazar. */
  returnUrl: string;
  /** Viaja en el grant y regresa intacto: sirve para detectar respuestas cruzadas. */
  nonce: string;
}

export interface StartPaymentResult {
  /** Pantalla de consentimiento a la que se envia al cliente. */
  redirectUrl: string;
  /** Datos para retomar el grant cuando el cliente regrese. */
  continueUri: string;
  continueToken: string;
  quoteId: string;
  /** Lo que realmente se le va a debitar, incluidas comisiones de red. */
  debitAmount: Money;
}

export interface FinishPaymentInput {
  payerWalletAddress: string;
  continueUri: string;
  continueToken: string;
  /** Referencia que devuelve la pantalla de consentimiento. */
  interactRef: string;
  quoteId: string;
}

export interface FinishPaymentResult {
  outgoingPaymentId: string;
}

export interface PaymentProvider {
  readonly name: ProviderName;

  /** Paso 1 — abrir el cobro en la wallet que recibe. */
  createIncomingPayment(
    input: CreateIncomingPaymentInput,
  ): Promise<CreateIncomingPaymentResult>;

  /** Paso 2 — cotizar y pedir autorizacion interactiva al pagador. */
  startPayment(input: StartPaymentInput): Promise<StartPaymentResult>;

  /** Paso 3 — con el consentimiento dado, ejecutar el pago. */
  finishPayment(input: FinishPaymentInput): Promise<FinishPaymentResult>;

  /**
   * Paso 4 — cuanto llego de verdad.
   *
   * Se consulta el incoming payment en vez de confiar en que el outgoing
   * payment se creo: que el pago se haya ordenado no significa que se liquido.
   *
   * Devuelve null cuando el proveedor no puede verificar el monto — es el caso
   * del mock, que no liquida nada. Quien llama decide que hacer con esa duda,
   * en lugar de recibir un numero inventado.
   */
  getReceivedAmount(incomingPaymentUrl: string): Promise<Money | null>;
}

/** Error con mensaje ya apto para mostrarle al usuario. */
export class PaymentProviderError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "PaymentProviderError";
  }
}

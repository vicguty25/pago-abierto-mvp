import {
  createAuthenticatedClient,
  isFinalizedGrantWithAccessToken,
  isPendingGrant,
  type AuthenticatedClient,
  type Grant,
  type PendingGrant,
} from "@interledger/open-payments";

import {
  PaymentProviderError,
  type CreateIncomingPaymentInput,
  type CreateIncomingPaymentResult,
  type FinishPaymentInput,
  type FinishPaymentResult,
  type Money,
  type PaymentProvider,
  type StartPaymentInput,
  type StartPaymentResult,
} from "./types";

export interface TestnetConfig {
  /** Wallet address que recibe los cobros. */
  walletAddressUrl: string;
  keyId: string;
  privateKey: string;
}

/**
 * Proveedor real: habla Open Payments contra la red de pruebas de Interledger.
 *
 * El protocolo tiene tres actores y conviene tenerlos presentes al leer esto:
 *   - el wallet que COBRA, donde se abre el incoming payment
 *   - el wallet que PAGA, contra el que se cotiza y se ordena el pago
 *   - el servidor de autorizacion de cada uno, que emite grants GNAP
 *
 * Cada operacion necesita su propio grant. Los de incoming payment y quote son
 * no interactivos; el de outgoing payment exige que una persona apruebe en la
 * pantalla de su wallet, y por eso el flujo se parte en startPayment y
 * finishPayment.
 */
export class TestnetPaymentProvider implements PaymentProvider {
  readonly name = "testnet" as const;

  private client: AuthenticatedClient | null = null;

  constructor(private readonly config: TestnetConfig) {}

  /**
   * El cliente firma cada peticion con la llave privada, asi que se construye
   * una sola vez y se reutiliza. Es async porque el SDK valida la llave al
   * inicializarse.
   */
  private async getClient(): Promise<AuthenticatedClient> {
    if (!this.client) {
      this.client = await createAuthenticatedClient({
        walletAddressUrl: this.config.walletAddressUrl,
        keyId: this.config.keyId,
        privateKey: this.config.privateKey,
      });
    }
    return this.client;
  }

  async createIncomingPayment(
    input: CreateIncomingPaymentInput,
  ): Promise<CreateIncomingPaymentResult> {
    const client = await this.getClient();

    try {
      const walletAddress = await client.walletAddress.get({
        url: this.config.walletAddressUrl,
      });

      // Grant no interactivo: el dueno del wallet pide cobrar en su propio
      // wallet, asi que no hay nada que aprobar.
      const grant = await client.grant.request(
        { url: walletAddress.authServer },
        {
          access_token: {
            access: [{ type: "incoming-payment", actions: ["create", "read"] }],
          },
        },
      );

      const accessToken = tokenDeGrantDirecto(
        grant,
        "El servidor de autorizacion pidio interaccion para abrir el cobro, lo que no deberia ocurrir con tu propia wallet.",
      );

      const incomingPayment = await client.incomingPayment.create(
        {
          url: walletAddress.resourceServer,
          accessToken,
        },
        {
          walletAddress: walletAddress.id,
          incomingAmount: {
            value: String(input.amount.value),
            assetCode: input.amount.assetCode,
            assetScale: input.amount.assetScale,
          },
          expiresAt: input.expiresAt.toISOString(),
          metadata: {
            description: input.description,
            requestId: input.requestId,
          },
        },
      );

      return { incomingPaymentUrl: incomingPayment.id };
    } catch (error) {
      throw wrap(error, "No se pudo abrir el cobro en la red de Interledger.");
    }
  }

  async startPayment(input: StartPaymentInput): Promise<StartPaymentResult> {
    const client = await this.getClient();

    try {
      const payerWallet = await client.walletAddress.get({
        url: normalizeWalletAddress(input.payerWalletAddress),
      });

      // 1. Grant de cotizacion contra el servidor del PAGADOR.
      const quoteGrant = await client.grant.request(
        { url: payerWallet.authServer },
        {
          access_token: {
            access: [{ type: "quote", actions: ["create", "read"] }],
          },
        },
      );

      const quoteToken = tokenDeGrantDirecto(
        quoteGrant,
        "La wallet del pagador exige aprobacion manual para cotizar; no es compatible con este MVP.",
      );

      // 2. La cotizacion fija cuanto se debita para que llegue el monto exacto.
      const quote = await client.quote.create(
        {
          url: payerWallet.resourceServer,
          accessToken: quoteToken,
        },
        {
          walletAddress: payerWallet.id,
          receiver: input.incomingPaymentUrl,
          method: "ilp",
        },
      );

      // 3. Grant de pago: este SI es interactivo. Se acota al monto exacto de
      //    la cotizacion, de modo que el consentimiento no autorice nada mas.
      const outgoingGrant = await client.grant.request(
        { url: payerWallet.authServer },
        {
          access_token: {
            access: [
              {
                type: "outgoing-payment",
                actions: ["create", "read"],
                identifier: payerWallet.id,
                // El esquema admite debitAmount O receiveAmount, nunca ambos.
                // Se elige debitAmount porque es el limite que protege a quien
                // paga: topa lo que puede salir de su cuenta.
                limits: { debitAmount: quote.debitAmount },
              },
            ],
          },
          interact: {
            start: ["redirect"],
            finish: {
              method: "redirect",
              uri: input.returnUrl,
              nonce: input.nonce,
            },
          },
        },
      );

      if (!isPendingGrant(outgoingGrant)) {
        throw new PaymentProviderError(
          "La wallet del pagador autorizo el pago sin pedir consentimiento. Este flujo requiere aprobacion explicita.",
        );
      }

      return {
        redirectUrl: outgoingGrant.interact.redirect,
        continueUri: outgoingGrant.continue.uri,
        continueToken: outgoingGrant.continue.access_token.value,
        quoteId: quote.id,
        debitAmount: {
          value: Number(quote.debitAmount.value),
          assetCode: quote.debitAmount.assetCode,
          assetScale: quote.debitAmount.assetScale,
        },
      };
    } catch (error) {
      throw wrap(
        error,
        "No se pudo preparar el pago. Revisa que la wallet address sea correcta y este activa.",
      );
    }
  }

  async finishPayment(input: FinishPaymentInput): Promise<FinishPaymentResult> {
    const client = await this.getClient();

    try {
      // El consentimiento ya ocurrio: se canjea interact_ref por el token real.
      const grant = await client.grant.continue(
        { url: input.continueUri, accessToken: input.continueToken },
        { interact_ref: input.interactRef },
      );

      if (!isFinalizedGrantWithAccessToken(grant)) {
        throw new PaymentProviderError(
          "El consentimiento todavia no esta finalizado. Vuelve a intentarlo en unos segundos.",
        );
      }

      const payerWallet = await client.walletAddress.get({
        url: normalizeWalletAddress(input.payerWalletAddress),
      });

      const outgoingPayment = await client.outgoingPayment.create(
        {
          url: payerWallet.resourceServer,
          accessToken: grant.access_token.value,
        },
        {
          walletAddress: payerWallet.id,
          quoteId: input.quoteId,
        },
      );

      return { outgoingPaymentId: outgoingPayment.id };
    } catch (error) {
      throw wrap(error, "El pago fue autorizado pero no se pudo ejecutar.");
    }
  }

  async getReceivedAmount(incomingPaymentUrl: string): Promise<Money | null> {
    const client = await this.getClient();

    try {
      const walletAddress = await client.walletAddress.get({
        url: this.config.walletAddressUrl,
      });

      const grant = await client.grant.request(
        { url: walletAddress.authServer },
        {
          access_token: {
            access: [{ type: "incoming-payment", actions: ["read"] }],
          },
        },
      );

      if (isPendingGrant(grant) || !grant.access_token) return null;

      const incomingPayment = await client.incomingPayment.get({
        url: incomingPaymentUrl,
        accessToken: grant.access_token.value,
      });

      const received = incomingPayment.receivedAmount;
      return {
        value: Number(received.value),
        assetCode: received.assetCode,
        assetScale: received.assetScale,
      };
    } catch {
      // No poder confirmar no es lo mismo que un pago fallido. Se devuelve null
      // y quien llama mantiene el estado anterior en vez de marcar un error.
      return null;
    }
  }
}

/**
 * Las wallet addresses se escriben de dos formas equivalentes:
 * $ilp.interledger-test.dev/alice y https://ilp.interledger-test.dev/alice
 * El SDK solo acepta la segunda.
 */
function normalizeWalletAddress(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith("$")) {
    return `https://${trimmed.slice(1)}`;
  }
  return trimmed;
}

/**
 * Extrae el token de un grant que se esperaba no interactivo.
 *
 * El tipo Grant declara access_token como opcional porque un grant puede
 * resolverse con un "subject" en vez de un token. En los grants que pide este
 * proveedor eso seria una anomalia del servidor, no un caso a manejar, asi que
 * se corta aqui con un mensaje que dice que se esperaba.
 */
function tokenDeGrantDirecto(
  grant: PendingGrant | Grant,
  mensajeSiInteractivo: string,
): string {
  if (isPendingGrant(grant)) {
    throw new PaymentProviderError(mensajeSiInteractivo);
  }

  if (!grant.access_token) {
    throw new PaymentProviderError(
      "El servidor de autorizacion concedio el permiso pero no devolvio un token de acceso.",
    );
  }

  return grant.access_token.value;
}

function wrap(error: unknown, fallback: string): PaymentProviderError {
  if (error instanceof PaymentProviderError) return error;
  return new PaymentProviderError(fallback, error);
}

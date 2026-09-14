import { relations } from "drizzle-orm";
import {
  bigint,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

/**
 * Ciclo de vida de una solicitud de cobro.
 *
 *   created  la solicitud existe y tiene un incoming payment abierto
 *   pending  el cliente autorizo el pago y esta en la pantalla de consentimiento
 *   paid     el incoming payment recibio el monto completo
 *   failed   el grant se rechazo o el outgoing payment no se pudo completar
 *   expired  paso la fecha limite sin llegar a paid
 *
 * La metrica norte del producto es paid / created, asi que estos nombres son
 * contrato: cambiarlos rompe el dashboard.
 */
export const paymentStatus = pgEnum("payment_status", [
  "created",
  "pending",
  "paid",
  "failed",
  "expired",
]);

export const paymentRequests = pgTable(
  "payment_requests",
  {
    /** nanoid de 12 caracteres. Es publico y viaja en la URL: /p/{id} */
    id: text("id").primaryKey(),

    // --- lo que se cobra ---------------------------------------------------
    /** Monto en unidades minimas. 450 USD con escala 2 => 45000 */
    amountMinor: bigint("amount_minor", { mode: "number" }).notNull(),
    assetCode: text("asset_code").notNull(),
    assetScale: integer("asset_scale").notNull(),
    description: text("description").notNull(),

    // --- quienes participan ------------------------------------------------
    payeeName: text("payee_name").notNull(),
    clientName: text("client_name"),
    clientCountry: text("client_country"),
    /** Wallet address que paga. Se conoce recien cuando el cliente la escribe. */
    payerWalletAddress: text("payer_wallet_address"),

    // --- estado ------------------------------------------------------------
    status: paymentStatus("status").notNull().default("created"),
    /** "testnet" | "mock" — queda registrado con que proveedor se creo. */
    provider: text("provider").notNull(),
    receivedMinor: bigint("received_minor", { mode: "number" })
      .notNull()
      .default(0),

    // --- referencias de Open Payments --------------------------------------
    /** URL del incoming payment en el wallet que cobra. */
    incomingPaymentUrl: text("incoming_payment_url"),
    quoteId: text("quote_id"),
    outgoingPaymentId: text("outgoing_payment_id"),
    /**
     * URI y token para continuar un grant interactivo tras el consentimiento.
     * Son secretos de vida corta y solo se leen desde el servidor.
     */
    grantContinueUri: text("grant_continue_uri"),
    grantContinueToken: text("grant_continue_token"),

    // --- tiempos -----------------------------------------------------------
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    index("payment_requests_status_idx").on(table.status),
    index("payment_requests_created_at_idx").on(table.createdAt),
  ],
);

/**
 * Bitacora append-only. Nunca se actualiza ni se borra una fila.
 *
 * Sirve para dos cosas a la vez: depurar un pago que se trabo, y alimentar el
 * embudo created -> pending -> paid sin tener que preguntarle nada al usuario.
 */
export const paymentEvents = pgTable(
  "payment_events",
  {
    id: text("id").primaryKey(),
    requestId: text("request_id")
      .notNull()
      .references(() => paymentRequests.id, { onDelete: "cascade" }),
    /** p.ej. "request.created", "grant.pending", "payment.paid" */
    type: text("type").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("payment_events_request_id_idx").on(table.requestId)],
);

export const paymentRequestsRelations = relations(
  paymentRequests,
  ({ many }) => ({ events: many(paymentEvents) }),
);

export const paymentEventsRelations = relations(paymentEvents, ({ one }) => ({
  request: one(paymentRequests, {
    fields: [paymentEvents.requestId],
    references: [paymentRequests.id],
  }),
}));

export type PaymentRequest = typeof paymentRequests.$inferSelect;
export type NewPaymentRequest = typeof paymentRequests.$inferInsert;
export type PaymentEvent = typeof paymentEvents.$inferSelect;

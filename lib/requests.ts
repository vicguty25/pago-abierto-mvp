import { desc, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

import { paymentEvents, paymentRequests } from "@/db/schema";
import { db } from "@/lib/db";

/** Una solicitud vive 7 dias. Despues el incoming payment ya no acepta fondos. */
export const REQUEST_TTL_DAYS = 7;

/**
 * Registra un hecho en la bitacora.
 *
 * Nunca lanza: si la bitacora falla no se debe tumbar un pago que si ocurrio.
 * Se pierde observabilidad, no dinero.
 */
export async function recordEvent(
  requestId: string,
  type: string,
  payload?: Record<string, unknown>,
): Promise<void> {
  try {
    await db.insert(paymentEvents).values({
      id: nanoid(16),
      requestId,
      type,
      payload: payload ?? null,
    });
  } catch (error) {
    console.error("[pago-abierto] no se pudo registrar el evento", type, error);
  }
}

export async function getRequestBySlug(slug: string) {
  const [row] = await db
    .select()
    .from(paymentRequests)
    .where(eq(paymentRequests.id, slug))
    .limit(1);
  return row ?? null;
}

export async function listRequests(limit = 50) {
  return db
    .select()
    .from(paymentRequests)
    .orderBy(desc(paymentRequests.createdAt))
    .limit(limit);
}

export interface Funnel {
  created: number;
  pending: number;
  paid: number;
  failed: number;
  /** La metrica norte, en porcentaje entero. */
  conversion: number;
  /** Mediana no: promedio de horas entre created y paid. null si aun no hay pagos. */
  horasPromedioHastaPago: number | null;
}

/**
 * Embudo del producto. Se calcula en la base y no en memoria porque el
 * dashboard tiene que seguir siendo barato cuando haya miles de filas.
 */
export async function getFunnel(): Promise<Funnel> {
  const [row] = await db
    .select({
      total: sql<number>`count(*)::int`,
      pending: sql<number>`count(*) filter (where ${paymentRequests.status} = 'pending')::int`,
      paid: sql<number>`count(*) filter (where ${paymentRequests.status} = 'paid')::int`,
      failed: sql<number>`count(*) filter (where ${paymentRequests.status} in ('failed','expired'))::int`,
      horas: sql<number | null>`avg(extract(epoch from (${paymentRequests.paidAt} - ${paymentRequests.createdAt})) / 3600.0)`,
    })
    .from(paymentRequests);

  const total = row?.total ?? 0;
  const paid = row?.paid ?? 0;

  return {
    created: total,
    pending: row?.pending ?? 0,
    paid,
    failed: row?.failed ?? 0,
    conversion: total === 0 ? 0 : Math.round((paid / total) * 100),
    horasPromedioHastaPago:
      row?.horas == null ? null : Math.round(Number(row.horas) * 10) / 10,
  };
}

/**
 * Marca como expiradas las solicitudes que pasaron su fecha limite.
 *
 * Se ejecuta de forma oportunista al abrir el dashboard en vez de con un cron:
 * para un MVP, un cron es infraestructura que hay que mantener y vigilar sin
 * que aporte nada al aprendizaje.
 */
export async function expireStaleRequests(): Promise<number> {
  const result = await db
    .update(paymentRequests)
    .set({ status: "expired", updatedAt: new Date() })
    .where(
      sql`${paymentRequests.status} in ('created','pending') and ${paymentRequests.expiresAt} < now()`,
    )
    .returning({ id: paymentRequests.id });

  return result.length;
}

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/db/schema";

type Database = ReturnType<typeof drizzle<typeof schema>>;

let instancia: Database | null = null;

/**
 * La conexion se crea la primera vez que alguien la pide, no al importar el
 * modulo. Next importa cada route handler durante el build, y si esto fallara
 * ahi el despliegue se caeria por una variable que solo hace falta en tiempo
 * de ejecucion.
 */
function connect(): Database {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "Falta DATABASE_URL. Copia .env.example a .env.local y completa la cadena de conexion.",
    );
  }

  /**
   * Supabase expone un "transaction pooler" en el puerto 6543 que es lo
   * correcto para funciones serverless. Ese pooler no soporta prepared
   * statements, de ahi prepare:false. Sin eso los queries fallan en produccion
   * pero funcionan en local contra el puerto 5432, que es la peor forma
   * posible de descubrir el problema.
   */
  const client = postgres(connectionString, { prepare: false, max: 1 });

  return drizzle(client, { schema });
}

/**
 * Proxy para conservar la ergonomia de `db.select()` sin conectar al importar.
 */
export const db = new Proxy({} as Database, {
  get(_target, prop, receiver) {
    instancia ??= connect();
    return Reflect.get(instancia, prop, receiver);
  },
});

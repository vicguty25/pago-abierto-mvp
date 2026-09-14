import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/db/schema";

type Database = ReturnType<typeof drizzle<typeof schema>>;
type Cliente = ReturnType<typeof postgres>;

/**
 * El cliente se guarda en globalThis, no en un module-scope suelto.
 *
 * Next crea varias instancias del grafo de modulos — una por route handler, y
 * otra en cada recarga en caliente — asi que un cliente a nivel de modulo se
 * construye muchas veces y cada copia abre su propia conexion. Contra el
 * transaction pooler de Supabase eso agota el limite de conexiones en minutos:
 * los queries dejan de responder y mueren en el statement timeout del servidor,
 * que se ve como lentitud y no como un error de conexion.
 *
 * globalThis sobrevive a ambas cosas, asi que todas las copias comparten un
 * unico cliente. En produccion ademas reutiliza la conexion entre invocaciones
 * tibias de la misma instancia serverless.
 */
const globalParaDb = globalThis as unknown as {
  __pagoAbiertoCliente?: Cliente;
  __pagoAbiertoDb?: Database;
};

function connect(): Database {
  if (globalParaDb.__pagoAbiertoDb) return globalParaDb.__pagoAbiertoDb;

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "Falta DATABASE_URL. Copia .env.example a .env.local y completa la cadena de conexion.",
    );
  }

  /**
   * Supabase expone un "transaction pooler" en el puerto 6543 que es lo
   * correcto para serverless. Ese pooler no soporta prepared statements, de ahi
   * prepare:false. Sin eso los queries fallan en produccion pero funcionan en
   * local contra el puerto 5432, que es la peor forma posible de descubrirlo.
   */
  const cliente =
    globalParaDb.__pagoAbiertoCliente ??
    postgres(connectionString, {
      prepare: false,
      max: 3,
      idle_timeout: 20,
      connect_timeout: 15,
    });

  globalParaDb.__pagoAbiertoCliente = cliente;

  const db = drizzle(cliente, { schema });
  globalParaDb.__pagoAbiertoDb = db;

  return db;
}

/**
 * Proxy para conservar la ergonomia de `db.select()` sin conectar al importar.
 *
 * Importa porque Next carga cada route handler durante el build, y si la
 * conexion se creara ahi el despliegue fallaria por una variable que solo hace
 * falta en tiempo de ejecucion.
 */
export const db = new Proxy({} as Database, {
  get(_target, prop) {
    const instancia = connect();
    // El receptor es la instancia real, no el proxy: si fuera el proxy, los
    // getters internos de drizzle se ejecutarian con un `this` equivocado.
    return Reflect.get(instancia, prop, instancia);
  },
});

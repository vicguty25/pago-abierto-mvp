# Arquitectura

## Por qué hay un adaptador de pagos

La aplicación nunca importa el SDK de Open Payments. Habla con la interfaz
`PaymentProvider` (`lib/payments/types.ts`), y `lib/payments/index.ts` decide
qué hay detrás.

Eso resuelve dos problemas a la vez:

1. **El repositorio se puede clonar y correr en un minuto**, sin abrir cuenta en
   ninguna parte. Quien evalúa el proyecto ve el flujo completo antes de decidir
   si quiere configurar credenciales.
2. **El código que se demuestra es el mismo que corre contra la red real.** No
   hay una rama "de demo" que diverja de la de verdad.

La selección es conservadora a propósito: solo se usa la red real si
`PAYMENT_PROVIDER=testnet` **y** están las tres credenciales. Si falta una, se
cae al mock con una advertencia en consola en vez de romperse a mitad de una
demostración. Y al revés, nunca se habla con la red real por accidente.

```
app/ ──► lib/payments/index.ts ──┬──► testnet.ts ──► @interledger/open-payments
                                 └──► mock.ts    ──► /mock-wallet/consent
```

## El flujo de Open Payments, paso a paso

El protocolo tiene tres actores: el wallet que **cobra**, el wallet que **paga**,
y el servidor de autorización de cada uno, que emite grants GNAP. Cada operación
necesita su propio grant.

```
1. CREAR                                    POST /api/requests
   grant incoming-payment (no interactivo)
   └─ incoming payment abierto en el wallet que cobra
      status = created

2. PAGAR                          POST /api/requests/[slug]/pay
   el cliente escribe su wallet address
   ├─ grant quote (no interactivo, contra el servidor del PAGADOR)
   ├─ quote  →  fija cuánto se debita para que llegue el monto exacto
   └─ grant outgoing-payment (INTERACTIVO, acotado al monto de la quote)
      status = pending  →  redirect a la pantalla de consentimiento

3. VOLVER                              GET /p/[slug]/return?interact_ref=…
   ├─ continue grant  →  canjea interact_ref por el token real
   ├─ outgoing payment  →  el dinero se mueve
   └─ leer receivedAmount del incoming payment
      status = paid

4. MEDIR                                            GET /dashboard
   embudo created → pending → paid
```

### Tres detalles que no son obvios

**Por qué el paso 2 y el 3 están separados.** Los grants de incoming payment y
de quote son no interactivos: nadie tiene que aprobar nada. El de outgoing
payment sí exige que una persona apruebe en la pantalla de su wallet, y esa
aprobación ocurre fuera de esta aplicación. Por eso el flujo se parte, y por eso
hay que guardar `grantContinueUri` y `grantContinueToken` en la base: son lo
único que permite retomar la conversación cuando el cliente vuelve.

**Por qué se consulta `receivedAmount` en vez de confiar en el outgoing
payment.** Que un pago se haya ordenado no significa que se liquidó. El
`receivedAmount` del incoming payment es la única fuente de verdad sobre cuánto
llegó realmente.

**Por qué el grant se acota con `limits.debitAmount`.** El consentimiento que
firma el cliente autoriza exactamente el monto de la cotización, no un permiso
abierto sobre su wallet. El esquema admite `debitAmount` o `receiveAmount`, no
ambos; se elige `debitAmount` porque es el límite que protege a quien paga.

## Runtime

Todo route handler que toque el SDK declara `export const runtime = "nodejs"`.
El SDK firma cada petición con HTTP Message Signatures usando Ed25519 sobre
`node:crypto`, que no existe en el runtime edge. `next.config.ts` además lo
marca en `serverExternalPackages` para que no se intente empaquetar.

## Datos

Dos tablas, en `db/schema.ts`:

- **`payment_requests`** — el estado actual de cada solicitud.
- **`payment_events`** — bitácora append-only. Nunca se actualiza ni se borra
  una fila.

La bitácora no es decorativa: sirve para depurar un pago que se trabó **y** para
alimentar el embudo sin tener que preguntarle nada al usuario. `recordEvent()`
nunca lanza excepciones — si la bitácora falla no se debe tumbar un pago que sí
ocurrió. Se pierde observabilidad, no dinero.

### Sobre RLS

La aplicación habla directamente con Postgres vía drizzle, no con PostgREST. Sin
RLS, las tablas quedarían legibles con la clave anónima de Supabase, que es
pública. La migración `0001_rls.sql` activa RLS y **no crea ninguna política**:
eso deniega todo acceso vía API, mientras la conexión directa del servidor sigue
funcionando porque el rol `postgres` omite RLS.

El linter de Supabase reporta esto como INFO (`rls_enabled_no_policy`). Es el
diseño buscado, no un descuido.

## Decisiones que un revisor va a cuestionar

**No hay autenticación.** El slug de 12 caracteres es la credencial. Es
deliberado: mantiene el flujo feliz por debajo de tres minutos, que es lo que se
está midiendo. Está anotado en el anti-scope de `lean.md` como lo primero que
hay que cambiar si el producto avanza.

**Las solicitudes vencidas se limpian al abrir el dashboard**, no con un cron.
Para un MVP, un cron es infraestructura que hay que mantener y vigilar sin que
aporte nada al aprendizaje.

**El embudo se calcula en SQL**, no en memoria, para que el dashboard siga
siendo barato cuando haya miles de filas.

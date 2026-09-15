# Conectar la red de pruebas de Interledger

Sin estos pasos la aplicación funciona igual, con el proveedor `mock`. Esto es
para ver dinero (de juego) moviéndose de verdad entre dos wallets.

Toma unos diez minutos.

## 1. Crear la cuenta de prueba

Entra a [wallet.interledger-test.dev](https://wallet.interledger-test.dev) y
crea una cuenta.

El registro pide pasos de KYC. **Solo el correo tiene que ser real**; el resto de
los datos pueden ser ficticios. Es una red de pruebas y el dinero es de juego.

## 2. Crear dos wallet addresses

En el panel, usa **Add wallet address** dos veces:

| Nombre sugerido | Papel |
|---|---|
| `freelancer` | recibe los cobros — es la que va en las variables de entorno |
| `cliente` | paga — se escribe en la pantalla pública al momento de pagar |

Con dos direcciones puedes completar el flujo de punta a punta tú solo, sin
necesitar a otra persona. Fondea ambas con dinero de juego desde el panel.

La wallet address se ve así:

```
https://ilp.interledger-test.dev/freelancer
```

La aplicación también acepta la forma corta `$ilp.interledger-test.dev/freelancer`
y la normaliza, porque el SDK solo acepta la larga.

## 3. Generar el par de llaves

En la sección **Developer Keys** de la wallet address que cobra, pulsa
**Generate public & private key**.

Eso hace dos cosas:

- muestra un **Key ID** — un UUID
- descarga un archivo **`private.key`**

La llave pública queda publicada en la wallet address. Cada petición que hace la
aplicación va firmada con la privada, y el servidor la verifica contra la
pública. Por eso la llave privada es la credencial real del sistema.

## 4. Configurar las variables

En `.env.local`:

```bash
PAYMENT_PROVIDER="testnet"
OPEN_PAYMENTS_WALLET_ADDRESS="https://ilp.interledger-test.dev/freelancer"
OPEN_PAYMENTS_KEY_ID="el-uuid-que-mostro-el-panel"
OPEN_PAYMENTS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMC4CAQ...\n-----END PRIVATE KEY-----"
```

Para la llave privada en una sola línea:

```bash
awk '{printf "%s\\n", $0}' private.key
```

> `.gitignore` excluye `.env*` y `*.key`. Verifícalo antes del primer commit con
> `git ls-files | grep -Ei 'env|key'` — debe salir vacío.

### En Vercel

Las mismas cuatro variables. `NEXT_PUBLIC_APP_URL` es opcional: si se deja
vacía, la app deduce su dominio del de producción de Vercel o del host de la
petición. Solo hace falta fijarla cuando haya un dominio propio.

Vercel guarda los saltos de línea como `\n` literales.
`lib/payments/index.ts` los convierte de vuelta antes de pasar la llave al SDK.

## 5. Probar

```bash
npm run dev
```

1. Crea una solicitud de cobro por 10 USD.
2. Abre el link `/p/…` y pega la wallet address del **cliente**.
3. Te lleva a la pantalla de consentimiento del test wallet. Aprueba.
4. Vuelves a `/p/…` con estado **Pagado**.
5. Comprueba en [wallet.interledger-test.dev](https://wallet.interledger-test.dev)
   que el saldo se movió entre las dos direcciones.

Ese último paso es el que prueba que la integración es real y no una animación.

## Si algo falla

**"No se pudo abrir el cobro en la red de Interledger"** — casi siempre es la
llave privada mal formateada. Revisa que los `\n` estén como saltos reales y que
el `keyId` corresponda a esa misma llave.

**"No se pudo preparar el pago"** — la wallet address del pagador está mal
escrita o no existe. Ábrela en el navegador: debe devolver JSON, no un 404.

**"El consentimiento todavía no está finalizado"** — pasa si se vuelve a la URL
de retorno antes de aprobar, o si se recarga esa página. Vuelve a empezar el
pago desde `/p/[slug]`.

## Referencias

- [openpayments.dev](https://openpayments.dev) — especificación y snippets
- [Antes de empezar](https://openpayments.dev/sdk/before-you-begin/) — guía oficial del test wallet
- [interledger/open-payments-node](https://github.com/interledger/open-payments-node) — SDK

/**
 * De donde sale la URL publica de la app.
 *
 * Importa mas de lo que parece: la pantalla de consentimiento de Open Payments
 * redirige de vuelta a esta direccion. Si apunta a localhost en produccion, el
 * cliente aprueba el pago y se queda colgado en una pagina que no existe.
 *
 * Por eso no se depende de que alguien recuerde configurar una variable. Se
 * deduce, en este orden:
 *
 *   1. NEXT_PUBLIC_APP_URL — si hay dominio propio, manda
 *   2. el dominio de produccion de Vercel — estable entre despliegues
 *   3. el host de la peticion actual — funciona en previews y en local
 */
export function appUrlFrom(request: Request): string {
  const explicita = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicita) return sinBarraFinal(explicita);

  const produccion = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (produccion) return `https://${sinBarraFinal(produccion)}`;

  return new URL(request.url).origin;
}

function sinBarraFinal(valor: string): string {
  return valor.replace(/\/+$/, "");
}

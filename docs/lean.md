# Lean canvas — Pago Abierto

> Documento de trabajo. Se actualiza cuando el experimento devuelve datos,
> no cuando suena mejor.

## El problema, sin adornos

Un freelancer en Colombia le factura USD 450 a un cliente en Estados Unidos.
El cliente pregunta "¿cómo te pago?" y ahí empieza el problema:

- La transferencia internacional tarda entre 2 y 5 días hábiles.
- Los intermediarios descuentan una comisión que nadie ve hasta que el dinero llega.
- El cliente tiene que pedirle a su banco un SWIFT con datos que no entiende.
- Si algo sale mal, ninguna de las dos partes sabe en qué punto se quedó.

El resultado no es solo la demora. Es que el freelancer queda pidiendo disculpas
por un proceso que no controla, frente a un cliente que ya pagó.

## Usuario

Diseñadores, marketers y desarrolladores freelance en LATAM que facturan a
clientes en Estados Unidos o Europa. Facturan entre USD 300 y 3.000 por proyecto.
No tienen entidad legal en el país del cliente.

**No es para**: empresas con equipo financiero, marketplaces que retienen fondos,
ni gente que cobra dentro de su propio país.

## Job to be done

> Cuando termino un proyecto para un cliente en el exterior,
> quiero mandarle un link que él entienda en diez segundos,
> para cobrar sin parecer un trámite bancario y sin perseguirlo por WhatsApp.

Lo que se contrata aquí no es "transferir dinero". Es **no quedar mal**.

## Hipótesis a validar

**Si** el freelancer envía una solicitud de cobro donde el cliente ve el monto
exacto, el concepto, quién cobra y en qué estado va el pago,
**entonces** una proporción mayor de solicitudes llega a estado `paid`
que con el método actual de mandar datos bancarios por mensaje.

Lo que se está probando es la **claridad**, no la tecnología. Interledger es el
medio, no la propuesta de valor.

## Métrica norte

**Porcentaje de solicitudes creadas que llegan a estado `paid`.**

Se mide sola: cada cambio de estado deja un registro en `payment_events`, y el
dashboard divide `paid` entre `created`. No hay que preguntarle nada a nadie.

Métricas de apoyo:
- Tiempo entre `created` y `paid` (la promesa es horas, no días).
- Solicitudes que se quedan en `pending` — ahí está la fricción del consentimiento.

## Experimento de 7 días

| Día | Acción |
|-----|--------|
| 1 | Desplegar y pasar 3 cobros reales de Víctor por la red de pruebas |
| 2–3 | Enviar la solicitud a 5 freelancers del círculo cercano, sin explicar nada |
| 4 | Entrevistar a los que no la completaron. La pregunta es *dónde se trabaron*, no *si les gustó* |
| 5–6 | Corregir el punto de fricción más repetido |
| 7 | Medir: ¿subió el porcentaje `paid`? |

**Señal de continuar**: más de la mitad de las solicitudes llegan a `paid` sin
que nadie tenga que explicar el flujo por fuera de la app.

**Señal de parar**: la gente completa el pago pero solo después de que alguien
les explica por chat qué hacer. Eso significa que la pantalla no se sostiene sola.

## Anti-scope

Cosas que este MVP **no** hace, a propósito:

- **No hay KYC real.** Corre sobre la red de pruebas de Interledger, con dinero de juego.
- **No hay conversión a moneda local ni retiro a banco.** El último tramo se sale del alcance.
- **No hay multi-moneda.** Una sola unidad por solicitud.
- **No hay facturación fiscal.** No emite documentos con validez tributaria.
- **No hay login.** El slug de la URL es la credencial. Es una decisión consciente
  para que el flujo feliz dure menos de tres minutos; si el producto avanza,
  es lo primero que hay que cambiar.
- **No hay cobros recurrentes ni suscripciones.**

Cada una de estas líneas es una tentación real durante un hackathon.
Están escritas para poder señalarlas cuando aparezcan.

# Sistema visual — Pago Abierto

## La decisión de fondo

Todo producto fintech con el que compite esta demo se ve igual: fondo azul
oscuro, acento violeta, degradados, algo que brilla. Pago Abierto va al revés
a propósito — **papel claro, tinta densa, un solo acento verde**.

La razón no es estética. El usuario que abre la pantalla de pago es un cliente
que no conoce la marca y está a punto de mover dinero. Un dashboard oscuro con
neón comunica "software"; el papel claro comunica "documento". Para cobrar,
parecer documento es mejor.

## Nombre

**Pago Abierto** — traducción directa de Open Payments. Se dice en español
porque el usuario que cobra es latinoamericano. Sin inventar una palabra que
nadie pueda deletrear por teléfono.

## Tipografía

| Uso | Familia | Por qué |
|-----|---------|---------|
| Títulos | **Sora** | Geométrica, ancha, con personalidad sin gritar |
| Texto | **DM Sans** | Neutral, legible en párrafos cortos |
| Montos | **JetBrains Mono** | Tabular: las cifras se alinean en columna y se comparan de un vistazo |

Los montos en monoespaciada no son un capricho. En una lista de cobros, las
cifras proporcionales bailan y obligan a leer dígito por dígito.

## Paleta

| Token | Hex | Uso |
|-------|-----|-----|
| `--papel` | `#FBFAF7` | Fondo de toda la app |
| `--tinta` | `#07130F` | Texto principal |
| `--esmeralda` | `#0F9D6E` | Acción primaria, estado pagado |
| `--profundo` | `#064E3B` | Hover, texto sobre esmeralda |
| `--alerta` | `#C2410C` | Fallo, expirado |
| `--ambar` | `#B45309` | Pendiente, en espera de consentimiento |
| `--borde` | `#E3E0D8` | Bordes de tarjetas y separadores |
| `--tenue` | `#6B7C74` | Texto secundario, etiquetas |

Un solo acento. Si algo necesita destacar y ya hay verde en pantalla, se resuelve
con peso tipográfico o con espacio, no agregando un color.

## Marca

`public/logo.svg` — dos corchetes que abren un camino con una flecha al centro.
Literal: un pago que pasa por una vía abierta. Trazo sólido, sin degradados,
sin brillo. Legible a 16 px en un favicon.

## Tono de voz

- Cifras exactas, nunca redondeadas para que se vean mejor.
- Los estados se nombran por lo que son: "Pagado", "Esperando confirmación",
  "Falló". Nunca "¡Todo listo! 🎉".
- Los errores dicen qué pasó y qué hacer. Sin "Ups".
- Español neutro. El cliente puede estar en Madrid o en Miami.

## Lo que no se hace

- Degradados, glassmorphism, sombras de colores.
- Emojis en la interfaz.
- Animaciones de celebración al completar un pago. El dinero llegó; eso ya es
  la buena noticia.
- Contadores regresivos que presionen al que paga.

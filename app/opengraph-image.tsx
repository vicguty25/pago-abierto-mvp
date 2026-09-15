import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "Pago Abierto — cobra al exterior sin explicar un SWIFT";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Imagen de previsualizacion, generada en el servidor.
 *
 * Se dibuja aqui en vez de subir un PNG para que no se desincronice de la
 * marca: usa los mismos tokens que el resto del producto, definidos en
 * docs/brand.md.
 */
export default function Imagen() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#FBFAF7",
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "#0F9D6E",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FBFAF7",
              fontSize: 26,
              fontWeight: 700,
            }}
          >
            →
          </div>
          <div style={{ fontSize: 30, color: "#07130F", fontWeight: 600 }}>
            Pago Abierto
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 26,
          }}
        >
          {/* Satori exige display:flex en cualquier div con mas de un hijo,
              asi que cada linea es su propio div en una columna. */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 76,
              lineHeight: 1.05,
              color: "#07130F",
              fontWeight: 700,
              letterSpacing: "-0.03em",
            }}
          >
            <div>Cobra al exterior</div>
            <div>sin explicar un SWIFT</div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 30,
              color: "#6B7C74",
              lineHeight: 1.35,
            }}
          >
            <div>Tu cliente abre un link, ve cuánto debe y autoriza</div>
            <div>desde su propia wallet.</div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "2px solid #E3E0D8",
            paddingTop: 26,
            fontSize: 24,
            color: "#6B7C74",
          }}
        >
          <div>Interledger Open Payments</div>
          <div style={{ color: "#064E3B", fontWeight: 600 }}>
            pago-abierto-mvp.vercel.app
          </div>
        </div>
      </div>
    ),
    size,
  );
}

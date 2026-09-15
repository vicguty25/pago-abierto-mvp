import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono, Sora } from "next/font/google";
import Link from "next/link";

import { Logo } from "@/components/logo";

import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-sora",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-jetbrains",
  display: "swap",
});

const TITULO = "Pago Abierto — cobra al exterior sin explicar un SWIFT";
const DESCRIPCION =
  "Solicitudes de cobro cross-border sobre Interledger Open Payments, para freelancers en LATAM que facturan a clientes en Estados Unidos y Europa.";

export const metadata: Metadata = {
  // Sin metadataBase, Next resuelve las URL de las imagenes contra localhost y
  // el enlace no se previsualiza en ningun sitio donde se comparta.
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ??
      (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : "http://localhost:3000"),
  ),
  title: TITULO,
  description: DESCRIPCION,
  icons: { icon: "/logo.svg" },
  openGraph: {
    type: "website",
    locale: "es_CO",
    siteName: "Pago Abierto",
    title: TITULO,
    description: DESCRIPCION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITULO,
    description: DESCRIPCION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body
        className={`${sora.variable} ${dmSans.variable} ${jetbrains.variable} min-h-dvh`}
      >
        <header className="border-b border-borde">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4">
            <Link
              href="/"
              className="flex items-center gap-2.5 font-display text-[15px] font-semibold tracking-tight"
            >
              <Logo className="h-7 w-7" />
              Pago Abierto
            </Link>
            <nav className="flex items-center gap-5 text-sm text-tenue">
              <Link href="/dashboard" className="hover:text-tinta">
                Historial
              </Link>
              <a
                href="https://openpayments.dev"
                target="_blank"
                rel="noreferrer"
                className="hover:text-tinta"
              >
                Open Payments
              </a>
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-4xl px-5 py-10">{children}</main>

        <footer className="mx-auto max-w-4xl px-5 pb-10 text-sm text-tenue">
          <p>
            Prototipo sobre la red de pruebas de Interledger. El dinero que se
            mueve aqui es de juego.
          </p>
        </footer>
      </body>
    </html>
  );
}

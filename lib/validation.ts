import { z } from "zod";

/**
 * El monto se captura en la unidad mayor (450.50 USD) porque es lo que la
 * persona escribe, y se convierte a unidades minimas en el borde. Dentro del
 * sistema nunca circula un decimal: Open Payments trabaja en enteros.
 */
export const createRequestSchema = z.object({
  amount: z
    .number({ error: "El monto es obligatorio" })
    .positive("El monto debe ser mayor que cero")
    .max(1_000_000, "Monto fuera del rango del MVP"),
  assetCode: z
    .string()
    .trim()
    .length(3, "El codigo de moneda tiene 3 letras")
    .toUpperCase()
    .default("USD"),
  description: z
    .string()
    .trim()
    .min(3, "Describe por que cobras")
    .max(140, "Maximo 140 caracteres"),
  payeeName: z
    .string()
    .trim()
    .min(2, "Tu nombre es obligatorio")
    .max(80, "Maximo 80 caracteres"),
  clientName: z.string().trim().max(80).optional().or(z.literal("")),
  clientCountry: z.string().trim().max(60).optional().or(z.literal("")),
});

export type CreateRequestInput = z.infer<typeof createRequestSchema>;

export const payRequestSchema = z.object({
  payerWalletAddress: z
    .string()
    .trim()
    .min(1, "Pega la direccion de tu wallet")
    .refine(
      (value) =>
        value.startsWith("https://") ||
        value.startsWith("http://") ||
        value.startsWith("$"),
      "Debe ser una wallet address, por ejemplo https://ilp.interledger-test.dev/tu-nombre",
    ),
});

/** Escala por defecto de cada moneda soportada en el MVP. */
export const ASSET_SCALES: Record<string, number> = {
  USD: 2,
  EUR: 2,
  MXN: 2,
  COP: 2,
};

export function toMinorUnits(amount: number, assetScale: number): number {
  return Math.round(amount * 10 ** assetScale);
}

export function formatAmount(
  minor: number,
  assetCode: string,
  assetScale: number,
): string {
  const major = minor / 10 ** assetScale;
  return `${major.toLocaleString("es-CO", {
    minimumFractionDigits: assetScale,
    maximumFractionDigits: assetScale,
  })} ${assetCode}`;
}

export type Moneda = "COP" | "USD" | "EUR"

export interface MonedaInfo {
  codigo: Moneda
  simbolo: string
  nombre: string
  locale: string
  decimales: number
}

export const MONEDAS: Record<Moneda, MonedaInfo> = {
  COP: { codigo: "COP", simbolo: "$", nombre: "Peso colombiano", locale: "es-CO", decimales: 0 },
  USD: { codigo: "USD", simbolo: "US$", nombre: "Dólar estadounidense", locale: "en-US", decimales: 2 },
  EUR: { codigo: "EUR", simbolo: "€", nombre: "Euro", locale: "es-ES", decimales: 2 },
}

export function formatMoneda(monto: number, moneda: Moneda): string {
  const info = MONEDAS[moneda]
  return new Intl.NumberFormat(info.locale, {
    style: "currency",
    currency: info.codigo,
    minimumFractionDigits: info.decimales,
    maximumFractionDigits: info.decimales,
  }).format(monto)
}

/**
 * Convierte un monto expresado en COP a la moneda destino.
 * `tasas` son tasa_a_cop (cuántos COP vale 1 unidad de esa moneda).
 */
export function convertir(montoCop: number, a: Moneda, tasas: Record<Moneda, number>): number {
  if (a === "COP") return montoCop
  const tasa = tasas[a]
  if (!tasa) return montoCop
  return montoCop / tasa
}

/**
 * Convierte un monto expresado en `desde` a COP. Inversa de convertir().
 * Útil para persistir campos que se guardan en COP (ej. saldo_inicial)
 * pero se editan en la moneda de visualización actual.
 */
export function convertirACop(monto: number, desde: Moneda, tasas: Record<Moneda, number>): number {
  if (desde === "COP") return monto
  const tasa = tasas[desde]
  if (!tasa) return monto
  return monto * tasa
}

/**
 * Texto pequeño para mostrar el monto original de una transacción cuando
 * se hizo en una moneda distinta a COP, ej. "100,00 USD".
 */
export function formatMontoOriginal(monto: number, moneda: Moneda): string {
  const cifra = new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(monto)
  return `${cifra} ${moneda}`
}

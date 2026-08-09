import { createClient } from "@/lib/supabase/client"
import type { Moneda } from "@/lib/monedas"

export interface TasasResultado {
  tasas: Record<Moneda, number>
  esObsoleta: boolean
  /** Fecha (ISO YYYY-MM-DD) a la que corresponden las tasas, o null si no hay ninguna. */
  fecha: string | null
}

interface TasaCambioRow {
  moneda: string
  tasa_a_cop: number
}

interface ExchangeRateApiResponse {
  result: string
  rates: Record<string, number>
}

const TASAS_VACIAS: Record<Moneda, number> = { COP: 1, USD: 0, EUR: 0 }

let tasasEnCache: TasasResultado | null = null
let solicitudEnCurso: Promise<TasasResultado> | null = null

function fechaHoyISO(): string {
  // Fecha LOCAL del usuario (no UTC): toISOString() devuelve UTC, y en
  // Colombia (UTC-5) después de las 19:00 ya marca el día siguiente, lo que
  // duplicaba filas en tasas_cambio y rompía la caché de noche.
  const ahora = new Date()
  const anio = ahora.getFullYear()
  const mes = String(ahora.getMonth() + 1).padStart(2, "0")
  const dia = String(ahora.getDate()).padStart(2, "0")
  return `${anio}-${mes}-${dia}`
}

function filasATasas(filas: TasaCambioRow[]): Record<Moneda, number> {
  const tasas: Record<Moneda, number> = { ...TASAS_VACIAS }
  for (const fila of filas) {
    if (fila.moneda === "USD" || fila.moneda === "EUR") {
      tasas[fila.moneda] = Number(fila.tasa_a_cop)
    }
  }
  return tasas
}

/**
 * Devuelve las tasas de cambio USD/EUR → COP del día.
 * Nunca lanza: si todo falla, cae a la última tasa cacheada (o a ceros) y
 * marca esObsoleta, para que la app siga funcionando en modo COP.
 * Se cachea en memoria por sesión para no repetir la consulta.
 */
export async function getTasas(): Promise<TasasResultado> {
  if (tasasEnCache) return tasasEnCache
  if (solicitudEnCurso) return solicitudEnCurso

  solicitudEnCurso = cargarTasas()
  try {
    tasasEnCache = await solicitudEnCurso
    return tasasEnCache
  } finally {
    solicitudEnCurso = null
  }
}

async function cargarTasas(): Promise<TasasResultado> {
  const supabase = createClient()
  const fecha = fechaHoyISO()

  try {
    const { data, error } = await supabase
      .from("tasas_cambio")
      .select("moneda, tasa_a_cop")
      .eq("fecha", fecha)
      .returns<TasaCambioRow[]>()

    if (error) throw error

    if (data && data.length > 0) {
      const tasas = filasATasas(data)
      if (tasas.USD > 0 && tasas.EUR > 0) {
        return { tasas, esObsoleta: false, fecha }
      }
    }

    return await obtenerDeApiYGuardar(fecha)
  } catch (error) {
    console.error("Error consultando tasas_cambio:", error)
    return await ultimaTasaDisponible()
  }
}

async function obtenerDeApiYGuardar(fecha: string): Promise<TasasResultado> {
  try {
    const respuesta = await fetch("https://open.er-api.com/v6/latest/USD")
    if (!respuesta.ok) throw new Error(`open.er-api.com respondió ${respuesta.status}`)

    const json = (await respuesta.json()) as ExchangeRateApiResponse
    const copPorUsd = json.rates?.COP
    const eurPorUsd = json.rates?.EUR

    if (!copPorUsd || !eurPorUsd) throw new Error("Respuesta de open.er-api.com incompleta")

    const tasaUsd = copPorUsd
    const tasaEur = copPorUsd / eurPorUsd

    const supabase = createClient()
    const { error } = await supabase
      .from("tasas_cambio")
      .upsert(
        [
          { fecha, moneda: "USD", tasa_a_cop: tasaUsd, fuente: "exchangerate-api" },
          { fecha, moneda: "EUR", tasa_a_cop: tasaEur, fuente: "exchangerate-api" },
        ],
        { onConflict: "fecha,moneda", ignoreDuplicates: true },
      )

    if (error) console.error("No se pudo cachear la tasa de cambio del día:", error)

    return { tasas: { COP: 1, USD: tasaUsd, EUR: tasaEur }, esObsoleta: false, fecha }
  } catch (error) {
    console.error("Error consultando open.er-api.com:", error)
    return await ultimaTasaDisponible()
  }
}

async function ultimaTasaDisponible(): Promise<TasasResultado> {
  try {
    const supabase = createClient()
    const [usd, eur] = await Promise.all([
      supabase
        .from("tasas_cambio")
        .select("tasa_a_cop, fecha")
        .eq("moneda", "USD")
        .order("fecha", { ascending: false })
        .limit(1)
        .returns<{ tasa_a_cop: number; fecha: string }[]>(),
      supabase
        .from("tasas_cambio")
        .select("tasa_a_cop, fecha")
        .eq("moneda", "EUR")
        .order("fecha", { ascending: false })
        .limit(1)
        .returns<{ tasa_a_cop: number; fecha: string }[]>(),
    ])

    const tasaUsd = usd.data?.[0]?.tasa_a_cop ?? 0
    const tasaEur = eur.data?.[0]?.tasa_a_cop ?? 0
    const fecha = usd.data?.[0]?.fecha ?? eur.data?.[0]?.fecha ?? null

    return { tasas: { COP: 1, USD: Number(tasaUsd), EUR: Number(tasaEur) }, esObsoleta: true, fecha }
  } catch (error) {
    console.error("Error obteniendo la última tasa disponible:", error)
    return { tasas: { ...TASAS_VACIAS }, esObsoleta: true, fecha: null }
  }
}

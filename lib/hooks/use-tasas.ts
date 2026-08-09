"use client"

import { useEffect, useState } from "react"
import { getTasas } from "@/lib/tasas"
import type { Moneda } from "@/lib/monedas"

export interface UseTasasResultado {
  tasas: Record<Moneda, number>
  cargando: boolean
  esObsoleta: boolean
  /** Fecha (ISO YYYY-MM-DD) a la que corresponden las tasas, o null si no hay ninguna. */
  fecha: string | null
}

const TASAS_INICIALES: Record<Moneda, number> = { COP: 1, USD: 0, EUR: 0 }

export function useTasas(): UseTasasResultado {
  const [tasas, setTasas] = useState<Record<Moneda, number>>(TASAS_INICIALES)
  const [cargando, setCargando] = useState(true)
  const [esObsoleta, setEsObsoleta] = useState(false)
  const [fecha, setFecha] = useState<string | null>(null)

  useEffect(() => {
    let activo = true

    getTasas().then((resultado) => {
      if (!activo) return
      setTasas(resultado.tasas)
      setEsObsoleta(resultado.esObsoleta)
      setFecha(resultado.fecha)
      setCargando(false)
    })

    return () => {
      activo = false
    }
  }, [])

  return { tasas, cargando, esObsoleta, fecha }
}

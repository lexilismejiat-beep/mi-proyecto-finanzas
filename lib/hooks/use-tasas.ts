"use client"

import { useEffect, useState } from "react"
import { getTasas } from "@/lib/tasas"
import type { Moneda } from "@/lib/monedas"

export interface UseTasasResultado {
  tasas: Record<Moneda, number>
  cargando: boolean
  esObsoleta: boolean
}

const TASAS_INICIALES: Record<Moneda, number> = { COP: 1, USD: 0, EUR: 0 }

export function useTasas(): UseTasasResultado {
  const [tasas, setTasas] = useState<Record<Moneda, number>>(TASAS_INICIALES)
  const [cargando, setCargando] = useState(true)
  const [esObsoleta, setEsObsoleta] = useState(false)

  useEffect(() => {
    let activo = true

    getTasas().then((resultado) => {
      if (!activo) return
      setTasas(resultado.tasas)
      setEsObsoleta(resultado.esObsoleta)
      setCargando(false)
    })

    return () => {
      activo = false
    }
  }, [])

  return { tasas, cargando, esObsoleta }
}

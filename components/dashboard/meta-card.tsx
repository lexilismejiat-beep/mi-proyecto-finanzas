"use client"

import { useState } from "react"
import { endOfMonth, differenceInCalendarDays } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Target, Pencil } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useProfile } from "@/contexts/profile-context"
import { useTasas } from "@/lib/hooks/use-tasas"
import { formatMoneda, convertir } from "@/lib/monedas"
import { InputMoneda } from "@/components/dashboard/input-moneda"

const NOMBRES_MES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

interface MetaCardProps {
  ingresosMesCop: number
  mesSeleccionado: number
  anioSeleccionado: number
  cardColor?: string
  textColor?: string
}

export function MetaCard({ ingresosMesCop, mesSeleccionado, anioSeleccionado, cardColor, textColor }: MetaCardProps) {
  const { user, perfil, monedaVisualizacion, recargar } = useProfile()
  const { tasas } = useTasas()

  const [editando, setEditando] = useState(false)
  const [metaPendienteCop, setMetaPendienteCop] = useState(0)
  const [guardando, setGuardando] = useState(false)

  const metaMensualCop = Number(perfil?.meta_mensual) || 0
  const tieneMeta = metaMensualCop > 0

  const abrirEdicion = () => {
    setMetaPendienteCop(metaMensualCop)
    setEditando(true)
  }

  const guardarMeta = async () => {
    if (!user) return
    setGuardando(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("profiles")
        .update({ meta_mensual: metaPendienteCop, updated_at: new Date().toISOString() })
        .eq("id", user.id)

      if (error) throw error
      await recargar()
      setEditando(false)
      toast.success("Meta actualizada")
    } catch (error) {
      console.error("Error guardando la meta mensual:", error)
      toast.error("No se pudo guardar la meta")
    } finally {
      setGuardando(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      guardarMeta()
    } else if (e.key === "Escape") {
      e.preventDefault()
      setEditando(false)
    }
  }

  const formatear = (montoCop: number) => formatMoneda(convertir(montoCop, monedaVisualizacion, tasas), monedaVisualizacion)

  // Comparar año y mes juntos: julio de 2025 no es julio de 2026.
  const hoy = new Date()
  const claveSeleccionada = anioSeleccionado * 12 + mesSeleccionado
  const claveActual = hoy.getFullYear() * 12 + hoy.getMonth()
  const esFuturo = claveSeleccionada > claveActual
  const esPasado = claveSeleccionada < claveActual

  const tituloPeriodo = `Meta de ${NOMBRES_MES[mesSeleccionado]} ${anioSeleccionado}`

  const porcentaje = tieneMeta ? (ingresosMesCop / metaMensualCop) * 100 : 0
  const porcentajeBarra = Math.min(Math.max(porcentaje, 0), 100)
  const cumplida = tieneMeta && ingresosMesCop >= metaMensualCop
  const faltanteCop = Math.max(0, metaMensualCop - ingresosMesCop)
  const excedenteCop = Math.max(0, ingresosMesCop - metaMensualCop)

  const diasRestantes = Math.max(1, differenceInCalendarDays(endOfMonth(hoy), hoy) + 1)
  const promedioDiarioCop = faltanteCop / diasRestantes

  const colorBarra = cumplida ? "bg-emerald-500" : porcentaje >= 50 ? "bg-blue-500" : "bg-amber-500"

  const metaEditable = (
    <button
      type="button"
      onClick={abrirEdicion}
      className="group flex items-center gap-1.5 text-2xl font-bold"
      style={{ color: textColor }}
    >
      {formatear(metaMensualCop)}
      <Pencil className="h-3.5 w-3.5 opacity-0 group-hover:opacity-50 transition-opacity" />
    </button>
  )

  return (
    <Card className="border-border" style={{ backgroundColor: cardColor }}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium opacity-70" style={{ color: textColor }}>
          {tituloPeriodo}
        </CardTitle>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
          <Target className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        {!tieneMeta && !editando ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-sm opacity-70" style={{ color: textColor }}>
              Todavía no definiste una meta mensual de ingresos.
            </p>
            <Button size="sm" onClick={abrirEdicion} className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0">
              Definir meta
            </Button>
          </div>
        ) : editando ? (
          <div className="space-y-2">
            <InputMoneda
              valorInicialCop={metaPendienteCop}
              onChangeCop={setMetaPendienteCop}
              autoFocus
              disabled={guardando}
              onKeyDown={handleKeyDown}
              inputClassName="w-full h-10 px-3 pr-14 rounded-md border bg-transparent"
            />
            <p className="text-xs opacity-60" style={{ color: textColor }}>
              Enter para guardar, Esc para cancelar.
            </p>
          </div>
        ) : esFuturo ? (
          <div className="space-y-1">
            {metaEditable}
            <p className="text-xs opacity-70" style={{ color: textColor }}>
              Aún no comienza.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              {metaEditable}
              <span className="text-sm font-bold opacity-70 shrink-0" style={{ color: textColor }}>
                {Math.round(porcentaje)}%
              </span>
            </div>

            <div className="h-2.5 w-full rounded-full bg-black/10 overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", colorBarra)}
                style={{ width: `${porcentajeBarra}%` }}
              />
            </div>

            <div
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs opacity-70"
              style={{ color: textColor }}
            >
              {esPasado ? (
                cumplida ? (
                  <span>
                    Meta alcanzada · {Math.round(porcentaje)}% ({formatear(ingresosMesCop)} de {formatear(metaMensualCop)})
                  </span>
                ) : (
                  <span>
                    No alcanzada · {Math.round(porcentaje)}% (faltaron {formatear(faltanteCop)})
                  </span>
                )
              ) : cumplida ? (
                <span>¡Meta superada por {formatear(excedenteCop)}! 🎉</span>
              ) : (
                <span>
                  Faltan {formatear(faltanteCop)} en {diasRestantes} día{diasRestantes === 1 ? "" : "s"} → {formatear(promedioDiarioCop)}/día
                </span>
              )}
              {!esPasado && <span>Ingresos del mes: {formatear(ingresosMesCop)}</span>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

"use client"

import { useState } from "react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { useProfile } from "@/contexts/profile-context"
import { MONEDAS, type Moneda } from "@/lib/monedas"

interface SelectorMonedaProps {
  className?: string
}

/**
 * Selector de moneda de visualización compartido entre el dashboard y
 * Configuración. Escribe directamente en profiles.moneda_visualizacion y
 * refresca el ProfileContext, así el cambio se ve en toda la app sin
 * recargar la página.
 */
export function SelectorMoneda({ className }: SelectorMonedaProps) {
  const { user, monedaVisualizacion, recargar } = useProfile()
  const [guardando, setGuardando] = useState(false)

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nuevaMoneda = e.target.value as Moneda
    if (!user || nuevaMoneda === monedaVisualizacion) return

    setGuardando(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("profiles")
        .update({ moneda_visualizacion: nuevaMoneda, updated_at: new Date().toISOString() })
        .eq("id", user.id)

      if (error) throw error
      await recargar()
    } catch (error) {
      console.error("Error guardando la moneda de visualización:", error)
      toast.error("No se pudo actualizar la moneda de visualización")
    } finally {
      setGuardando(false)
    }
  }

  return (
    <select
      value={monedaVisualizacion}
      onChange={handleChange}
      disabled={guardando}
      aria-label="Moneda de visualización"
      className={className ?? "bg-transparent border-none outline-none font-bold cursor-pointer"}
    >
      {(Object.keys(MONEDAS) as Moneda[]).map((m) => (
        <option key={m} value={m}>{m}</option>
      ))}
    </select>
  )
}

"use client"

import { useEffect, useRef, useState } from "react"
import { useProfile } from "@/contexts/profile-context"
import { useTasas } from "@/lib/hooks/use-tasas"
import { convertir, convertirACop, type Moneda } from "@/lib/monedas"
import { cn } from "@/lib/utils"

interface InputMonedaProps {
  valorInicialCop: number
  onChangeCop: (montoCop: number) => void
  className?: string
  inputClassName?: string
  autoFocus?: boolean
  disabled?: boolean
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
}

/**
 * Input numérico que se edita en la moneda de visualización actual pero
 * siempre reporta el equivalente en COP (para campos que se persisten en
 * COP, como saldo_inicial o meta_mensual).
 *
 * - Se hidrata una sola vez al montar, desde valorInicialCop. Por eso debe
 *   montarse recién cuando ese valor inicial ya es el real (no 0 por default
 *   mientras carga el perfil) — se remonta naturalmente cada vez que el
 *   padre lo agrega/quita del árbol (edición inline, por ejemplo).
 * - Si el usuario cambia la moneda de visualización mientras el campo está
 *   montado, reconvierte en vivo el valor VISIBLE (no vuelve a leer
 *   valorInicialCop), para no perder lo que se haya escrito.
 * - Si lo que cambia son las tasas (carga async) sin que cambie la moneda,
 *   no toca nada.
 * - Muestra el código de la moneda en la que está expresado el valor
 *   visible como adorno fijo dentro del input.
 */
export function InputMoneda({
  valorInicialCop,
  onChangeCop,
  className,
  inputClassName,
  autoFocus,
  disabled,
  onKeyDown,
}: InputMonedaProps) {
  const { monedaVisualizacion } = useProfile()
  const { tasas, cargando: tasasCargando } = useTasas()

  const [texto, setTexto] = useState("")
  const [monedaInput, setMonedaInput] = useState<Moneda>("COP")
  const monedaAnterior = useRef<Moneda | null>(null)

  useEffect(() => {
    if (tasasCargando) return

    if (monedaAnterior.current === null) {
      setTexto(String(convertir(valorInicialCop, monedaVisualizacion, tasas)))
      setMonedaInput(monedaVisualizacion)
      monedaAnterior.current = monedaVisualizacion
      return
    }

    if (monedaAnterior.current === monedaVisualizacion) return

    const monedaPrevia = monedaAnterior.current
    setTexto((valorActual) => {
      const numero = parseFloat(valorActual) || 0
      const montoCop = convertirACop(numero, monedaPrevia, tasas)
      return String(convertir(montoCop, monedaVisualizacion, tasas))
    })
    setMonedaInput(monedaVisualizacion)
    monedaAnterior.current = monedaVisualizacion
    // valorInicialCop es deliberadamente solo para la hidratación inicial:
    // no debe disparar reconversiones por sí solo si cambia después.
  }, [tasasCargando, monedaVisualizacion, tasas])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nuevoTexto = e.target.value
    setTexto(nuevoTexto)
    const numero = parseFloat(nuevoTexto) || 0
    onChangeCop(convertirACop(numero, monedaInput, tasas))
  }

  return (
    <div className={cn("relative", className)}>
      <input
        type="number"
        step="any"
        value={texto}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        autoFocus={autoFocus}
        disabled={disabled}
        className={inputClassName}
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold opacity-60">
        {monedaInput}
      </span>
    </div>
  )
}

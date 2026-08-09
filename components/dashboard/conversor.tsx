"use client"

import { useMemo, useState } from "react"
import { ArrowUpDown, AlertTriangle, RefreshCw } from "lucide-react"
import { useTasas } from "@/lib/hooks/use-tasas"
import { convertir, convertirACop, formatMoneda, MONEDAS, type Moneda } from "@/lib/monedas"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const CODIGOS = Object.keys(MONEDAS) as Moneda[]

/**
 * Parsea un monto escrito en locale es-CO: punto (o espacio) como separador
 * de miles y coma como decimal. "1.000,50" → 1000.5, "1000" → 1000.
 * Devuelve null si el texto está vacío o no es un número válido, para que la
 * UI muestre resultados en blanco en vez de un 0 fantasma.
 */
function parseMontoEsCO(texto: string): number | null {
  const limpio = texto.trim()
  if (limpio === "") return null
  // Solo dígitos, puntos, comas y espacios; y a lo sumo una coma decimal.
  if (!/^[\d.,\s]+$/.test(limpio)) return null
  if ((limpio.match(/,/g) ?? []).length > 1) return null
  const normalizado = limpio.replace(/[.\s]/g, "").replace(",", ".")
  const numero = Number(normalizado)
  if (!Number.isFinite(numero) || numero < 0) return null
  return numero
}

/** True si la moneda se puede convertir con las tasas actuales. */
function tasaDisponible(moneda: Moneda, tasas: Record<Moneda, number>): boolean {
  return moneda === "COP" || tasas[moneda] > 0
}

/**
 * Cifra de la tasa en formato es-CO. Tasas >= 1 con 2 decimales
 * ("3.834,20"); tasas < 1 con cifras significativas para que no se aplasten
 * a "0,00" al invertir a una moneda de mayor valor ("0,0003144").
 */
function formatCifraTasa(valor: number): string {
  if (valor >= 1) {
    return new Intl.NumberFormat("es-CO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(valor)
  }
  return new Intl.NumberFormat("es-CO", {
    minimumSignificantDigits: 1,
    maximumSignificantDigits: 4,
  }).format(valor)
}

/** "1 de agosto de 2026" a partir de una fecha ISO YYYY-MM-DD. */
function formatFecha(fechaIso: string): string {
  // Se ancla al mediodía para que el desfase de zona horaria no corra el día.
  const fecha = new Date(`${fechaIso}T12:00:00`)
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(fecha)
}

interface ConversorProps {
  className?: string
}

/**
 * Conversor de monedas de consulta. No toca contabilidad: solo lee tasas
 * (useTasas) y reutiliza convertir/convertirACop/formatMoneda. Toda
 * conversión pasa por COP primero, igual que el resto de la app.
 */
export function Conversor({ className }: ConversorProps) {
  const { tasas, cargando, esObsoleta, fecha } = useTasas()

  const [monto, setMonto] = useState("1.000")
  const [origen, setOrigen] = useState<Moneda>("USD")
  const [destino, setDestino] = useState<Moneda>("COP")

  const montoNumero = useMemo(() => parseMontoEsCO(monto), [monto])

  // Tercera moneda: la que no es origen ni destino. Con origen ≠ destino
  // siempre hay exactamente una.
  const tercera = useMemo(
    () => CODIGOS.find((m) => m !== origen && m !== destino) ?? destino,
    [origen, destino],
  )

  // Sin una tasa válida para origen o destino no se puede convertir de forma
  // fiable; mejor avisar que mostrar un número inventado.
  const sinTasas =
    !tasaDisponible(origen, tasas) ||
    !tasaDisponible(destino, tasas) ||
    !tasaDisponible(tercera, tasas)

  const seleccionarOrigen = (nueva: Moneda) => {
    if (nueva === destino) setDestino(origen) // evita origen === destino
    setOrigen(nueva)
  }
  const seleccionarDestino = (nueva: Moneda) => {
    if (nueva === origen) setOrigen(destino)
    setDestino(nueva)
  }
  const invertir = () => {
    setOrigen(destino)
    setDestino(origen)
  }

  /** Convierte un monto de `origen` a `hacia` pasando siempre por COP. */
  const convertirDesdeOrigen = (montoOrigen: number, hacia: Moneda): number => {
    const enCop = convertirACop(montoOrigen, origen, tasas)
    return convertir(enCop, hacia, tasas)
  }

  const resultadoDestino = montoNumero === null ? null : convertirDesdeOrigen(montoNumero, destino)
  const resultadoTercera = montoNumero === null ? null : convertirDesdeOrigen(montoNumero, tercera)
  const tasaDestino = convertirDesdeOrigen(1, destino)
  const tasaTercera = convertirDesdeOrigen(1, tercera)

  return (
    <div className={cn("space-y-4", className)}>
      {/* Origen: monto + moneda */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Monto</label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            inputMode="decimal"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder="0"
            aria-label="Monto a convertir"
            className="h-12 flex-1 rounded-md border border-border bg-background px-3 text-lg font-semibold text-foreground outline-none focus:border-primary"
          />
          <SelectMoneda
            value={origen}
            onChange={seleccionarOrigen}
            ariaLabel="Moneda de origen"
          />
        </div>
      </div>

      {/* Invertir */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={invertir}
          aria-label="Invertir origen y destino"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-secondary text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          <ArrowUpDown className="h-4 w-4" />
        </button>
      </div>

      {/* Resultados */}
      {sinTasas && !cargando ? (
        <div className="space-y-3 rounded-md border border-border bg-secondary/40 p-4 text-center">
          <p className="text-sm text-muted-foreground">
            No se pudieron obtener las tasas de cambio. Revisá tu conexión e intentá de nuevo.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90"
          >
            <RefreshCw className="h-4 w-4" /> Reintentar
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Destino (principal) */}
          <ResultadoFila
            moneda={destino}
            resultado={resultadoDestino}
            tasaTexto={`1 ${origen} = ${formatCifraTasa(tasaDestino)} ${destino}`}
            onSelect={seleccionarDestino}
            cargando={cargando}
            destacado
          />
          {/* Tercera moneda */}
          <ResultadoFila
            moneda={tercera}
            resultado={resultadoTercera}
            tasaTexto={`1 ${origen} = ${formatCifraTasa(tasaTercera)} ${tercera}`}
            onSelect={(m) => seleccionarDestino(m)}
            cargando={cargando}
          />
        </div>
      )}

      {/* Fecha de la tasa / aviso de obsolescencia */}
      {!cargando && !sinTasas && (
        esObsoleta ? (
          <div className="flex items-start gap-2 rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="text-xs">
              No se pudo actualizar la tasa hoy. Estás viendo la última disponible
              {fecha ? ` (del ${formatFecha(fecha)})` : ""}, que puede estar desactualizada.
            </p>
          </div>
        ) : (
          fecha && (
            <p className="text-center text-xs text-muted-foreground">
              Tasa del {formatFecha(fecha)}
            </p>
          )
        )
      )}
    </div>
  )
}

interface SelectMonedaProps {
  value: Moneda
  onChange: (moneda: Moneda) => void
  ariaLabel: string
}

function SelectMoneda({ value, onChange, ariaLabel }: SelectMonedaProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Moneda)}
      aria-label={ariaLabel}
      className="h-12 rounded-md border border-border bg-background px-3 font-bold text-foreground outline-none focus:border-primary sm:w-28"
    >
      {CODIGOS.map((m) => (
        <option key={m} value={m}>
          {m}
        </option>
      ))}
    </select>
  )
}

interface ResultadoFilaProps {
  moneda: Moneda
  resultado: number | null
  tasaTexto: string
  onSelect: (moneda: Moneda) => void
  cargando: boolean
  destacado?: boolean
}

function ResultadoFila({
  moneda,
  resultado,
  tasaTexto,
  onSelect,
  cargando,
  destacado,
}: ResultadoFilaProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-md border border-border bg-secondary/40 p-3",
        destacado && "bg-secondary",
      )}
    >
      <div className="min-w-0 flex-1">
        {cargando ? (
          <>
            <Skeleton className="h-7 w-32" />
            <Skeleton className="mt-1.5 h-3 w-40" />
          </>
        ) : (
          <>
            <p
              className={cn(
                "truncate font-bold text-foreground",
                destacado ? "text-2xl" : "text-lg",
              )}
            >
              {/* Nunca mostramos 0 como resultado: sin monto válido, un guion. */}
              {resultado === null ? "—" : formatMoneda(resultado, moneda)}
            </p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{tasaTexto}</p>
          </>
        )}
      </div>
      <SelectMoneda
        value={moneda}
        onChange={onSelect}
        ariaLabel={`Moneda de destino (${moneda})`}
      />
    </div>
  )
}

"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/top-bar"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  ClipboardCheck,
  Plus,
  Pencil,
  Loader2,
  Calendar,
  Filter,
  ListChecks,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useProfile } from "@/contexts/profile-context"
import { useTasas } from "@/lib/hooks/use-tasas"
import { MONEDAS, formatMoneda, formatMontoOriginal, convertir, convertirACop, type Moneda } from "@/lib/monedas"

const MONTHS = [
  { value: 0, label: "Enero" }, { value: 1, label: "Febrero" },
  { value: 2, label: "Marzo" }, { value: 3, label: "Abril" },
  { value: 4, label: "Mayo" }, { value: 5, label: "Junio" },
  { value: 6, label: "Julio" }, { value: 7, label: "Agosto" },
  { value: 8, label: "Septiembre" }, { value: 9, label: "Octubre" },
  { value: 10, label: "Noviembre" }, { value: 11, label: "Diciembre" }
]

// Esto se parece a `recordatorios`, pero NO es lo mismo: recordatorios está
// acoplado al bot de notificaciones (telefono_destino, telegram_id) y modela
// alertas puntuales; responsabilidades es un checklist mensual sin
// notificaciones, cuyo estado se deriva de responsabilidades_pagos. Ver
// AUDITORIA.md sobre tablas que se solaparon sin querer (profiles/
// user_profiles) — se documenta el solape conceptual aquí para evaluar
// unificarlas más adelante, no para repetir ese error.

interface Responsabilidad {
  id: string
  user_uuid: string
  nombre: string
  monto: number
  moneda: Moneda
  categoria: string | null
  dia_vencimiento: number | null
  activa: boolean
  orden: number
  created_at: string
}

interface ResponsabilidadPago {
  id: string
  responsabilidad_id: string
  user_uuid: string
  periodo: string
  pagado: boolean
  transaccion_id: number | null
  monto_pagado: number | null
  pagado_at: string | null
}

interface Fila {
  responsabilidad: Responsabilidad
  pago: ResponsabilidadPago | null
}

interface PerfilLigero {
  nombres?: string
  avatar_url?: string | null
}

function upsertPagoLocal(pagos: ResponsabilidadPago[], pago: ResponsabilidadPago): ResponsabilidadPago[] {
  const idx = pagos.findIndex((p) => p.responsabilidad_id === pago.responsabilidad_id)
  if (idx === -1) return [...pagos, pago]
  const next = [...pagos]
  next[idx] = pago
  return next
}

function montoEnCop(r: Responsabilidad, tasas: Record<Moneda, number>): number {
  return convertirACop(Number(r.monto), r.moneda, tasas)
}

// Una tasa de cambio en 0 no es un valor por defecto razonable, es un dato
// inválido (tasas aún no cargaron, o la API de tasas falló y no hay caché).
// Nunca hay que usar `|| 0` acá: eso congela monto_cop en cero para siempre
// en cuanto se persiste. Esta función es la única fuente de verdad para
// "¿tengo una tasa usable para esta moneda ahora mismo?" — devuelve null en
// vez de una tasa inválida para forzar a quien la llama a manejar ese caso
// explícitamente en vez de calcular con un número falso.
function tasaValida(moneda: Moneda, tasas: Record<Moneda, number>): number | null {
  if (moneda === "COP") return 1
  const tasa = tasas[moneda]
  return tasa > 0 ? tasa : null
}

function redondear(numero: number, moneda: Moneda): string {
  return numero.toFixed(MONEDAS[moneda].decimales)
}

// El monto "vigente" de una fila: si ya se pagó, se muestra lo que
// realmente se pagó ese periodo (monto_pagado, congelado al marcar), no el
// monto actual de la responsabilidad — si el usuario edita el arriendo de
// marzo hacia adelante, el historial de enero no debe cambiar retroactivamente.
function montoDeFila(f: Fila, tasas: Record<Moneda, number>): number {
  if (f.pago?.pagado && f.pago.monto_pagado != null) return Number(f.pago.monto_pagado)
  return montoEnCop(f.responsabilidad, tasas)
}

function pendingKey(responsabilidadId: string, periodo: string): string {
  return `${periodo}:${responsabilidadId}`
}

// --- MODAL DE CREACIÓN/EDICIÓN (crear, editar, desactivar) ---
function ModalResponsabilidad({
  userUuid,
  tasas,
  monedaVisualizacion,
  onRefresh,
  editData = null,
}: {
  userUuid: string
  tasas: Record<Moneda, number>
  monedaVisualizacion: Moneda
  onRefresh: () => void
  editData?: Responsabilidad | null
}) {
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [desactivando, setDesactivando] = useState(false)
  const [confirmDesactivar, setConfirmDesactivar] = useState(false)
  const [moneda, setMoneda] = useState<Moneda>(editData?.moneda ?? "COP")
  const [montoTexto, setMontoTexto] = useState(editData ? redondear(Number(editData.monto), editData.moneda) : "")

  const handleOpenChange = (nuevoOpen: boolean) => {
    if (nuevoOpen) {
      setMoneda(editData?.moneda ?? "COP")
      setMontoTexto(editData ? redondear(Number(editData.monto), editData.moneda) : "")
      setConfirmDesactivar(false)
    }
    setOpen(nuevoOpen)
  }

  // Cambiar de moneda reconvierte en vivo el valor visible (igual que hace
  // InputMoneda en Configuración/meta), no lo deja como un número crudo
  // reinterpretado en otra moneda. Si no hay tasa usable todavía para el
  // origen o el destino, bloquear el cambio en vez de convertir con una
  // tasa en 0 (eso corrompería el monto silenciosamente).
  const cambiarMoneda = (nuevaMoneda: Moneda) => {
    if (nuevaMoneda === moneda) return
    if (tasaValida(moneda, tasas) === null || tasaValida(nuevaMoneda, tasas) === null) {
      toast.error("Esperá a que carguen las tasas de cambio para cambiar de moneda")
      return
    }
    const numero = parseFloat(montoTexto) || 0
    if (numero > 0) {
      const montoCop = convertirACop(numero, moneda, tasas)
      setMontoTexto(redondear(convertir(montoCop, nuevaMoneda, tasas), nuevaMoneda))
    }
    setMoneda(nuevaMoneda)
  }

  const montoNumerico = parseFloat(montoTexto) || 0
  const tasaMonedaSeleccionada = tasaValida(moneda, tasas)
  const tasaVisualizacionValida = tasaValida(monedaVisualizacion, tasas) !== null
  const equivalenteVisualizacion =
    tasaMonedaSeleccionada !== null && tasaVisualizacionValida
      ? convertir(montoNumerico * tasaMonedaSeleccionada, monedaVisualizacion, tasas)
      : null

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const montoNum = parseFloat(formData.get("monto") as string)
    if (!montoNum || montoNum <= 0) {
      toast.error("Ingresá un monto mayor a cero")
      return
    }

    setLoading(true)

    const diaRaw = (formData.get("dia_vencimiento") as string) || ""
    const categoriaRaw = (formData.get("categoria") as string) || ""

    const payload = {
      nombre: formData.get("nombre") as string,
      monto: montoNum,
      moneda,
      categoria: categoriaRaw || "Obligaciones",
      dia_vencimiento: diaRaw ? parseInt(diaRaw, 10) : null,
      user_uuid: userUuid,
    }

    const { error } = editData
      ? await supabase.from("responsabilidades").update(payload).eq("id", editData.id)
      : await supabase.from("responsabilidades").insert([{ ...payload, orden: 0 }])

    if (error) {
      toast.error("Error: " + error.message)
    } else {
      toast.success(editData ? "Responsabilidad actualizada" : "¡Responsabilidad creada!")
      setOpen(false)
      onRefresh()
    }
    setLoading(false)
  }

  const handleDesactivar = async () => {
    if (!editData) return
    setDesactivando(true)
    const { error } = await supabase.from("responsabilidades").update({ activa: false }).eq("id", editData.id)
    if (error) {
      toast.error("No se pudo desactivar: " + error.message)
    } else {
      toast.success("Responsabilidad desactivada")
      setOpen(false)
      onRefresh()
    }
    setDesactivando(false)
    setConfirmDesactivar(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {editData ? (
          <Button variant="ghost" size="icon" className="h-11 w-11 text-gray-400 hover:text-white hover:bg-white/5">
            <Pencil size={17} />
          </Button>
        ) : (
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-bold shadow-lg shadow-emerald-900/20 w-full md:w-auto">
            <Plus size={18} /> Nueva Responsabilidad
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-[#121212] border-white/10 text-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <ClipboardCheck className={editData ? "text-blue-500" : "text-emerald-500"} />
            {editData ? "Editar Responsabilidad" : "Nueva Responsabilidad"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input
              name="nombre"
              defaultValue={editData?.nombre}
              placeholder="Ej: Arriendo"
              className="bg-white/5 border-white/10 text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Monto mensual</Label>
              <Input
                name="monto"
                type="number"
                step="any"
                value={montoTexto}
                onChange={(e) => setMontoTexto(e.target.value)}
                placeholder="50000"
                className="bg-white/5 border-white/10 text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Moneda</Label>
              <Select value={moneda} onValueChange={(v) => cambiarMoneda(v as Moneda)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#121212] border-white/10 text-white">
                  {(Object.keys(MONEDAS) as Moneda[]).map((m) => (
                    <SelectItem key={m} value={m}>{m} · {MONEDAS[m].simbolo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {moneda !== "COP" && montoNumerico > 0 && (
            <p className="text-xs text-emerald-400 -mt-2">
              {equivalenteVisualizacion !== null
                ? `≈ ${formatMoneda(equivalenteVisualizacion, monedaVisualizacion)}`
                : "Tasa de cambio no disponible por ahora"}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Input
                name="categoria"
                defaultValue={editData?.categoria ?? undefined}
                placeholder="Obligaciones"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Día de vencimiento</Label>
              <Input
                name="dia_vencimiento"
                type="number"
                min={1}
                max={31}
                defaultValue={editData?.dia_vencimiento ?? undefined}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" /> : editData ? "Guardar Cambios" : "Crear Responsabilidad"}
          </Button>

          {editData && (
            <div className="pt-2 border-t border-white/10">
              {!confirmDesactivar ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setConfirmDesactivar(true)}
                  className="w-full text-rose-500 hover:bg-rose-500/10 hover:text-rose-400"
                >
                  Desactivar responsabilidad
                </Button>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-zinc-400 text-center">
                    Se preserva el historial de pagos. ¿Confirmar?
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setConfirmDesactivar(false)}
                      className="flex-1 text-white hover:bg-white/5"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      onClick={handleDesactivar}
                      disabled={desactivando}
                      className="flex-1 bg-rose-600 hover:bg-rose-700 text-white"
                    >
                      {desactivando ? <Loader2 className="animate-spin" /> : "Sí, desactivar"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}

// --- PÁGINA PRINCIPAL ---
export default function ResponsabilidadesPage() {
  const supabase = createClient()
  const { user, cedula, monedaVisualizacion } = useProfile()
  const { tasas } = useTasas()

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [profile, setProfile] = useState<PerfilLigero | null>(null)

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  const [responsabilidades, setResponsabilidades] = useState<Responsabilidad[]>([])
  const [pagos, setPagos] = useState<ResponsabilidadPago[]>([])
  const [cargando, setCargando] = useState(true)
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())
  const [confirmTarget, setConfirmTarget] = useState<{ responsabilidad: Responsabilidad; pago: ResponsabilidadPago } | null>(null)

  const periodo = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}`

  // marcar/desmarcar son disparados por un click y pueden seguir resolviendo
  // en segundo plano después de que el usuario cambió de mes: esta ref deja
  // que esas continuaciones sepan si el periodo que originaron sigue siendo
  // el que está en pantalla antes de tocar el estado visible.
  const periodoRef = useRef(periodo)
  useEffect(() => {
    periodoRef.current = periodo
  }, [periodo])

  const primeraCargaHecha = useRef(false)

  useEffect(() => {
    if (!user) return
    const fetchPerfil = async () => {
      const [{ data: profileData }, { data: mainProfile }] = await Promise.all([
        supabase.from("user_profiles").select("nombres").eq("id", user.id).maybeSingle(),
        supabase.from("profiles").select("avatar_url").eq("id", user.id).maybeSingle(),
      ])
      setProfile({ nombres: profileData?.nombres, avatar_url: mainProfile?.avatar_url })
    }
    fetchPerfil()
  }, [user, supabase])

  const fetchResponsabilidades = async () => {
    if (!user) return
    const { data, error } = await supabase
      .from("responsabilidades")
      .select("*")
      .eq("user_uuid", user.id)
      .eq("activa", true)
      .order("orden", { ascending: true })
      .order("nombre", { ascending: true })
      .returns<Responsabilidad[]>()
    if (error) {
      toast.error("Error al cargar responsabilidades")
      return
    }
    setResponsabilidades(data || [])
  }

  const fetchPagosPeriodo = async (userId: string, periodoObjetivo: string) => {
    const { data, error } = await supabase
      .from("responsabilidades_pagos")
      .select("*")
      .eq("user_uuid", userId)
      .eq("periodo", periodoObjetivo)
      .returns<ResponsabilidadPago[]>()
    if (error) {
      toast.error("Error al cargar pagos del periodo")
      return null
    }
    return data || []
  }

  // Carga inicial: responsabilidades (independiente del periodo) y los
  // pagos del periodo actual en paralelo, una sola vez por usuario.
  useEffect(() => {
    if (!user) return
    let activo = true
    const cargarInicial = async () => {
      setCargando(true)
      const [, pagosData] = await Promise.all([fetchResponsabilidades(), fetchPagosPeriodo(user.id, periodo)])
      if (!activo) return
      if (pagosData) setPagos(pagosData)
      primeraCargaHecha.current = true
      setCargando(false)
    }
    cargarInicial()
    return () => {
      activo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // Cambios de mes/año después de la carga inicial: solo se refrescan los
  // pagos (las responsabilidades no dependen del periodo). El flag `activo`
  // evita que una respuesta vieja (out of order) pise los datos del periodo
  // que el usuario ya seleccionó después.
  useEffect(() => {
    if (!user || !primeraCargaHecha.current) return
    let activo = true
    const recargarPagos = async () => {
      setCargando(true)
      const pagosData = await fetchPagosPeriodo(user.id, periodo)
      if (!activo) return
      if (pagosData) setPagos(pagosData)
      setCargando(false)
    }
    recargarPagos()
    return () => {
      activo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodo])

  const filas: Fila[] = useMemo(() => {
    return responsabilidades.map((r) => ({
      responsabilidad: r,
      pago: pagos.find((p) => p.responsabilidad_id === r.id) ?? null,
    }))
  }, [responsabilidades, pagos])

  const hoy = new Date()
  const esMesActual = selectedYear === hoy.getFullYear() && selectedMonth === hoy.getMonth()

  const getBadge = (r: Responsabilidad, pagado: boolean): { label: string; className: string } | null => {
    if (!esMesActual || pagado || !r.dia_vencimiento) return null
    const diff = r.dia_vencimiento - hoy.getDate()
    if (diff < 0) return { label: "Vencida", className: "bg-rose-500/20 text-rose-400 border-rose-500/30" }
    if (diff <= 3) return { label: "Próxima", className: "bg-amber-500/20 text-amber-400 border-amber-500/30" }
    return null
  }

  const totales = useMemo(() => {
    const totalCount = filas.length
    const pagadasCount = filas.filter((f) => f.pago?.pagado).length
    const totalMontoCop = filas.reduce((acc, f) => acc + montoEnCop(f.responsabilidad, tasas), 0)
    const pagadoMontoCop = filas.filter((f) => f.pago?.pagado).reduce((acc, f) => acc + montoDeFila(f, tasas), 0)
    return { totalCount, pagadasCount, totalMontoCop, pagadoMontoCop }
  }, [filas, tasas])

  const formatCurrency = (montoCop: number) => formatMoneda(convertir(montoCop, monedaVisualizacion, tasas), monedaVisualizacion)

  const agregarPendiente = (key: string) => setPendingIds((prev) => new Set(prev).add(key))
  const quitarPendiente = (key: string) =>
    setPendingIds((prev) => {
      const next = new Set(prev)
      next.delete(key)
      return next
    })

  const marcar = async (r: Responsabilidad) => {
    if (!user) return
    if (!cedula) {
      toast.error("No se pudo identificar tu perfil, recargá la página")
      return
    }

    // Si no hay una tasa usable para la moneda de esta responsabilidad,
    // abortar ANTES de tocar la base: seguir de largo congelaría monto_cop
    // en cero (tasa 0 → egreso que vale nada en balance/reportes, para
    // siempre, porque monto_cop nunca se recalcula después de creado).
    const tasaAplicada = tasaValida(r.moneda, tasas)
    if (tasaAplicada === null) {
      toast.error("Esperá a que carguen las tasas de cambio para poder registrar este pago")
      return
    }

    const periodoLocal = periodo
    const key = pendingKey(r.id, periodoLocal)
    if (pendingIds.has(key)) return
    agregarPendiente(key)

    // monto_pagado se congela en COP (el eje contable fijo de la app, igual
    // que transacciones.monto_cop), no en la moneda propia de la
    // responsabilidad: si no fuera así, una fila en USD guardaría un número
    // ambiguo sin unidad registrada.
    const montoCop = r.monto * tasaAplicada

    const pagoAnterior = pagos.find((p) => p.responsabilidad_id === r.id) ?? null
    const aplicarSiVigente = (updater: (prev: ResponsabilidadPago[]) => ResponsabilidadPago[]) => {
      if (periodoRef.current === periodoLocal) setPagos(updater)
    }

    aplicarSiVigente((prev) =>
      upsertPagoLocal(prev, {
        id: pagoAnterior?.id ?? `optimista-${r.id}`,
        responsabilidad_id: r.id,
        user_uuid: user.id,
        periodo: periodoLocal,
        pagado: true,
        transaccion_id: pagoAnterior?.transaccion_id ?? null,
        monto_pagado: montoCop,
        pagado_at: new Date().toISOString(),
      })
    )

    let transaccionCreadaId: number | null = null

    try {
      const { data: transaccion, error: txError } = await supabase
        .from("transacciones")
        .insert([
          {
            descripcion: r.nombre,
            monto: r.monto,
            moneda: r.moneda,
            tasa_a_cop: tasaAplicada,
            monto_cop: montoCop,
            tipo: "Egreso",
            categoria: r.categoria || "Obligaciones",
            user_id: cedula,
          },
        ])
        .select()
        .single()
      if (txError) throw txError
      transaccionCreadaId = transaccion.id

      // Claim atómico en la base: si otra llamada (doble click, conexión
      // lenta, otra pestaña) ya se quedó con este periodo, esto devuelve
      // null en vez de crear un segundo registro de pago.
      const { data: pagoGuardado, error: rpcError } = await supabase.rpc("reclamar_pago_responsabilidad", {
        p_responsabilidad_id: r.id,
        p_periodo: periodoLocal,
        p_transaccion_id: transaccion.id,
        p_monto_pagado: montoCop,
      })
      if (rpcError) throw rpcError

      if (!pagoGuardado) {
        // Perdimos la carrera: deshacer el egreso que acabamos de crear
        // para no dejar un duplicado huérfano, y sincronizar con lo real.
        await supabase.from("transacciones").delete().eq("id", transaccion.id)
        const { data: real } = await supabase
          .from("responsabilidades_pagos")
          .select("*")
          .eq("responsabilidad_id", r.id)
          .eq("periodo", periodoLocal)
          .maybeSingle()
        if (real) aplicarSiVigente((prev) => upsertPagoLocal(prev, real as ResponsabilidadPago))
        return
      }

      aplicarSiVigente((prev) => upsertPagoLocal(prev, pagoGuardado as ResponsabilidadPago))
    } catch (error) {
      if (transaccionCreadaId) {
        await supabase.from("transacciones").delete().eq("id", transaccionCreadaId)
      }
      aplicarSiVigente((prev) =>
        pagoAnterior ? upsertPagoLocal(prev, pagoAnterior) : prev.filter((p) => p.responsabilidad_id !== r.id)
      )
      toast.error("No se pudo registrar el pago: " + (error as Error).message)
    } finally {
      quitarPendiente(key)
    }
  }

  const desmarcar = async (r: Responsabilidad, pago: ResponsabilidadPago) => {
    if (!user) return
    const periodoLocal = periodo
    const key = pendingKey(r.id, periodoLocal)
    if (pendingIds.has(key)) return
    agregarPendiente(key)

    const aplicarSiVigente = (updater: (prev: ResponsabilidadPago[]) => ResponsabilidadPago[]) => {
      if (periodoRef.current === periodoLocal) setPagos(updater)
    }

    aplicarSiVigente((prev) => upsertPagoLocal(prev, { ...pago, pagado: false, transaccion_id: null, pagado_at: null }))

    // Orden importa: primero liberar el pago (pagado=false) y recién
    // después borrar la transacción, no al revés. Si algo falla luego del
    // UPDATE, el peor caso que queda es un egreso huérfano visible en
    // Transacciones que el usuario puede borrar a mano — mucho mejor que
    // un pago marcado "pagado" apuntando a una transacción que ya no existe.
    try {
      const { error: pagoError } = await supabase
        .from("responsabilidades_pagos")
        .update({ pagado: false, transaccion_id: null, pagado_at: null })
        .eq("id", pago.id)
      if (pagoError) throw pagoError

      if (pago.transaccion_id) {
        const { error: txError } = await supabase.from("transacciones").delete().eq("id", pago.transaccion_id)
        if (txError) {
          // El pago ya quedó liberado (esto no es reversible sin arriesgar
          // un doble estado peor); avisar en vez de resucitar el pago.
          toast.error("El pago se desmarcó, pero el egreso no se pudo borrar automáticamente. Borralo a mano desde Transacciones.")
          return
        }
      }
    } catch (error) {
      // Acá lo que falló es el UPDATE de responsabilidades_pagos: la
      // transacción original no se tocó todavía, así que revertir al
      // estado previo (incluyendo su transaccion_id real) es seguro.
      aplicarSiVigente((prev) => upsertPagoLocal(prev, pago))
      toast.error("No se pudo revertir el pago: " + (error as Error).message)
    } finally {
      quitarPendiente(key)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Sidebar
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onMobileOpenChange={setMobileSidebarOpen}
      />
      <div className={cn("transition-all duration-300", "lg:ml-64", sidebarCollapsed && "lg:ml-16")}>
        <TopBar
          userName={profile?.nombres ? `${profile.nombres}` : "Usuario"}
          avatarUrl={profile?.avatar_url}
          onMenuClick={() => setMobileSidebarOpen(true)}
        />
        <main className="p-4 sm:p-8 space-y-6 max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tighter uppercase italic">Responsabilidades</h1>
              <p className="text-gray-400 text-sm flex items-center gap-2">
                <Filter size={14} className="text-emerald-500" />
                {MONTHS[selectedMonth].label} {selectedYear}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex bg-[#121212] border border-white/10 rounded-xl p-1 flex-1 md:flex-none justify-center">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="bg-transparent border-none text-sm font-bold focus:ring-0 cursor-pointer px-3 py-1.5 text-white"
                >
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value} className="bg-zinc-900">{m.label}</option>
                  ))}
                </select>
                <div className="w-px bg-white/10 my-1"></div>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="bg-transparent border-none text-sm font-bold focus:ring-0 cursor-pointer px-3 py-1.5 text-white"
                >
                  {[2024, 2025, 2026].map((y) => (
                    <option key={y} value={y} className="bg-zinc-900">{y}</option>
                  ))}
                </select>
              </div>
              {user && (
                <ModalResponsabilidad
                  userUuid={user.id}
                  tasas={tasas}
                  monedaVisualizacion={monedaVisualizacion}
                  onRefresh={fetchResponsabilidades}
                />
              )}
            </div>
          </div>

          <Card className="border-white/10 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent rounded-3xl overflow-hidden shadow-2xl">
            <CardContent className="p-6 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500/20 rounded-2xl">
                  <ListChecks className="text-emerald-500 h-8 w-8" />
                </div>
                <div>
                  <p className="text-xs text-emerald-500/80 uppercase font-black">Progreso del mes</p>
                  <p className="text-2xl md:text-3xl font-black tracking-tighter">
                    {totales.pagadasCount} de {totales.totalCount} pagadas · {formatCurrency(totales.pagadoMontoCop)} de {formatCurrency(totales.totalMontoCop)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-3">
            <h2 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <Calendar size={14} /> Checklist de {MONTHS[selectedMonth].label}
            </h2>

            {cargando ? (
              <div className="py-20 flex flex-col items-center gap-4">
                <Loader2 className="animate-spin text-emerald-500 h-8 w-8" />
                <p className="text-sm text-gray-500">Cargando responsabilidades...</p>
              </div>
            ) : totales.totalCount === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl text-gray-600 space-y-4">
                <p className="font-medium">Todavía no registraste ninguna obligación fija.</p>
                {user && (
                  <div className="flex justify-center">
                    <ModalResponsabilidad
                      userUuid={user.id}
                      tasas={tasas}
                      monedaVisualizacion={monedaVisualizacion}
                      onRefresh={fetchResponsabilidades}
                    />
                  </div>
                )}
              </div>
            ) : (
              filas.map((fila) => {
                const { responsabilidad: r, pago } = fila
                const pagado = pago?.pagado ?? false
                const badge = getBadge(r, pagado)
                const isPending = pendingIds.has(pendingKey(r.id, periodo))
                // Marcar una fila en otra moneda necesita una tasa válida
                // para calcular monto_cop; desmarcar no la necesita (solo
                // borra la transacción ya creada), así que eso no se bloquea.
                const bloqueadaPorTasa = r.moneda !== "COP" && tasaValida(r.moneda, tasas) === null

                return (
                  <Card key={r.id} className="bg-[#121212] border-white/5 hover:border-white/10 transition-all duration-200">
                    <CardContent className="p-3 flex items-center gap-3">
                      <Checkbox
                        checked={pagado}
                        disabled={isPending || (!pagado && bloqueadaPorTasa)}
                        title={!pagado && bloqueadaPorTasa ? "Esperando tasas de cambio para poder calcular el monto en COP" : undefined}
                        onCheckedChange={(checked) => {
                          if (checked === true) {
                            marcar(r)
                          } else if (pago) {
                            setConfirmTarget({ responsabilidad: r, pago })
                          }
                        }}
                        className="h-11 w-11 shrink-0 rounded-xl border-2 border-white/20 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className={cn("font-bold text-gray-100 truncate", pagado && "line-through text-gray-500")}>
                            {r.nombre}
                          </h3>
                          {badge && (
                            <Badge variant="outline" className={cn("text-[10px] font-bold", badge.className)}>
                              {badge.label}
                            </Badge>
                          )}
                          {isPending && <Loader2 className="h-3 w-3 animate-spin text-gray-500" />}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                          <Badge variant="outline" className="text-[9px] uppercase border-white/10 bg-white/5 text-gray-400 font-black px-2 py-0">
                            {r.categoria || "Obligaciones"}
                          </Badge>
                          <span>{r.dia_vencimiento ? `Vence el día ${r.dia_vencimiento}` : "Sin día fijo"}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className={cn("font-black text-lg tracking-tighter", pagado ? "text-gray-500" : "text-white")}>
                          {formatCurrency(montoDeFila(fila, tasas))}
                        </p>
                        {r.moneda !== "COP" && (
                          <p className="text-[10px] text-gray-500 font-medium">{formatMontoOriginal(r.monto, r.moneda)}</p>
                        )}
                      </div>

                      <ModalResponsabilidad
                        userUuid={r.user_uuid}
                        tasas={tasas}
                        monedaVisualizacion={monedaVisualizacion}
                        onRefresh={fetchResponsabilidades}
                        editData={r}
                      />
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </main>
      </div>

      <AlertDialog open={confirmTarget !== null} onOpenChange={(v) => { if (!v) setConfirmTarget(null) }}>
        <AlertDialogContent className="bg-[#121212] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desmarcar &quot;{confirmTarget?.responsabilidad.nombre}&quot;?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Esto va a borrar el egreso registrado en Transacciones para este periodo. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/5 hover:text-white">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmTarget) {
                  // Releer el pago vigente por si cambió (refetch de periodo,
                  // otra pestaña) mientras el diálogo de confirmación estaba abierto.
                  const pagoVigente =
                    pagos.find((p) => p.responsabilidad_id === confirmTarget.responsabilidad.id) ?? confirmTarget.pago
                  desmarcar(confirmTarget.responsabilidad, pagoVigente)
                }
                setConfirmTarget(null)
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Sí, desmarcar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/top-bar"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { 
  Plus, Wallet, Car, Utensils, Zap, Heart, 
  CreditCard, ShoppingBag, ChevronDown, ChevronUp, Calendar as CalendarIcon 
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useThemeSettings } from "@/lib/theme-context"
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns"

const MONTHS = [
  { value: 0, label: "Enero" }, { value: 1, label: "Febrero" },
  { value: 2, label: "Marzo" }, { value: 3, label: "Abril" },
  { value: 4, label: "Mayo" }, { value: 5, label: "Junio" },
  { value: 6, label: "Julio" }, { value: 7, label: "Agosto" },
  { value: 8, label: "Septiembre" }, { value: 9, label: "Octubre" },
  { value: 10, label: "Noviembre" }, { value: 11, label: "Diciembre" }
]

const GRUPOS_MAESTROS: Record<string, { icon: any, keywords: string[], desc: string }> = {
  "Alimentación": { 
    icon: Utensils, 
    keywords: ["alimentos", "comida", "cena", "restaurante", "mercado", "pizza", "hamburguesa", "rappi"], 
    desc: "Gastos en comida, mercados y salidas a comer" 
  },
  "Transporte": { 
    icon: Car, 
    keywords: ["gasolina", "tanqueo", "transporte", "uber", "moto", "taller", "pasaje", "peaje"], 
    desc: "Combustible, mantenimiento y transporte público" 
  },
  "Servicios y Pagos": { 
    icon: Zap, 
    keywords: ["servicios", "nomina", "prestamo", "luz", "agua", "internet", "tigo", "arriendo", "celular"], 
    desc: "Pagos fijos, servicios públicos y obligaciones" 
  },
  "Cuidado Personal": { 
    icon: Heart, 
    keywords: ["corte de cabello", "drogueria", "salud", "farmacia", "belleza", "gimnasio", "doctor"], 
    desc: "Salud, higiene y cuidado personal" 
  },
  "Finanzas": { 
    icon: CreditCard, 
    keywords: ["cuota tarjeta", "trading", "banco", "intereses", "ahorro", "inversion", "nequi"], 
    desc: "Movimientos bancarios y de inversión" 
  },
  "Otros": { 
    icon: ShoppingBag, 
    keywords: [], 
    desc: "Gastos variados no clasificados" 
  }
}

export default function CategoriasPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [grupos, setGrupos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  
  // --- ESTADOS DE FILTRO ---
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  const supabase = createClient()
  const { theme } = useThemeSettings()

  // 1. Carga de Perfil (Solo una vez)
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profileData } = await supabase.from("user_profiles").select("*").eq("id", user.id).single()
      const { data: mainProfile } = await supabase.from("profiles").select("avatar_url").eq("id", user.id).single()
      if (profileData) {
        setProfile({ ...profileData, avatar_url: mainProfile?.avatar_url || profileData.avatar_url })
      }
    }
    fetchProfile()
  }, [])

  // 2. Procesamiento de Categorías (Se dispara al cambiar Mes/Año o al cargar Perfil)
  useEffect(() => {
    const processCategorias = async () => {
      try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Rango de fechas igual que en reportes
        const dateFrom = startOfMonth(new Date(selectedYear, selectedMonth))
        const dateTo = endOfMonth(new Date(selectedYear, selectedMonth))

        // Query filtrada por fecha y usuario
        let query = supabase
          .from("transacciones")
          .select("categoria, monto, tipo")
          .gte("created_at", startOfDay(dateFrom).toISOString())
          .lte("created_at", endOfDay(dateTo).toISOString())

        if (profile?.cedula) {
          query = query.eq("user_id", profile.cedula)
        } else {
          query = query.eq("user_id", user.id)
        }

        const { data: transData, error } = await query
        if (error) throw error

        // Inicializar mapeo limpio
        const mapping: Record<string, any> = {}
        Object.keys(GRUPOS_MAESTROS).forEach(key => {
          mapping[key] = { ...GRUPOS_MAESTROS[key], nombre: key, total: 0, desglose: {} }
        })

        transData?.forEach(t => {
          // Solo procesamos Egresos para las categorías de gasto, 
          // a menos que quieras incluir ingresos también.
          if (t.tipo?.trim() === "Ingreso") return;

          const catLower = t.categoria?.toLowerCase() || ""
          const nombreOriginal = t.categoria || "Sin etiqueta"
          const monto = Math.abs(Number(t.monto) || 0)
          let asignado = false

          for (const [grupo, info] of Object.entries(GRUPOS_MAESTROS)) {
            if (info.keywords.some(k => catLower.includes(k))) {
              mapping[grupo].total += monto
              mapping[grupo].desglose[nombreOriginal] = (mapping[grupo].desglose[nombreOriginal] || 0) + monto
              asignado = true
              break
            }
          }

          if (!asignado) {
            mapping["Otros"].total += monto
            mapping["Otros"].desglose[nombreOriginal] = (mapping["Otros"].desglose[nombreOriginal] || 0) + monto
          }
        })

        // Ordenar: Mostrar primero los grupos con más gastos
        const gruposFinales = Object.values(mapping)
          .filter(g => g.total > 0)
          .sort((a, b) => b.total - a.total)

        setGrupos(gruposFinales)
      } catch (err) {
        console.error("Error procesando categorías:", err)
      } finally {
        setLoading(false)
      }
    }

    processCategorias()
  }, [selectedMonth, selectedYear, profile?.cedula, supabase])

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.background_color || "#0a0a0a" }}>
      <Sidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} mobileOpen={mobileSidebarOpen} onMobileOpenChange={setMobileSidebarOpen} sidebarColor={theme.sidebar_color} />

      <div className={cn("transition-all duration-300", "lg:ml-64", sidebarCollapsed && "lg:ml-16")}>
        <TopBar 
          userName={profile ? `${profile.nombres} ${profile.apellidos}` : "Usuario"} 
          avatarUrl={profile?.avatar_url} 
          onMenuClick={() => setMobileSidebarOpen(true)} 
        />

        <main className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
          {/* CABECERA CON FILTROS */}
          <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: theme.text_color }}>Mis Categorías Maestras</h1>
              <p className="text-muted-foreground mt-1">Análisis de gastos por grupo para {MONTHS[selectedMonth].label}</p>
            </div>

            <div className="flex items-center gap-2 bg-zinc-900/50 border border-zinc-800 p-2 rounded-xl">
              <CalendarIcon className="h-4 w-4 text-emerald-500 ml-1" />
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="bg-transparent border-none outline-none font-medium text-sm text-white cursor-pointer"
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value} className="bg-zinc-900">{m.label}</option>
                ))}
              </select>
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="bg-transparent border-none outline-none font-medium text-sm text-white cursor-pointer border-l border-zinc-700 pl-2"
              >
                {[2024, 2025, 2026].map((y) => (
                  <option key={y} value={y} className="bg-zinc-900">{y}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center p-20 gap-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
              <p className="text-zinc-500 text-sm">Clasificando tus gastos...</p>
            </div>
          ) : grupos.length === 0 ? (
            <div className="bg-zinc-900/30 border border-dashed border-zinc-800 rounded-3xl p-20 text-center">
              <ShoppingBag className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500">No se encontraron gastos categorizados en este periodo.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {grupos.map((grupo, i) => (
                <div key={i} className="flex flex-col overflow-hidden rounded-3xl border border-white/5 shadow-sm transition-all" style={{ backgroundColor: theme.card_color || "#121212" }}>
                  
                  {/* Cabecera de la Tarjeta */}
                  <div 
                    onClick={() => toggleExpand(i)}
                    className="p-6 flex flex-col md:flex-row items-center gap-6 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                      <grupo.icon className="h-8 w-8" />
                    </div>

                    <div className="flex-1 text-center md:text-left">
                      <h3 className="text-xl font-bold" style={{ color: theme.text_color }}>{grupo.nombre}</h3>
                      <p className="text-sm text-zinc-500">{grupo.desc}</p>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Total Gasto</p>
                        <p className="text-xl font-black text-emerald-500">${grupo.total.toLocaleString()}</p>
                      </div>
                      {expandedIndex === i ? <ChevronUp className="h-6 w-6 text-zinc-600" /> : <ChevronDown className="h-6 w-6 text-zinc-600" />}
                    </div>
                  </div>

                  {/* Sección Desplegable */}
                  {expandedIndex === i && (
                    <div className="px-6 pb-6 pt-2 border-t border-white/5 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="bg-black/20 rounded-2xl p-4 space-y-3">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4">Desglose de etiquetas</p>
                        {Object.entries(grupo.desglose).map(([tag, monto]: [any, any], idx) => (
                          <div key={idx} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                            <span className="text-sm font-medium text-zinc-400 capitalize">{tag}</span>
                            <span className="text-sm font-bold text-zinc-200">${monto.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

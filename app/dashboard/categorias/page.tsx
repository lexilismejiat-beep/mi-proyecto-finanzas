"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/top-bar"
import { cn } from "@/lib/utils"
import { 
  Car, Utensils, Zap, Heart, CreditCard, 
  ShoppingBag, ChevronDown, ChevronUp, Calendar as CalendarIcon 
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
  const [profile, setProfile] = useState<any>(null)
  const [grupos, setGrupos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  
  // Filtros de fecha
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  const supabase = createClient()
  const { theme } = useThemeSettings()

  // 1. Cargar perfil del usuario
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

  // 2. Procesar transacciones y agrupar por categorías maestras
  useEffect(() => {
    const processCategorias = async () => {
      try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const dateFrom = startOfMonth(new Date(selectedYear, selectedMonth))
        const dateTo = endOfMonth(new Date(selectedYear, selectedMonth))

        let query = supabase
          .from("transacciones")
          .select("categoria, monto, tipo")
          .gte("created_at", startOfDay(dateFrom).toISOString())
          .lte("created_at", endOfDay(dateTo).toISOString())

        const userIdToFilter = profile?.cedula || user.id
        query = query.eq("user_id", userIdToFilter)

        const { data: transData, error } = await query
        if (error) throw error

        const mapping: Record<string, any> = {}
        Object.keys(GRUPOS_MAESTROS).forEach(key => {
          mapping[key] = { ...GRUPOS_MAESTROS[key], nombre: key, total: 0, desglose: {} }
        })

        transData?.forEach(t => {
          // Solo contamos egresos (gastos)
          if (t.tipo?.trim() === "Ingreso") return

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

        setGrupos(Object.values(mapping).filter(g => g.total > 0).sort((a, b) => b.total - a.total))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    processCategorias()
  }, [selectedMonth, selectedYear, profile?.cedula])

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.background_color || "#0a0a0a" }}>
      <Sidebar />

      <div className="lg:ml-64 transition-all duration-300">
        <TopBar userName={profile ? `${profile.nombres}` : "Usuario"} avatarUrl={profile?.avatar_url} />

        <main className="p-4 sm:p-8 max-w-5xl mx-auto">
          {/* Header y Filtros */}
          <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Categorías Maestras</h1>
              <p className="text-zinc-500 mt-1">Análisis detallado de {MONTHS[selectedMonth].label}</p>
            </div>

            <div className="flex items-center gap-2 bg-zinc-900 border border-white/5 p-2 rounded-xl">
              <CalendarIcon className="h-4 w-4 text-emerald-500 ml-1" />
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-transparent text-sm font-medium text-white outline-none cursor-pointer"
              >
                {MONTHS.map(m => <option key={m.value} value={m.value} className="bg-zinc-900">{m.label}</option>)}
              </select>
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent text-sm font-medium text-white outline-none cursor-pointer border-l border-white/10 pl-2"
              >
                {[2024, 2025, 2026].map(y => <option key={y} value={y} className="bg-zinc-900">{y}</option>)}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center p-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div></div>
          ) : (
            <div className="grid gap-4">
              {grupos.map((grupo, i) => (
                <div key={i} className="rounded-3xl border border-white/5 overflow-hidden transition-all" style={{ backgroundColor: theme.card_color || "#121212" }}>
                  
                  {/* Tarjeta Principal */}
                  <div 
                    onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
                    className="p-6 flex flex-col md:flex-row items-center gap-6 cursor-pointer hover:bg-white/[0.02]"
                  >
                    <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                      <grupo.icon className="h-7 w-7" />
                    </div>

                    <div className="flex-1 text-center md:text-left">
                      <h3 className="text-lg font-bold text-white">{grupo.nombre}</h3>
                      <p className="text-xs text-zinc-500">{grupo.desc}</p>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-tighter">Total</p>
                        <p className="text-lg font-black text-emerald-500">${grupo.total.toLocaleString()}</p>
                      </div>
                      {expandedIndex === i ? <ChevronUp className="h-5 w-5 text-zinc-600" /> : <ChevronDown className="h-5 w-5 text-zinc-600" />}
                    </div>
                  </div>

                  {/* DESGLOSE (Corregido para legibilidad) */}
                  {expandedIndex === i && (
                    <div className="px-6 pb-6 pt-2 border-t border-white/5 animate-in fade-in slide-in-from-top-1 duration-200">
                      <div className="bg-black/40 rounded-2xl p-4 space-y-2 shadow-inner">
                        <p className="text-[10px] font-bold text-emerald-500/70 uppercase tracking-widest mb-3 ml-1">Etiquetas detectadas</p>
                        {Object.entries(grupo.desglose).map(([tag, monto]: [any, any], idx) => (
                          <div key={idx} className="flex justify-between items-center py-3 px-4 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-colors">
                            <span className="text-sm font-medium text-zinc-200 capitalize">{tag}</span>
                            <span className="text-sm font-bold text-white bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                              ${monto.toLocaleString()}
                            </span>
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

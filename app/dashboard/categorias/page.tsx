"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/top-bar"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Plus, Wallet, Car, Utensils, Zap, Heart, CreditCard, ShoppingBag, ChevronDown, ChevronUp, Calendar as CalendarIcon } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useThemeSettings } from "@/lib/theme-context"
// Importamos funciones de fecha para el filtro
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
    keywords: ["alimentos", "comida", "cena", "restaurante", "mercado", "pizza", "hamburguesa"], 
    desc: "Gastos en comida, mercados y salidas a comer" 
  },
  "Transporte": { 
    icon: Car, 
    keywords: ["gasolina", "tanqueo", "transporte", "uber", "moto", "taller", "pasaje"], 
    desc: "Combustible, mantenimiento y transporte público" 
  },
  "Servicios y Pagos": { 
    icon: Zap, 
    keywords: ["servicios", "nomina", "prestamo", "luz", "agua", "internet", "tigo", "arriendo"], 
    desc: "Pagos fijos, servicios públicos y obligaciones" 
  },
  "Cuidado Personal": { 
    icon: Heart, 
    keywords: ["corte de cabello", "drogueria", "salud", "farmacia", "belleza", "gimnasio"], 
    desc: "Salud, higiene y cuidado personal" 
  },
  "Finanzas": { 
    icon: CreditCard, 
    keywords: ["cuota tarjeta", "trading", "banco", "intereses", "ahorro", "inversion"], 
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
  
  // Estados para el Filtro de Fecha
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  
  const supabase = createClient()
  const { theme } = useThemeSettings()

  useEffect(() => {
    const processCategorias = async () => {
      try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profileData } = await supabase.from("user_profiles").select("*").eq("id", user.id).single()
        const { data: mainProfile } = await supabase.from("profiles").select("avatar_url").eq("id", user.id).single()
        
        if (profileData) {
          const fullProfile = { 
            ...profileData, 
            avatar_url: mainProfile?.avatar_url || profileData.avatar_url 
          }
          setProfile(fullProfile)

          // LÓGICA DE FILTRO POR FECHA
          const dateFrom = startOfMonth(new Date(selectedYear, selectedMonth))
          const dateTo = endOfMonth(new Date(selectedYear, selectedMonth))

          const { data: transData } = await supabase
            .from("transacciones")
            .select("categoria, monto, created_at")
            .eq("user_id", profileData.cedula)
            .gte("created_at", startOfDay(dateFrom).toISOString())
            .lte("created_at", endOfDay(dateTo).toISOString())

          const mapping: Record<string, any> = {}
          Object.keys(GRUPOS_MAESTROS).forEach(key => {
            mapping[key] = { ...GRUPOS_MAESTROS[key], nombre: key, total: 0, desglose: {} }
          })

          transData?.forEach(t => {
            const catLower = t.categoria?.toLowerCase() || ""
            const nombreOriginal = t.categoria || "Sin etiqueta"
            let asignado = false

            for (const [grupo, info] of Object.entries(GRUPOS_MAESTROS)) {
              if (info.keywords.some(k => catLower.includes(k))) {
                mapping[grupo].total += t.monto || 0
                mapping[grupo].desglose[nombreOriginal] = (mapping[grupo].desglose[nombreOriginal] || 0) + t.monto
                asignado = true
                break
              }
            }

            if (!asignado) {
              mapping["Otros"].total += t.monto || 0
              mapping["Otros"].desglose[nombreOriginal] = (mapping["Otros"].desglose[nombreOriginal] || 0) + t.monto
            }
          })

          setGrupos(Object.values(mapping).filter(g => g.total !== 0))
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    processCategorias()
    // Añadimos las dependencias para que se refresque al cambiar la fecha
  }, [supabase, selectedMonth, selectedYear])

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.background_color || "#F8FAFC" }}>
      <Sidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} mobileOpen={mobileSidebarOpen} onMobileOpenChange={setMobileSidebarOpen} sidebarColor={theme.sidebar_color} />

      <div className={cn("transition-all duration-300", "lg:ml-64", sidebarCollapsed && "lg:ml-16")}>
        <TopBar 
          userName={profile ? `${profile.nombres} ${profile.apellidos}` : "Usuario"} 
          avatarUrl={profile?.avatar_url} 
          onMenuClick={() => setMobileSidebarOpen(true)} 
        />

        <main className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
          <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: theme.text_color }}>Mis Categorías Maestras</h1>
              <p className="text-muted-foreground mt-1">Análisis detallado de {MONTHS[selectedMonth].label} {selectedYear}</p>
            </div>

            {/* SELECTORES DE FECHA PARA EL FILTRO */}
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 p-2 rounded-xl">
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
                className="bg-transparent text-sm font-medium text-white outline-none cursor-pointer border-l border-zinc-700 pl-2"
              >
                {[2024, 2025, 2026].map(y => <option key={y} value={y} className="bg-zinc-900">{y}</option>)}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center p-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div></div>
          ) : (
            <div className="grid gap-6">
              {grupos.map((grupo, i) => (
                <div key={i} className="flex flex-col overflow-hidden bg-white rounded-3xl border border-slate-100 shadow-sm transition-all" style={{ backgroundColor: theme.card_color }}>
                  
                  <div 
                    onClick={() => toggleExpand(i)}
                    className="p-6 flex flex-col md:flex-row items-center gap-6 cursor-pointer hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="h-16 w-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <grupo.icon className="h-8 w-8" />
                    </div>

                    <div className="flex-1 text-center md:text-left">
                      <h3 className="text-xl font-bold" style={{ color: theme.text_color }}>{grupo.nombre}</h3>
                      <p className="text-sm text-muted-foreground">{grupo.desc}</p>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Total</p>
                        <p className="text-xl font-black text-emerald-600">${Math.abs(grupo.total).toLocaleString()}</p>
                      </div>
                      {expandedIndex === i ? <ChevronUp className="h-6 w-6 text-slate-400" /> : <ChevronDown className="h-6 w-6 text-slate-400" />}
                    </div>
                  </div>

                  {/* SECCIÓN DESPLEGABLE CORREGIDA PARA LEGIBILIDAD */}
                  {expandedIndex === i && (
                    <div className="px-6 pb-6 pt-2 border-t border-slate-50 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="bg-black/40 rounded-2xl p-5 space-y-3 shadow-inner">
                        <p className="text-[11px] font-bold text-emerald-500 uppercase tracking-[0.2em] mb-2">Desglose detallado</p>
                        {Object.entries(grupo.desglose).map(([tag, monto]: [any, any], idx) => (
                          <div key={idx} className="flex justify-between items-center py-3 px-4 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-colors">
                            <span className="text-sm font-semibold text-zinc-100 capitalize">{tag}</span>
                            <span className="text-sm font-black text-white bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                              ${Math.abs(monto).toLocaleString()}
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

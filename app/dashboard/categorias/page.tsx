"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/top-bar"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Plus, Wallet, Car, Utensils, Zap, Heart, CreditCard, ShoppingBag, ChevronDown, ChevronUp } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useThemeSettings } from "@/lib/theme-context"

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
  
  const supabase = createClient()
  const { theme } = useThemeSettings()

  useEffect(() => {
    const processCategorias = async () => {
      try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // --- ANEXO DE LÓGICA DE PERFIL (Foto y Datos) ---
        const { data: profileData } = await supabase.from("user_profiles").select("*").eq("id", user.id).single()
        const { data: mainProfile } = await supabase.from("profiles").select("avatar_url").eq("id", user.id).single()
        
        if (profileData) {
          // Combinamos los datos para asegurar la foto del TopBar
          const fullProfile = { 
            ...profileData, 
            avatar_url: mainProfile?.avatar_url || profileData.avatar_url 
          }
          setProfile(fullProfile)

          const { data: transData } = await supabase
            .from("transacciones")
            .select("categoria, monto")
            .eq("user_id", profileData.cedula)

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

          setGrupos(Object.values(mapping).filter(g => g.total > 0))
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    processCategorias()
  }, [supabase])

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.background_color || "#F8FAFC" }}>
      <Sidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} mobileOpen={mobileSidebarOpen} onMobileOpenChange={setMobileSidebarOpen} sidebarColor={theme.sidebar_color} />

      <div className={cn("transition-all duration-300", "lg:ml-64", sidebarCollapsed && "lg:ml-16")}>
        <TopBar 
          userName={profile ? `${profile.nombres} ${profile.apellidos}` : "Usuario"} 
          avatarUrl={profile?.avatar_url} // Ahora recibe la URL correctamente
          onMenuClick={() => setMobileSidebarOpen(true)} 
        />

        <main className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
          <div className="mb-10 flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: theme.text_color }}>Mis Categorías Maestras</h1>
              <p className="text-muted-foreground mt-1">Pulsa en una categoría para ver el desglose detallado.</p>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center p-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div></div>
          ) : (
            <div className="grid gap-6">
              {grupos.map((grupo, i) => (
                <div key={i} className="flex flex-col overflow-hidden bg-white rounded-3xl border border-slate-100 shadow-sm transition-all" style={{ backgroundColor: theme.card_color }}>
                  
                  {/* Cabecera de la Tarjeta (Clickable) */}
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
                        <p className="text-xl font-black text-emerald-600">${grupo.total.toLocaleString()}</p>
                      </div>
                      {expandedIndex === i ? <ChevronUp className="h-6 w-6 text-slate-400" /> : <ChevronDown className="h-6 w-6 text-slate-400" />}
                    </div>
                  </div>

                  {/* Sección Desplegable */}
                  {expandedIndex === i && (
                    <div className="px-6 pb-6 pt-2 border-t border-slate-50 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="bg-slate-50/50 rounded-2xl p-4 space-y-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Etiquetas detectadas</p>
                        {Object.entries(grupo.desglose).map(([tag, monto]: [any, any], idx) => (
                          <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                            <span className="text-sm font-medium text-slate-600 capitalize">{tag}</span>
                            <span className="text-sm font-bold text-slate-900">${monto.toLocaleString()}</span>
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

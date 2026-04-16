"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/top-bar"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Plus, Wallet, Car, Utensils, Zap, Heart, CreditCard, ShoppingBag, ChevronRight } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useThemeSettings } from "@/lib/theme-context"

// Mapa de agrupación inteligente
const GRUPOS_MAESTROS: Record<string, { icon: any, keywords: string[], desc: string }> = {
  "Alimentación": { 
    icon: Utensils, 
    keywords: ["alimentos", "comida", "cena", "restaurante", "mercado"], 
    desc: "Gastos en comida, mercados y salidas a comer" 
  },
  "Transporte": { 
    icon: Car, 
    keywords: ["gasolina", "tanqueo", "transporte", "uber", "moto", "taller"], 
    desc: "Combustible, mantenimiento y transporte público" 
  },
  "Servicios y Pagos": { 
    icon: Zap, 
    keywords: ["servicios", "nomina", "prestamo", "luz", "agua", "internet", "tigo"], 
    desc: "Pagos fijos, servicios públicos y obligaciones" 
  },
  "Cuidado Personal": { 
    icon: Heart, 
    keywords: ["corte de cabello", "drogueria", "salud", "farmacia", "belleza"], 
    desc: "Salud, higiene y cuidado personal" 
  },
  "Finanzas": { 
    icon: CreditCard, 
    keywords: ["cuota tarjeta", "trading", "banco", "intereses", "ahorro"], 
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
  
  const supabase = createClient()
  const { theme } = useThemeSettings()

  useEffect(() => {
    const processCategorias = async () => {
      try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profileData } = await supabase.from("user_profiles").select("*").eq("id", user.id).single()
        
        if (profileData) {
          setProfile(profileData)
          
          // Traer todas las transacciones para agrupar sus categorías
          const { data: transData } = await supabase
            .from("transacciones")
            .select("categoria, monto")
            .eq("user_id", profileData.cedula)

          // Agrupación lógica
          const mapping: Record<string, any> = {}
          
          // Inicializar grupos maestros
          Object.keys(GRUPOS_MAESTROS).forEach(key => {
            mapping[key] = { ...GRUPOS_MAESTROS[key], nombre: key, total: 0, subcategorias: new Set() }
          })

          transData?.forEach(t => {
            const catLower = t.categoria?.toLowerCase() || ""
            let asignado = false

            for (const [grupo, info] of Object.entries(GRUPOS_MAESTROS)) {
              if (info.keywords.some(k => catLower.includes(k))) {
                mapping[grupo].total += t.monto || 0
                mapping[grupo].subcategorias.add(t.categoria)
                asignado = true
                break
              }
            }

            if (!asignado) {
              mapping["Otros"].total += t.monto || 0
              mapping["Otros"].subcategorias.add(t.categoria)
            }
          })

          setGrupos(Object.values(mapping).filter(g => g.subcategorias.size > 0))
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    processCategorias()
  }, [supabase])

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.background_color || "#F8FAFC" }}>
      <Sidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} mobileOpen={mobileSidebarOpen} onMobileOpenChange={setMobileSidebarOpen} sidebarColor={theme.sidebar_color} />

      <div className={cn("transition-all duration-300", "lg:ml-64", sidebarCollapsed && "lg:ml-16")}>
        <TopBar userName={profile ? `${profile.nombres} ${profile.apellidos}` : "Usuario"} avatarUrl={profile?.avatar_url} onMenuClick={() => setMobileSidebarOpen(true)} />

        <main className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
          <div className="mb-10 flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: theme.text_color }}>Mis Categorías Maestras</h1>
              <p className="text-muted-foreground mt-1">Hemos agrupado tus {grupos.reduce((acc, g) => acc + g.subcategorias.size, 0)} etiquetas en grupos inteligentes.</p>
            </div>
            <Button style={{ backgroundColor: theme.primary_color }} className="rounded-full shadow-lg">
              <Plus className="h-5 w-5 mr-2" /> Nueva Categoría
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center p-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div></div>
          ) : (
            <div className="grid gap-6">
              {grupos.map((grupo, i) => (
                <div key={i} className="group bg-white rounded-3xl border border-slate-100 p-6 flex flex-col md:flex-row items-center gap-6 hover:shadow-xl transition-all cursor-pointer" style={{ backgroundColor: theme.card_color }}>
                  <div className="h-16 w-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <grupo.icon className="h-8 w-8" />
                  </div>

                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-xl font-bold" style={{ color: theme.text_color }}>{grupo.nombre}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{grupo.desc}</p>
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                      {Array.from(grupo.subcategorias).map((sub: any, idx) => (
                        <span key={idx} className="text-[10px] px-2 py-1 rounded-full bg-slate-100 text-slate-500 font-medium border border-slate-200">
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Total Gastado</p>
                      <p className="text-xl font-black text-emerald-600">${grupo.total.toLocaleString()}</p>
                    </div>
                    <ChevronRight className="h-6 w-6 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

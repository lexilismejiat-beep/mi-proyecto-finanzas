"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/top-bar"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Plus, Tag, Info, Lightbulb, Wallet } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useThemeSettings } from "@/lib/theme-context"

export default function CategoriasPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [categorias, setCategorias] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()
  const { theme } = useThemeSettings()

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profileData } = await supabase
          .from("user_profiles")
          .select("*, profiles:id(avatar_url)")
          .eq("id", user.id)
          .single()
        
        if (profileData) {
          setProfile({ ...profileData, avatar_url: profileData.profiles?.avatar_url })

          // 1. Obtener categorías configuradas por el usuario (con descripción y palabras clave)
          const { data: catOficiales } = await supabase
            .from("categorias")
            .select("*")
            .eq("user_id", profileData.cedula)

          // 2. Escanear transacciones previas para detectar categorías usadas
          const { data: transData } = await supabase
            .from("transacciones")
            .select("categoria")
            .eq("user_id", profileData.cedula)

          const nombresOficiales = catOficiales?.map(c => c.nombre.toLowerCase()) || []
          const transCategoriasUnicas = Array.from(new Set(transData?.map(t => t.categoria?.trim()).filter(Boolean) || []))

          const listaFinal = [...(catOficiales || [])]
          
          transCategoriasUnicas.forEach(catNombre => {
            if (!nombresOficiales.includes(catNombre.toLowerCase())) {
              listaFinal.push({
                nombre: catNombre,
                es_temporal: true,
                descripcion: "Categoría detectada en transacciones previas.",
                palabras_clave: ""
              })
            }
          })

          setCategorias(listaFinal)
        }
      } catch (err) {
        console.error("Error:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchAllData()
  }, [supabase])

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.background_color || "#F8FAFC" }}>
      <Sidebar 
        collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed}
        mobileOpen={mobileSidebarOpen} onMobileOpenChange={setMobileSidebarOpen}
        sidebarColor={theme.sidebar_color}
      />

      <div className={cn("transition-all duration-300", "lg:ml-64", sidebarCollapsed && "lg:ml-16")}>
        <TopBar 
          userName={profile ? `${profile.nombres} ${profile.apellidos}` : "Usuario"} 
          avatarUrl={profile?.avatar_url} onMenuClick={() => setMobileSidebarOpen(true)}
        />

        <main className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: theme.text_color }}>Categorías de Gastos</h1>
              <p className="text-muted-foreground mt-1">Organiza y analiza tus gastos personales o empresariales.</p>
            </div>
            <Button className="gap-2 h-11 px-6 rounded-full shadow-md hover:scale-105 transition-transform" style={{ backgroundColor: theme.primary_color }}>
              <Plus className="h-5 w-5" /> Nueva Categoría
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center p-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div></div>
          ) : (
            <div className="grid gap-6">
              {categorias.map((cat, index) => (
                <div 
                  key={index} 
                  className={cn(
                    "group p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center gap-6",
                    cat.es_temporal ? "border-dashed border-amber-200 bg-amber-50/30" : "bg-white dark:bg-slate-900 border-slate-100"
                  )}
                  style={{ backgroundColor: !cat.es_temporal ? theme.card_color : undefined, color: theme.text_color }}
                >
                  {/* Icono dinámico según el tipo */}
                  <div className={cn(
                    "h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                    cat.es_temporal ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                  )}>
                    {cat.es_temporal ? <Lightbulb className="h-7 w-7" /> : <Wallet className="h-7 w-7" />}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold capitalize">{cat.nombre}</h3>
                      {cat.es_temporal && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase">Sugerida</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {cat.descripcion || "Sin descripción configurada."}
                    </p>
                    
                    {/* Palabras Clave como Chips */}
                    {cat.palabras_clave && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {cat.palabras_clave.split(',').map((word: string, i: number) => (
                          <span key={i} className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                            {word.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Info className="h-4 w-4 mr-2" /> Detalles
                  </Button>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

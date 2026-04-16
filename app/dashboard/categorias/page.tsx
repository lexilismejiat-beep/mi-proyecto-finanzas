"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/top-bar"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Plus, Wallet, Lightbulb } from "lucide-react"
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
    const fetchCategoriasData = async () => {
      try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Cargamos perfil completo (incluyendo avatar_url para el TopBar)
        const { data: profileData } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", user.id)
          .single()
        
        if (profileData) {
          setProfile(profileData)
          const miCedula = profileData.cedula

          // 1. Traer categorías oficiales configuradas
          const { data: catOficiales } = await supabase
            .from("categorias")
            .select("*")
            .eq("user_id", miCedula)

          // 2. Traer categorías de transacciones para agrupar
          const { data: transData } = await supabase
            .from("transacciones")
            .select("categoria")
            .eq("user_id", miCedula)

          // Lógica de Agrupación:
          const nombresOficialesLower = catOficiales?.map(c => c.nombre.toLowerCase()) || []
          const listaFinal = [...(catOficiales || [])]

          // Solo agregamos de transacciones si NO existen ya en las oficiales
          const transCategoriasUnicas = Array.from(
            new Set(transData?.map(t => t.categoria?.trim()).filter(Boolean) || [])
          )

          transCategoriasUnicas.forEach(nombre => {
            if (!nombresOficialesLower.includes(nombre.toLowerCase())) {
              listaFinal.push({
                nombre: nombre,
                es_temporal: true,
                descripcion: "Categoría por configurar"
              })
            }
          })

          setCategorias(listaFinal)
        }
      } catch (err) {
        console.error("Error cargando categorías:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchCategoriasData()
  }, [supabase])

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.background_color || "#F8FAFC" }}>
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onCollapsedChange={setSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onMobileOpenChange={setMobileSidebarOpen}
        sidebarColor={theme.sidebar_color}
      />

      <div className={cn("transition-all duration-300", "lg:ml-64", sidebarCollapsed && "lg:ml-16")}>
        <TopBar 
          userName={profile ? `${profile.nombres} ${profile.apellidos}` : "Usuario"} 
          avatarUrl={profile?.avatar_url} // Asegura que use la columna de tu tabla profiles
          onMenuClick={() => setMobileSidebarOpen(true)}
        />

        <main className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight" style={{ color: theme.text_color }}>
                Mis Categorías
              </h1>
              <p className="text-muted-foreground mt-1">
                Gestiona y agrupa tus etiquetas de gastos personales.
              </p>
            </div>
            <Button className="rounded-xl px-6 h-12 font-semibold shadow-sm" style={{ backgroundColor: theme.primary_color }}>
              <Plus className="h-5 w-5 mr-2" /> Nueva Categoría
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center p-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {categorias.map((cat, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "group p-6 rounded-3xl border transition-all duration-200 hover:shadow-lg",
                    cat.es_temporal ? "border-dashed border-slate-200 bg-slate-50/50" : "border-slate-100 shadow-sm"
                  )}
                  style={{ backgroundColor: !cat.es_temporal ? theme.card_color : undefined, color: theme.text_color }}
                >
                  <div className="flex flex-col gap-4">
                    <div className={cn(
                      "h-14 w-14 rounded-2xl flex items-center justify-center shadow-sm",
                      cat.es_temporal ? "bg-white text-slate-400" : "bg-emerald-50 text-emerald-600"
                    )}>
                      {cat.es_temporal ? <Lightbulb className="h-7 w-7" /> : <Wallet className="h-7 w-7" />}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-xl capitalize leading-none">{cat.nombre}</h3>
                        {cat.es_temporal && (
                          <span className="bg-amber-100 text-amber-700 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">
                            Nuevo
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                        {cat.descripcion || "Sin descripción asignada."}
                      </p>
                    </div>
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

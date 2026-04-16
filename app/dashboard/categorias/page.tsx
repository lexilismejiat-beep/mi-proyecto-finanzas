"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/top-bar"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Plus, Tag, MessageSquare } from "lucide-react"
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

        // 1. Obtener Perfil y Foto
        const { data: profileData } = await supabase
          .from("user_profiles")
          .select("*, profiles:id(avatar_url)")
          .eq("id", user.id)
          .single()
        
        if (profileData) {
          setProfile({
            ...profileData,
            avatar_url: profileData.profiles?.avatar_url
          })

          const cedula = profileData.cedula

          // 2. Obtener Categorías Oficiales (de la nueva tabla)
          const { data: catOficiales } = await supabase
            .from("categorias")
            .select("*")
            .eq("user_id", cedula)

          // 3. Obtener Categorías de Transacciones Previas (para no perder datos viejos)
          const { data: transData } = await supabase
            .from("transacciones")
            .select("categoria")
            .eq("user_id", cedula)

          // Unificamos y evitamos duplicados
          const nombresOficiales = catOficiales?.map(c => c.nombre.toLowerCase()) || []
          const transCategorias = Array.from(new Set(transData?.map(t => t.categoria?.trim()).filter(Boolean) || []))

          // Combinamos: Las oficiales + las que existen en transacciones pero no son oficiales aún
          const listaFinal = [...(catOficiales || [])]
          
          transCategorias.forEach(catNombre => {
            if (!nombresOficiales.includes(catNombre.toLowerCase())) {
              listaFinal.push({
                nombre: catNombre,
                es_temporal: true, // Marcamos que viene de una transacción vieja
                palabras_clave: "Sin palabras clave"
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
    
    fetchAllData()
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
          avatarUrl={profile?.avatar_url} 
          onMenuClick={() => setMobileSidebarOpen(true)}
        />

        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: theme.text_color }}>
                Gestión de Categorías
              </h1>
              <p className="text-muted-foreground">Define cómo el bot clasifica tus gastos de WhatsApp</p>
            </div>
            <Button className="gap-2 shadow-lg" style={{ backgroundColor: theme.primary_color }}>
              <Plus className="h-4 w-4" />
              Nueva Categoría
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center p-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {categorias.length > 0 ? (
                categorias.map((cat, index) => (
                  <div 
                    key={index} 
                    className={cn(
                      "p-6 rounded-2xl border shadow-sm transition-all hover:shadow-md relative overflow-hidden",
                      cat.es_temporal && "border-dashed border-amber-300"
                    )}
                    style={{ backgroundColor: theme.card_color, color: theme.text_color }}
                  >
                    {cat.es_temporal && (
                      <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] px-2 py-1 rounded-bl-lg font-bold">
                        TRANSACCIÓN PREVIA
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                        <Tag className="h-5 w-5" />
                      </div>
                      <span className="font-bold text-xl capitalize">{cat.nombre}</span>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground flex items-center gap-1 uppercase tracking-wider font-semibold">
                        <MessageSquare className="h-3 w-3" /> Palabras Clave
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {cat.palabras_clave?.split(',').map((word: string, i: number) => (
                          <span 
                            key={i} 
                            className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border"
                          >
                            {word.trim()}
                          </span>
                        )) || <span className="text-xs italic opacity-50">Ninguna configurada</span>}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center p-16 border-2 border-dashed rounded-3xl">
                  <p className="text-muted-foreground text-lg">
                    Aún no tienes categorías. ¡Usa el botón "Nueva Categoría" para empezar!
                  </p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

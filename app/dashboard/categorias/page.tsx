"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/top-bar"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useThemeSettings } from "@/lib/theme-context"

export default function CategoriasPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [categorias, setCategorias] = useState<any[]>([])
  const [loading, setLoading] = useState(true) // Estado de carga
  
  const supabase = createClient()
  const { theme } = useThemeSettings()

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // 1. Cargamos el perfil completo con el JOIN para la foto
        const { data: profileData } = await supabase
          .from("user_profiles")
          .select(`
            *,
            profiles:id (avatar_url)
          `)
          .eq("id", user.id)
          .single()
        
        if (profileData) {
          const fullProfile = {
            ...profileData,
            avatar_url: profileData.profiles?.avatar_url
          }
          setProfile(fullProfile)

          // 2. CRÍTICO: Usamos la cédula para filtrar, igual que en transacciones
          if (profileData.cedula) {
            console.log("Buscando categorías para cédula:", profileData.cedula)
            
            const { data: categoriasData, error } = await supabase
              .from("categorias")
              .select("*")
              .eq("user_id", profileData.cedula) // <-- Filtro por cédula
            
            if (error) throw error
            setCategorias(categoriasData || [])
          }
        }
      } catch (err) {
        console.error("Error en categorías:", err)
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
                Categorías
              </h1>
              <p className="text-muted-foreground">Gestiona tus categorías personales</p>
            </div>
            <Button className="gap-2" style={{ backgroundColor: theme.primary_color }}>
              <Plus className="h-4 w-4" />
              Nueva Categoría
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center p-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categorias.length > 0 ? (
                categorias.map((cat) => (
                  <div 
                    key={cat.id} 
                    className="p-6 rounded-xl border shadow-sm" 
                    style={{ backgroundColor: theme.card_color, color: theme.text_color }}
                  >
                    <span className="font-semibold text-lg">{cat.nombre}</span>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center p-12 border-2 border-dashed rounded-xl">
                  <p className="text-muted-foreground">No encontramos categorías vinculadas a tu cédula: <strong>{profile?.cedula}</strong></p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

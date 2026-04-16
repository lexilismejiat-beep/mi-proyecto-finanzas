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
  
  const supabase = createClient()
  const { theme } = useThemeSettings()

  useEffect(() => {
    const fetchAllData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 1. Cargamos el perfil y la foto (usando la lógica de las dos tablas que vimos antes)
      const { data: profileData } = await supabase
        .from("user_profiles")
        .select(`
            *,
            profiles:id (avatar_url)
          `)
        .eq("id", user.id)
        .single()
      
      if (profileData) {
        // Aplanamos la foto para el perfil
        const fullProfile = {
            ...profileData,
            avatar_url: profileData.profiles?.avatar_url
        }
        setProfile(fullProfile)

        // 2. FILTRADO CORRECTO: Usamos la CÉDULA para buscar las categorías
        // Cambiamos user.id (UUID) por profileData.cedula
        if (profileData.cedula) {
            const { data: categoriasData, error } = await supabase
              .from("categorias")
              .select("*")
              .eq("user_id", profileData.cedula) // <--- USAMOS LA CÉDULA AQUÍ
            
            if (categoriasData) {
                setCategorias(categoriasData)
            } else if (error) {
                console.error("Error cargando categorías:", error)
            }
        }
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

          {/* LISTADO DE CATEGORÍAS */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categorias.length > 0 ? (
              categorias.map((cat) => (
                <div 
                  key={cat.id} 
                  className="p-6 rounded-xl border shadow-sm transition-all hover:shadow-md" 
                  style={{ backgroundColor: theme.card_color, color: theme.text_color }}
                >
                  <span className="font-semibold">{cat.nombre}</span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground col-span-full">No tienes categorías registradas aún.</p>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

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
  const [categorias, setCategorias] = useState<any[]>([]) // Estado para tus categorías
  
  const supabase = createClient()
  const { theme } = useThemeSettings()

  useEffect(() => {
    const fetchAllData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 1. Cargar Perfil (Igual que en Transacciones)
      const { data: profileData } = await supabase
        .from("user_profiles")
        .select("*") 
        .eq("id", user.id)
        .single()
      
      if (profileData) setProfile(profileData)

      // 2. Cargar Categorías FILTRADAS por el usuario logueado
      const { data: categoriasData } = await supabase
        .from("categorias") // Verifica que este sea el nombre exacto de tu tabla
        .select("*")
        .eq("user_id", user.id) // <--- CRÍTICO: Filtra por el dueño
      
      if (categoriasData) setCategorias(categoriasData)
    }
    
    fetchAllData()
  }, [supabase])

  return (
    <div className="min-h-screen bg-background">
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
            {categorias.map((cat) => (
              <div 
                key={cat.id} 
                className="p-4 rounded-lg border" 
                style={{ backgroundColor: theme.card_color, color: theme.text_color }}
              >
                {cat.nombre}
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}

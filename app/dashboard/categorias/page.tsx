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
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()
  const { theme } = useThemeSettings()

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // 1. CONSULTA DE PERFIL (Simple, sin Joins complejos para evitar el error 400)
        const { data: profileData, error: profileError } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", user.id)
          .single()
        
        if (profileError) throw profileError

        // 2. CONSULTA DE AVATAR (Por separado para mayor seguridad)
        const { data: avatarData } = await supabase
          .from("profiles")
          .select("avatar_url")
          .eq("id", user.id)
          .maybeSingle()

        const fullProfile = {
          ...profileData,
          avatar_url: avatarData?.avatar_url
        }
        setProfile(fullProfile)

        // 3. CONSULTA DE CATEGORÍAS (Usando la cédula confirmada en tu tabla)
        if (profileData.cedula) {
          const { data: categoriasData, error: catError } = await supabase
            .from("categorias")
            .select("*")
            .eq("user_id", profileData.cedula) // Filtrado por cédula
          
          if (catError) throw catError
          setCategorias(categoriasData || [])
        }
      } catch (err) {
        console.error("Error detallado:", err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchAllData()
  }, [supabase])

  // ... (El resto del return igual al anterior, pero ahora profile.cedula sí tendrá valor)
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
              <h1 className="text-2xl font-bold" style={{ color: theme.text_color }}>Categorías</h1>
              <p className="text-muted-foreground">Gestiona tus categorías personales</p>
            </div>
            <Button className="gap-2" style={{ backgroundColor: theme.primary_color }}>
              <Plus className="h-4 w-4" /> Nueva Categoría
            </Button>
          </div>

          {loading ? (
             <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div></div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categorias.length > 0 ? (
                categorias.map((cat) => (
                  <div key={cat.id} className="p-6 rounded-xl border shadow-sm" style={{ backgroundColor: theme.card_color, color: theme.text_color }}>
                    <span className="font-semibold text-lg">{cat.nombre}</span>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center p-12 border-2 border-dashed rounded-xl">
                  <p className="text-muted-foreground">No encontramos categorías para la cédula: <strong>{profile?.cedula}</strong></p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

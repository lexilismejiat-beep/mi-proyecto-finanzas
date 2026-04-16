"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/top-bar"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Plus, Tag, Wallet } from "lucide-react"
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
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // 1. Obtener el usuario autenticado
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // 2. Obtener el perfil para sacar la cédula
        const { data: profileData } = await supabase
          .from("user_profiles")
          .select("*, profiles:id(avatar_url)")
          .eq("id", user.id)
          .single()
        
        if (profileData) {
          setProfile({ ...profileData, avatar_url: profileData.profiles?.avatar_url })
          const miCedula = profileData.cedula || "1004365645" //

          // 3. CONSULTA DIRECTA A TRANSACCIONES
          // Aquí es donde traemos "Nómina", "Cena", etc.
          const { data: transData, error: transError } = await supabase
            .from("transacciones")
            .select("categoria")
            .eq("user_id", miCedula)

          if (transError) throw transError

          // 4. CONSULTA A LA NUEVA TABLA DE CATEGORÍAS
          const { data: catOficiales } = await supabase
            .from("categorias")
            .select("*")
            .eq("user_id", miCedula)

          // 5. UNIFICAR TODO
          const nombresOficiales = catOficiales?.map(c => c.nombre.toLowerCase()) || []
          
          // Sacamos las categorías de las transacciones sin repetir
          const categoriasDeTransacciones = Array.from(
            new Set(transData?.map(t => t.categoria?.trim()).filter(Boolean) || [])
          )

          // Creamos la lista final
          const listaFinal = [...(catOficiales || [])]

          categoriasDeTransacciones.forEach(nombre => {
            if (!nombresOficiales.includes(nombre.toLowerCase())) {
              listaFinal.push({
                nombre: nombre,
                descripcion: "Detectada en tus transacciones anteriores",
                es_temporal: true
              })
            }
          })

          setCategorias(listaFinal)
        }
      } catch (err) {
        console.error("Error cargando datos:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
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
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: theme.text_color }}>Categorías</h1>
              <p className="text-muted-foreground">Listado vinculado a la cédula: {profile?.cedula}</p>
            </div>
            <Button className="rounded-full" style={{ backgroundColor: theme.primary_color }}>
              <Plus className="h-5 w-5 mr-2" /> Nueva
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center p-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div></div>
          ) : (
            <div className="grid gap-4">
              {categorias.length > 0 ? (
                categorias.map((cat, i) => (
                  <div 
                    key={i} 
                    className="flex items-center gap-4 p-4 rounded-xl border bg-white shadow-sm"
                    style={{ backgroundColor: theme.card_color, color: theme.text_color }}
                  >
                    <div className="h-12 w-12 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <Wallet className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg capitalize">{cat.nombre}</h3>
                      <p className="text-sm text-muted-foreground">{cat.descripcion}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center p-20 border-2 border-dashed rounded-3xl">
                  <p>No se encontraron categorías para la cédula {profile?.cedula}</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

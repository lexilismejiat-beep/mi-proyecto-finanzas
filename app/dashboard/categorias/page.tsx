"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/top-bar"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Plus, Tag, Wallet, Lightbulb } from "lucide-react"
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

        // 1. Obtenemos el perfil (Igual que en tu página de Transacciones)
        const { data: profileData } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", user.id)
          .single()
        
        if (profileData) {
          setProfile(profileData)
          const miCedula = profileData.cedula

          // 2. Buscamos Categorías Oficiales
          const { data: catOficiales } = await supabase
            .from("categorias")
            .select("*")
            .eq("user_id", miCedula)

          // 3. Escaneamos transacciones para capturar las que ya existen (Nómina, Cena, etc.)
          const { data: transData } = await supabase
            .from("transacciones")
            .select("categoria")
            .eq("user_id", miCedula)

          const nombresOficiales = catOficiales?.map(c => c.nombre.toLowerCase()) || []
          const transCategoriasUnicas = Array.from(
            new Set(transData?.map(t => t.categoria?.trim()).filter(Boolean) || [])
          )

          // 4. Fusionamos
          const listaFinal = [...(catOficiales || [])]
          transCategoriasUnicas.forEach(nombre => {
            if (!nombresOficiales.includes(nombre.toLowerCase())) {
              listaFinal.push({
                nombre: nombre,
                es_temporal: true,
                descripcion: "Categoría detectada en tus registros previos"
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
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: theme.text_color }}>
                Categorías de Gastos
              </h1>
              <p className="text-muted-foreground">Vínculo: Cédula {profile?.cedula || "Cargando..."}</p>
            </div>
            <Button className="gap-2" style={{ backgroundColor: theme.primary_color }}>
              <Plus className="h-4 w-4" /> Nueva Categoría
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center p-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categorias.length > 0 ? (
                categorias.map((cat, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "p-5 rounded-2xl border transition-all hover:shadow-md",
                      cat.es_temporal ? "border-dashed border-slate-300 opacity-80" : "border-slate-100 shadow-sm"
                    )}
                    style={{ backgroundColor: theme.card_color, color: theme.text_color }}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "h-12 w-12 rounded-xl flex items-center justify-center",
                        cat.es_temporal ? "bg-slate-100 text-slate-500" : "bg-emerald-100 text-emerald-600"
                      )}>
                        {cat.es_temporal ? <Lightbulb className="h-6 w-6" /> : <Wallet className="h-6 w-6" />}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg capitalize">{cat.nombre}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {cat.es_temporal ? "Pendiente por configurar" : (cat.descripcion || "Sin descripción")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center p-12 border-2 border-dashed rounded-2xl">
                   No se encontraron categorías para la cédula {profile?.cedula}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/top-bar"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useThemeSettings } from "@/lib/theme-context"

export default function CategoriasPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [categorias, setCategorias] = useState<string[]>([]) // Ahora es un array de textos
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()
  const { theme } = useThemeSettings()

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // 1. Obtener perfil para el TopBar y la Cédula
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

          // 2. Extraer categorías únicas de la tabla 'transacciones'
          if (profileData.cedula) {
            const { data: transData, error } = await supabase
              .from("transacciones")
              .select("categoria") // Seleccionamos solo la columna de categorías
              .eq("user_id", profileData.cedula)

            if (error) throw error

            if (transData) {
              // Filtrar valores repetidos y nulos
              const categoriasUnicas = Array.from(
                new Set(
                  transData
                    .map((t: any) => t.categoria?.trim())
                    .filter((c: string) => c !== null && c !== "" && c !== "NULL")
                )
              )
              setCategorias(categoriasUnicas as string[])
            }
          }
        }
      } catch (err) {
        console.error("Error al obtener categorías:", err)
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
          <div className="mb-6">
            <h1 className="text-2xl font-bold" style={{ color: theme.text_color }}>
              Tus Categorías
            </h1>
            <p className="text-muted-foreground">Listado basado en tus transacciones registradas</p>
          </div>

          {loading ? (
            <div className="flex justify-center p-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categorias.length > 0 ? (
                categorias.map((nombre, index) => (
                  <div 
                    key={index} 
                    className="p-6 rounded-xl border shadow-sm capitalize" 
                    style={{ backgroundColor: theme.card_color, color: theme.text_color }}
                  >
                    <span className="font-semibold text-lg">{nombre}</span>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center p-12 border-2 border-dashed rounded-xl">
                  <p className="text-muted-foreground">
                    No tienes transacciones con categorías para la cédula: <strong>{profile?.cedula}</strong>
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

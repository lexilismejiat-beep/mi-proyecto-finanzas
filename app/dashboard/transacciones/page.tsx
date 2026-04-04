"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/top-bar"
import { TransactionsTable } from "@/components/dashboard/transactions-table"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useThemeSettings } from "@/lib/theme-context"

export default function TransaccionesPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  
  const supabase = createClient()
  const { theme } = useThemeSettings()

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // IMPORTANTE: Traemos nombres, apellidos, cedula y avatar_url 
      // de la tabla user_profiles que es la que estamos reescribiendo
      const { data: profileData, error } = await supabase
        .from("user_profiles")
        .select("nombres, apellidos, cedula, avatar_url")
        .eq("id", user.id)
        .single()
      
      if (profileData) {
        setProfile(profileData)
      }
    }
    fetchProfile()
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

      <div
        className={cn(
          "transition-all duration-300",
          "lg:ml-64",
          sidebarCollapsed && "lg:ml-16"
        )}
      >
        {/* Aquí la TopBar ya recibe el avatar_url actualizado */}
        <TopBar 
          userName={profile ? `${profile.nombres} ${profile.apellidos}` : "Usuario"} 
          avatarUrl={profile?.avatar_url}
          onMenuClick={() => setMobileSidebarOpen(true)}
        />

        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: theme.text_color }}>
                Transacciones
              </h1>
              <p className="text-muted-foreground">Administra todas tus transacciones</p>
            </div>
            <Button 
              className="gap-2" 
              style={{ backgroundColor: theme.primary_color }}
            >
              <Plus className="h-4 w-4" />
              Nueva Transacción
            </Button>
          </div>

          <TransactionsTable 
            cardColor={theme.card_color} 
            textColor={theme.text_color} 
            userCedula={profile?.cedula} 
          />
        </main>
      </div>
    </div>
  )
}

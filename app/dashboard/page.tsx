"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/top-bar"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { TransactionsTable } from "@/components/dashboard/transactions-table"
import { CedulaSection } from "@/components/dashboard/cedula-section"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useThemeSettings } from "@/lib/theme-context"

interface UserProfile {
  id: string
  nombres: string
  apellidos: string
  cedula: string
  telefono: string
  fecha_nacimiento: string | null
  genero: string | null
  direccion: string | null
  ciudad: string | null
  pais: string | null
  avatar_url: string | null
}

export default function DashboardPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const supabase = createClient()
  const { theme } = useThemeSettings()

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", user.id)
          .single()
        setProfile(data)
      }
    }
    fetchProfile()
  }, [supabase])

  const userName = profile 
    ? `${profile.nombres} ${profile.apellidos}`.trim() 
    : "Usuario"

  return (
    <div className="min-h-screen">
      {/* Sidebar */}
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onCollapsedChange={setSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onMobileOpenChange={setMobileSidebarOpen}
        sidebarColor={theme.sidebar_color}
      />

      {/* Main Content */}
      <div
        className={cn(
          "transition-all duration-300",
          "lg:ml-64",
          sidebarCollapsed && "lg:ml-16"
        )}
      >
        {/* Top Bar */}
        <TopBar 
          userName={userName}
          avatarUrl={profile?.avatar_url}
          onMenuClick={() => setMobileSidebarOpen(true)}
        />

        {/* Page Content */}
        <main className="p-6">
          {/* Page Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold" style={{ color: theme.text_color }}>
              Resumen Financiero
            </h2>
            <p className="text-sm opacity-70" style={{ color: theme.text_color }}>
              Visualiza tus ingresos, gastos y balance general
            </p>
          </div>

          {/* Stats Cards */}
          <div className="mb-6">
            <StatsCards cardColor={theme.card_color} textColor={theme.text_color} primaryColor={theme.primary_color} />
          </div>

          {/* Main Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Transactions Table - Takes 2/3 width on large screens */}
            <div className="lg:col-span-2">
              <TransactionsTable cardColor={theme.card_color} textColor={theme.text_color} />
            </div>

            {/* Cedula Section - Takes 1/3 width on large screens */}
            <div className="lg:col-span-1">
              <CedulaSection 
                profile={profile}
                cardColor={theme.card_color} 
                textColor={theme.text_color}
                primaryColor={theme.primary_color}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

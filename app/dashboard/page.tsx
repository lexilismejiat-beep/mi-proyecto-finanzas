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

export default function DashboardPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [totals, setTotals] = useState({ income: 0, expenses: 0, balance: 0 })
  
  const supabase = createClient()
  const { theme } = useThemeSettings()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle()
        
        if (profileData) {
          setProfile(profileData)

          if (profileData.cedula) {
            const { data: transData } = await supabase
              .from("transacciones")
              .select("monto, tipo")
              .eq("user_id", profileData.cedula) 

            if (transData) {
              const income = transData
                .filter((t: any) => t.tipo?.trim() === "Ingreso")
                .reduce((acc: number, t: any) => acc + (Number(t.monto) || 0), 0)
              
              const expenses = transData
                .filter((t: any) => t.tipo?.trim() === "Egreso")
                .reduce((acc: number, t: any) => acc + (Number(t.monto) || 0), 0)

              setTotals({ income, expenses, balance: income - expenses })
            }
          }
        }
      } catch (err) {
        console.error("Error en Dashboard:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [supabase])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-t-primary border-white/20 rounded-full animate-spin" />
          <p className="animate-pulse">Cargando tus finanzas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.background_color || "#F8FAFC" }}>
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onCollapsedChange={setSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onMobileOpenChange={setMobileSidebarOpen}
        sidebarColor={theme.sidebar_color}
      />
      
      {/* CONTENEDOR PRINCIPAL: 
          - ml-0 por defecto (móvil)
          - lg:ml-64 cuando el sidebar está expandido en desktop
          - lg:ml-16 cuando el sidebar está colapsado en desktop
      */}
      <div className={cn(
        "transition-all duration-300 min-h-screen flex flex-col w-full", 
        "ml-0",
        "lg:ml-64", 
        sidebarCollapsed && "lg:ml-16"
      )}>
        <TopBar 
          userName={profile?.full_name || "Usuario"} 
          avatarUrl={profile?.avatar_url}
          onMenuClick={() => setMobileSidebarOpen(true)}
        />

        <main className="flex-1 p-4 md:p-6 lg:p-8 w-full max-w-[100vw] overflow-x-hidden">
          {/* Header del Dashboard */}
          <div className="mb-6 md:mb-8">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: theme.text_color }}>
              Resumen Financiero
            </h2>
            <p className="text-sm opacity-70" style={{ color: theme.text_color }}>
              Bienvenido de nuevo, {profile?.full_name?.split(' ')[0] || 'Usuario'}
            </p>
          </div>

          {/* Sección de Tarjetas (StatsCards debe tener grid-cols-1 sm:grid-cols-3) */}
          <div className="mb-8">
            <StatsCards 
              totalIncome={totals.income} 
              totalExpenses={totals.expenses} 
              currentBalance={totals.balance}
              cardColor={theme.card_color} 
              textColor={theme.text_color} 
              primaryColor={theme.primary_color} 
            />
          </div>

          {/* Grid Principal: 1 columna en móvil, 3 en desktop */}
          <div className="grid gap-6 lg:grid-cols-3 items-start">
            
            {/* Tabla de Transacciones: Ocupa 2 columnas en desktop, 1 en móvil */}
            <div className="lg:col-span-2 order-2 lg:order-1 overflow-hidden">
              <TransactionsTable 
                cardColor={theme.card_color} 
                textColor={theme.text_color} 
                userCedula={profile?.cedula} 
              />
            </div>

            {/* Sección de Identidad: Ocupa 1 columna. En móvil sale arriba (order-1) */}
            <div className="lg:col-span-1 order-1 lg:order-2">
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

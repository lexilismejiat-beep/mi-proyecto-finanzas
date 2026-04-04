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
  const [totals, setTotals] = useState({ income: 0, expenses: 0, balance: 0 })
  
  const supabase = createClient()
  const { theme } = useThemeSettings()

  useEffect(() => {
    const fetchData = async () => {
      // 1. Obtener el usuario autenticado
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 2. Traemos TODO el perfil incluyendo avatar y email
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*") // Esto ya trae nombres, apellidos, avatar_url, email, id, etc.
        .eq("id", user.id)
        .single()
      
      setProfile(profileData)

      // 3. Cálculo de finanzas basado en la cédula vinculada
      if (profileData?.cedula) {
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

          setTotals({
            income,
            expenses,
            balance: income - expenses
          })
        }
      } else {
        setTotals({ income: 0, expenses: 0, balance: 0 })
      }
    }
    fetchData()
  }, [supabase])

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8FAFC" }}>
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onCollapsedChange={setSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onMobileOpenChange={setMobileSidebarOpen}
        sidebarColor={theme.sidebar_color}
      />
      
      <div className={cn(
        "transition-all duration-300 min-h-screen", 
        "lg:ml-64", 
        sidebarCollapsed && "lg:ml-16"
      )}>
        <TopBar 
          userName={profile ? `${profile.nombres} ${profile.apellidos}` : "Usuario"} 
          avatarUrl={profile?.avatar_url}
          onMenuClick={() => setMobileSidebarOpen(true)}
        />

        <main className="p-4 md:p-8">
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold tracking-tight" style={{ color: theme.text_color }}>
              Resumen Financiero
            </h2>
            <p className="text-sm opacity-60">Gestiona tu libertad económica hoy.</p>
          </div>

          {/* Tarjetas de Estadísticas Principales */}
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

          <div className="grid gap-8 lg:grid-cols-3 items-start">
            {/* Tabla de Transacciones (Ocupa 2 columnas) */}
            <div className="lg:col-span-2 order-2 lg:order-1">
              <TransactionsTable 
                cardColor={theme.card_color} 
                textColor={theme.text_color} 
                userCedula={profile?.cedula} 
              />
            </div>

            {/* Nueva Sección de Identidad Financiera (Ocupa 1 columna) */}
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

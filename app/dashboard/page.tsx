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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 1. Cargar Perfil
      const { data: profileData } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single()
      setProfile(profileData)

      // 2. Cargar y Calcular Transacciones Reales
      const { data: transData } = await supabase
        .from("transacciones")
        .select("monto, tipo")

      if (transData) {
        // Sumamos Ingresos (limpiando espacios y asegurando que sea número)
        const income = transData
          .filter((t: any) => t.tipo?.trim() === "Ingreso")
          .reduce((acc: number, t: any) => acc + (Number(t.monto) || 0), 0)
        
        // Sumamos Egresos
        const expenses = transData
          .filter((t: any) => t.tipo?.trim() === "Egreso")
          .reduce((acc: number, t: any) => acc + (Number(t.monto) || 0), 0)

        setTotals({
          income,
          expenses,
          balance: income - expenses
        })
      }
    }
    fetchData()
  }, [supabase])

  return (
    <div className="min-h-screen">
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
        <main className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold" style={{ color: theme.text_color }}>Resumen Financiero</h2>
          </div>

          <div className="mb-6">
            {/* ENVIAMOS LOS TOTALES REALES AQUÍ */}
            <StatsCards 
              totalIncome={totals.income} 
              totalExpenses={totals.expenses} 
              currentBalance={totals.balance}
              cardColor={theme.card_color} 
              textColor={theme.text_color} 
              primaryColor={theme.primary_color} 
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <TransactionsTable cardColor={theme.card_color} textColor={theme.text_color} />
            </div>
            <div className="lg:col-span-1">
              <CedulaSection profile={profile} cardColor={theme.card_color} textColor={theme.text_color} />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

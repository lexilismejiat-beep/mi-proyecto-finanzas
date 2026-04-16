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

        // 1. Buscamos en la tabla 'profiles' que es la que tiene el 'full_name' y 'cedula'
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle()
        
        if (profileData) {
          setProfile(profileData)

          // 2. Cálculo de finanzas usando la cédula como user_id
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
        <p className="animate-pulse">Cargando tus finanzas...</p>
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
      
      <div className={cn(
        "transition-all duration-300 min-h-screen", 
        "lg:ml-64", 
        sidebarCollapsed && "lg:ml-16"
      )}>
        <TopBar 
          // CORRECCIÓN: Usamos full_name de tu tabla profiles
          userName={profile?.full_name || "Usuario"} 
          avatarUrl={profile?.avatar_url}
          onMenuClick={() => setMobileSidebarOpen(true)}
        />

        <main className="p-4 md:p-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold" style={{ color: theme.text_color }}>
              Resumen Financiero
            </h2>
          </div>

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

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <TransactionsTable 
                cardColor={theme.card_color} 
                textColor={theme.text_color} 
                userCedula={profile?.cedula} 
              />
            </div>

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

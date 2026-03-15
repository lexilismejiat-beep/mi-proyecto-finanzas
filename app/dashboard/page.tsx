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
  
  // Estado para guardar los totales de dinero real
  const [totals, setTotals] = useState({ income: 0, expenses: 0, balance: 0 })
  
  const supabase = createClient()
  const { theme } = useThemeSettings()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // 1. Traer el perfil del usuario
        const { data: profileData } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", user.id)
          .single()
        setProfile(profileData)

        // 2. Traer los datos de la tabla "transacciones"
        const { data: transData } = await supabase
          .from("transacciones")
          .select("monto, tipo")

        if (transData) {
          // Calculamos los ingresos sumando solo los tipos "Ingreso"
          const income = transData
            .filter((t) => t.tipo === "Ingreso")
            .reduce((acc, t) => acc + (Number(t.monto) || 0), 0)
          
          // Calculamos los gastos sumando solo los tipos "Egreso"
          const expenses = transData
            .filter((t) => t.tipo === "Egreso")
            .reduce((acc, t) => acc + (Number(t.monto) || 0), 0)

          setTotals({
            income,
            expenses,
            balance: income - expenses
          })
        }
      }
    }
    
    fetchData()
  }, [supabase])

  const userName = profile 
    ? `${profile.nombres} ${profile.apellidos}`.trim() 
    : "Usuario"

  return (
    <div className="min-h-screen">
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
        <TopBar 
          userName={userName}
          avatarUrl={profile?.avatar_url}
          onMenuClick={() => setMobileSidebarOpen(true)}
        />

        <main className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold" style={{ color: theme.text_color }}>
              Resumen Financiero
            </h2>
            <p className="text-sm opacity-70" style={{ color: theme.text_color }}>
              Visualiza tus ingresos, gastos y balance general
            </p>
          </div>

          {/* Stats Cards: Ahora le pasamos los datos calculados de Supabase */}
          <div className="mb-6">
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

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
        <p className="animate-pulse text-lg">Cargando tus finanzas...</p>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed" 
      style={{ 
        // PUNTO 3: Fondo dinámico. Si no hay imagen, usa el color de fondo.
        backgroundImage: theme.background_image ? `url(${theme.background_image})` : 'none',
        backgroundColor: !theme.background_image ? (theme.background_color || "#F8FAFC") : 'transparent' 
      }}
    >
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onCollapsedChange={setSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onMobileOpenChange={setMobileSidebarOpen}
        sidebarColor={theme.sidebar_color}
      />
      
      {/* PUNTO 2: Eliminamos el overflow y ajustamos el ancho para evitar desbordamiento en PC */}
      <div className={cn(
        "transition-all duration-300 min-h-screen flex flex-col", 
        "ml-0",
        "lg:ml-64", 
        sidebarCollapsed && "lg:ml-16"
      )}>
        <TopBar 
          userName={profile?.full_name || "Usuario"} 
          avatarUrl={profile?.avatar_url}
          onMenuClick={() => setMobileSidebarOpen(true)}
        />

        {/* Quitamos fondos blancos de aquí para que se vea el fondo de pantalla */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 w-full max-w-full overflow-x-hidden">
          
          <div className="mb-8">
            <h2 className="text-3xl font-bold" style={{ color: theme.text_color }}>
              Resumen Financiero
            </h2>
          </div>

          <div className="mb-8 w-full">
            <StatsCards 
              totalIncome={totals.income} 
              totalExpenses={totals.expenses} 
              currentBalance={totals.balance}
              cardColor={theme.card_color} 
              textColor={theme.text_color} 
              primaryColor={theme.primary_color} 
            />
          </div>

          {/* Grid Principal */}
          <div className="grid gap-6 lg:grid-cols-3 w-full">
            
            {/* PUNTO 1: En móvil, transacciones (order-1) va ANTES que identidad (order-2) */}
            <div className="lg:col-span-2 order-1 overflow-hidden">
              <TransactionsTable 
                cardColor={theme.card_color} 
                textColor={theme.text_color} 
                userCedula={profile?.cedula} 
              />
            </div>

            {/* PUNTO 1: Identidad Financiera aparece después en móvil */}
            <div className="lg:col-span-1 order-2">
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

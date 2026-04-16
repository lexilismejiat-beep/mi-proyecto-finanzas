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
        <p className="animate-pulse">Cargando tus finanzas...</p>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed transition-all duration-700" 
      style={{ 
        // Aplicamos la imagen de fondo directamente aquí
        backgroundImage: theme.background_image ? `url(${theme.background_image})` : 'none',
        backgroundColor: theme.background_color || "#F8FAFC"
      }}
    >
      {/* Capa de opacidad sobre la imagen para que el contenido no se pierda */}
      <div 
        className="min-h-screen w-full flex flex-col"
        style={{ backgroundColor: `rgba(0,0,0, ${1 - (theme.background_opacity || 1)})` }}
      >
        <Sidebar 
          collapsed={sidebarCollapsed} 
          onCollapsedChange={setSidebarCollapsed}
          mobileOpen={mobileSidebarOpen}
          onMobileOpenChange={setMobileSidebarOpen}
          sidebarColor={theme.sidebar_color}
        />
        
        <div className={cn(
          "transition-all duration-300 min-h-screen flex flex-col w-full", 
          "ml-0",
          "lg:ml-64", 
          sidebarCollapsed && "lg:ml-16"
        )}>
          {/* TopBar sin fondo sólido */}
          <TopBar 
            userName={profile?.full_name || "Usuario"} 
            avatarUrl={profile?.avatar_url}
            onMenuClick={() => setMobileSidebarOpen(true)}
            className="bg-transparent backdrop-blur-sm border-b border-white/10"
          />

          <main className="flex-1 p-4 md:p-8 w-full max-w-full overflow-x-hidden">
            <div className="mb-8">
              <h2 className="text-3xl font-bold" style={{ color: theme.text_color }}>
                Resumen Financiero
              </h2>
            </div>

            {/* Pasamos las propiedades de color transparentes a los componentes */}
            <div className="mb-8 w-full">
              <StatsCards 
                totalIncome={totals.income} 
                totalExpenses={totals.expenses} 
                currentBalance={totals.balance}
                // Forzamos que las tarjetas sean traslúcidas
                cardColor="rgba(255,255,255,0.05)" 
                textColor={theme.text_color} 
                primaryColor={theme.primary_color} 
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-3 w-full items-start">
              <div className="lg:col-span-2 order-1 overflow-hidden">
                <TransactionsTable 
                  // Usamos un fondo sutil que deje ver la imagen
                  cardColor="rgba(255,255,255,0.03)"
                  textColor={theme.text_color} 
                  userCedula={profile?.cedula} 
                />
              </div>

              <div className="lg:col-span-1 order-2">
                <CedulaSection 
                  profile={profile} 
                  cardColor="rgba(255,255,255,0.05)"
                  textColor={theme.text_color} 
                  primaryColor={theme.primary_color}
                />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

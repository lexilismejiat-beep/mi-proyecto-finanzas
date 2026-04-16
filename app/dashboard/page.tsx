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

// Lista de meses para el filtro
const MONTHS = [
  { value: 0, label: "Enero" }, { value: 1, label: "Febrero" },
  { value: 2, label: "Marzo" }, { value: 3, label: "Abril" },
  { value: 4, label: "Mayo" }, { value: 5, label: "Junio" },
  { value: 6, label: "Julio" }, { value: 7, label: "Agosto" },
  { value: 8, label: "Septiembre" }, { value: 9, label: "Octubre" },
  { value: 10, label: "Noviembre" }, { value: 11, label: "Diciembre" }
]

export default function DashboardPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [totals, setTotals] = useState({ income: 0, expenses: 0, balance: 0 })
  
  // ESTADO PARA EL FILTRO: Por defecto, el mes actual
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

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
            // Definimos el rango de fechas para el mes seleccionado
            const firstDay = new Date(selectedYear, selectedMonth, 1).toISOString()
            const lastDay = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59).toISOString()

            const { data: transData } = await supabase
              .from("transacciones")
              .select("monto, tipo, fecha")
              .eq("user_id", profileData.cedula)
              .gte("fecha", firstDay) // Mayor o igual al primer día del mes
              .lte("fecha", lastDay)  // Menor o igual al último día del mes

            if (transData) {
              const income = transData
                .filter((t: any) => t.tipo?.trim() === "Ingreso")
                .reduce((acc: number, t: any) => acc + (Number(t.monto) || 0), 0)
              
              const expenses = transData
                .filter((t: any) => t.tipo?.trim() === "Egreso")
                .reduce((acc: number, t: any) => acc + (Number(t.monto) || 0), 0)

              setTotals({ income, expenses, balance: income - expenses })
            } else {
              setTotals({ income: 0, expenses: 0, balance: 0 })
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
    // Se vuelve a ejecutar cada vez que el mes o el año cambian
  }, [supabase, selectedMonth, selectedYear])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a] text-white">
        <p className="animate-pulse text-lg">Actualizando datos mensuales...</p>
      </div>
    )
  }

  const backgroundImage = profile?.background_image || theme.background_image

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed transition-all duration-500" 
      style={{ 
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
        backgroundColor: backgroundImage ? 'transparent' : '#FFFFFF' 
      }}
    >
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onCollapsedChange={setSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onMobileOpenChange={setMobileSidebarOpen}
        sidebarColor={theme.sidebar_color}
      />
      
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

        <main className="flex-1 p-4 md:p-6 lg:p-8 w-full max-w-full overflow-x-hidden bg-transparent">
          
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold" style={{ color: theme.text_color || '#1e293b' }}>
                Resumen de {MONTHS.find(m => m.value === selectedMonth)?.label}
              </h2>
              <p className="text-sm opacity-70" style={{ color: theme.text_color }}>
                Visualizando movimientos de {MONTHS.find(m => m.value === selectedMonth)?.label} {selectedYear}
              </p>
            </div>

            {/* FILTRO DE MES */}
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md p-2 rounded-lg border border-white/20">
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="bg-transparent border-none outline-none font-medium cursor-pointer"
                style={{ color: theme.text_color || '#1e293b' }}
              >
                {MONTHS.map((month) => (
                  <option key={month.value} value={month.value} className="text-black">
                    {month.label}
                  </option>
                ))}
              </select>
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="bg-transparent border-none outline-none font-medium cursor-pointer"
                style={{ color: theme.text_color || '#1e293b' }}
              >
                {[2024, 2025, 2026].map((year) => (
                  <option key={year} value={year} className="text-black">
                    {year}
                  </option>
                ))}
              </select>
            </div>
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

          <div className="grid gap-6 lg:grid-cols-3 w-full">
            <div className="lg:col-span-2 order-1 overflow-hidden">
              <TransactionsTable 
                cardColor={theme.card_color} 
                textColor={theme.text_color} 
                userCedula={profile?.cedula}
                // Importante: Pasa los filtros a la tabla también para que coincidan
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
              />
            </div>

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

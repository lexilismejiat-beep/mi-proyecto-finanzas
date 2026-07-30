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
import { useProfile } from "@/contexts/profile-context"
import { useTasas } from "@/lib/hooks/use-tasas"

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
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  const supabase = createClient()
  const { theme } = useThemeSettings()
  const { cedula, monedaVisualizacion } = useProfile()
  const { tasas } = useTasas()

  useEffect(() => {
    const fetchData = async () => {
      if (!cedula) return
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

          const startOfMonth = new Date(selectedYear, selectedMonth, 1, 0, 0, 0).toISOString()
          const endOfMonth = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59).toISOString()

          // Los totales se calculan sobre monto_cop (eje contable fijo), nunca sobre monto.
          const { data: transData, error } = await supabase
            .from("transacciones")
            .select("monto_cop, tipo")
            .eq("user_id", cedula)
            .gte("created_at", startOfMonth)
            .lte("created_at", endOfMonth)

          if (error) throw error

          if (transData) {
            const income = transData
              .filter((t: any) => t.tipo === "Ingreso")
              .reduce((acc: number, t: any) => acc + (Number(t.monto_cop) || 0), 0)

            const expenses = transData
              .filter((t: any) => t.tipo === "Egreso")
              .reduce((acc: number, t: any) => acc + (Number(t.monto_cop) || 0), 0)

            setTotals({ income, expenses, balance: income - expenses })
          }
        }
      } catch (err) {
        console.error("Error:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [supabase, selectedMonth, selectedYear, cedula])

  // --- LÓGICA DE TEMAS Y FONDO ---
  const backgroundImage = profile?.background_image || theme?.background_image_url || theme?.background_image
  const activeBgColor = theme?.background_color || "#F3F4F6"
  const activeTextColor = theme?.text_color || "#1e293b"

  // Efecto de bordado/outline solo si hay imagen de fondo
  const textWithOutline = {
    color: activeTextColor,
    textShadow: backgroundImage 
      ? `-1.5px -1.5px 0 #FFFFFF, 1.5px -1.5px 0 #FFFFFF, -1.5px 1.5px 0 #FFFFFF, 1.5px 1.5px 0 #FFFFFF, 0px 2px 4px rgba(0,0,0,0.2)`
      : 'none'
  }

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      {/* CAPA DE FONDO: Fija detrás de todo */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-700"
        style={{ 
          backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
          backgroundColor: backgroundImage ? 'transparent' : activeBgColor,
          opacity: (theme?.background_opacity ?? 100) / 100
        }}
      />

      {/* CONTENIDO: Relativo para estar encima del fondo */}
      <div className="relative z-10 flex min-h-screen">
        <Sidebar 
          collapsed={sidebarCollapsed} 
          onCollapsedChange={setSidebarCollapsed}
          mobileOpen={mobileSidebarOpen}
          onMobileOpenChange={setMobileSidebarOpen}
          sidebarColor={theme?.sidebar_color || "#0f172a"}
        />
        
        <div className={cn(
          "transition-all duration-300 flex-1 flex flex-col", 
          "ml-0", "lg:ml-64", 
          sidebarCollapsed && "lg:ml-16"
        )}>
          <TopBar 
            userName={profile?.full_name || "Usuario"} 
            avatarUrl={profile?.avatar_url}
            onMenuClick={() => setMobileSidebarOpen(true)}
          />

          <main className="flex-1 p-4 md:p-6 lg:p-8 bg-transparent">
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black tracking-tight" style={textWithOutline}>
                  Resumen de {MONTHS.find(m => m.value === selectedMonth)?.label}
                </h2>
                <p className="text-base font-bold opacity-80" style={{ color: activeTextColor }}>
                  Visualizando movimientos de {MONTHS.find(m => m.value === selectedMonth)?.label} {selectedYear}
                </p>
              </div>

              <div className="flex items-center gap-2 bg-white/60 backdrop-blur-md p-2 rounded-xl border border-white shadow-lg">
                <select 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="bg-transparent border-none outline-none font-bold cursor-pointer text-slate-900"
                >
                  {MONTHS.map((month) => (
                    <option key={month.value} value={month.value}>{month.label}</option>
                  ))}
                </select>
                <select 
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="bg-transparent border-none outline-none font-bold cursor-pointer text-slate-900"
                >
                  {[2024, 2025, 2026].map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-8 w-full">
              <StatsCards
                totalIncome={totals.income}
                totalExpenses={totals.expenses}
                currentBalance={totals.balance}
                cardColor={theme?.card_color || "#FFFFFF"}
                textColor={activeTextColor}
                primaryColor={theme?.primary_color || "#10B981"}
                moneda={monedaVisualizacion}
                tasas={tasas}
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-3 w-full">
              <div className="lg:col-span-2 order-1 overflow-hidden">
                <TransactionsTable
                  cardColor={theme?.card_color || "#FFFFFF"}
                  textColor={activeTextColor}
                  userCedula={cedula || undefined}
                  moneda={monedaVisualizacion}
                  tasas={tasas}
                />
              </div>

              <div className="lg:col-span-1 order-2">
                <CedulaSection
                  profile={profile}
                  cedula={cedula}
                />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

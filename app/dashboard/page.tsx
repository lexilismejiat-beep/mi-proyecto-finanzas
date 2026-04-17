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
          
          const startOfMonth = new Date(selectedYear, selectedMonth, 1, 0, 0, 0).toISOString()
          const endOfMonth = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59).toISOString()

          const { data: transData, error } = await supabase
            .from("transacciones")
            .select("monto, tipo")
            .eq("user_id", profileData.cedula) 
            .gte("created_at", startOfMonth)
            .lte("created_at", endOfMonth)

          if (error) throw error

          if (transData) {
            const income = transData
              .filter((t: any) => t.tipo === "Ingreso")
              .reduce((acc: number, t: any) => acc + (Number(t.monto) || 0), 0)
            
            const expenses = transData
              .filter((t: any) => t.tipo === "Egreso")
              .reduce((acc: number, t: any) => acc + (Number(t.monto) || 0), 0)

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
  }, [supabase, selectedMonth, selectedYear])

  // --- SOLUCIÓN DE COLORES ---
  // Definimos colores por defecto por si el tema viene vacío
  const activeTextColor = theme?.text_color || '#1e293b'
  const activeSidebarColor = theme?.sidebar_color || '#ffffff'
  const activeCardColor = theme?.card_color || '#ffffff'
  const activePrimaryColor = theme?.primary_color || '#10b981'
  const backgroundImage = profile?.background_image || theme?.background_image

  const textWithOutline = {
    color: activeTextColor,
    // Solo aplicamos el borde blanco si hay una imagen de fondo, 
    // si el fondo es blanco (nuevo usuario), el borde blanco hace la letra invisible.
    textShadow: backgroundImage 
      ? `-1.5px -1.5px 0 #FFFFFF, 1.5px -1.5px 0 #FFFFFF, -1.5px 1.5px 0 #FFFFFF, 1.5px 1.5px 0 #FFFFFF, 0px 2px 4px rgba(0,0,0,0.2)`
      : 'none'
  }

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed transition-all duration-500" 
      style={{ 
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
        // Si no hay imagen, usamos un color de fondo gris muy claro o el del tema
        backgroundColor: backgroundImage ? 'transparent' : (theme?.background_color || '#f8fafc')
      }}
    >
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onCollapsedChange={setSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onMobileOpenChange={setMobileSidebarOpen}
        sidebarColor={activeSidebarColor}
      />
      
      <div className={cn(
        "transition-all duration-300 min-h-screen flex flex-col", 
        "ml-0", "lg:ml-64", 
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
              <h2 className="text-3xl font-black tracking-tight" style={textWithOutline}>
                Resumen de {MONTHS.find(m => m.value === selectedMonth)?.label}
              </h2>
              <p className="text-base font-bold" style={textWithOutline}>
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
              cardColor={activeCardColor} 
              textColor={activeTextColor} 
              primaryColor={activePrimaryColor} 
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3 w-full">
            <div className="lg:col-span-2 order-1 overflow-hidden">
              <TransactionsTable 
                cardColor={activeCardColor} 
                textColor={activeTextColor} 
                userCedula={profile?.cedula}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
              />
            </div>

            <div className="lg:col-span-1 order-2">
              <CedulaSection 
                profile={profile} 
                cardColor={activeCardColor} 
                textColor={activeTextColor} 
                primaryColor={activePrimaryColor}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

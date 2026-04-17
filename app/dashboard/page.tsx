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
          .from("user_profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle()
        
        if (profileData) {
          setProfile(profileData)
          const startStr = new Date(selectedYear, selectedMonth, 1, 0, 0, 0).toISOString()
          const endStr = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59).toISOString()

          const { data: transData, error } = await supabase
            .from("transacciones")
            .select("monto, tipo")
            .eq("user_id", profileData.cedula) 
            .gte("created_at", startStr)
            .lte("created_at", endStr)

          if (error) throw error

          if (transData) {
            const income = transData.filter((t: any) => t.tipo?.trim() === "Ingreso").reduce((acc: number, t: any) => acc + (Number(t.monto) || 0), 0)
            const expenses = transData.filter((t: any) => t.tipo?.trim() === "Egreso").reduce((acc: number, t: any) => acc + (Number(t.monto) || 0), 0)
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

  // --- LÓGICA DE FONDO Y TEMAS ---
  // Intentamos obtener la URL de la imagen de varias fuentes posibles
  const bgImage = profile?.background_image || theme?.background_image_url || theme?.background_image;
  
  const activeBgColor = theme?.background_color || "#f8fafc";
  const activeTextColor = theme?.text_color || "#1e293b";

  // Estilo de texto con sombra para que "flote" sobre la imagen
  const textStyle = {
    color: activeTextColor,
    textShadow: bgImage 
      ? `-1px -1px 0 #FFF, 1px -1px 0 #FFF, -1px 1px 0 #FFF, 1px 1px 0 #FFF, 0px 2px 4px rgba(0,0,0,0.2)` 
      : 'none'
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      {/* CAPA 1: Imagen de fondo fija */}
      {bgImage && (
        <div 
          className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat transition-opacity duration-700"
          style={{ 
            backgroundImage: `url(${bgImage})`,
            opacity: (theme?.background_opacity || 100) / 100 
          }}
        />
      )}

      {/* CAPA 2: Color de fondo (solo si no hay imagen) */}
      {!bgImage && (
        <div 
          className="fixed inset-0 z-0 transition-colors duration-500"
          style={{ backgroundColor: activeBgColor }}
        />
      )}

      {/* CAPA 3: Contenido principal */}
      <div className="relative z-10 flex min-h-screen">
        <Sidebar 
          collapsed={sidebarCollapsed} 
          onCollapsedChange={setSidebarCollapsed}
          mobileOpen={mobileSidebarOpen}
          onMobileOpenChange={setMobileSidebarOpen}
          sidebarColor={theme?.sidebar_color || "#0f172a"}
        />
        
        <div className={cn(
          "flex-1 flex flex-col transition-all duration-300", 
          "ml-0", "lg:ml-64", 
          sidebarCollapsed && "lg:ml-16"
        )}>
          <TopBar 
            userName={profile?.nombres || "Usuario"} 
            avatarUrl={profile?.avatar_url}
            onMenuClick={() => setMobileSidebarOpen(true)}
          />

          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black tracking-tight" style={textStyle}>
                  Resumen de {MONTHS.find(m => m.value === selectedMonth)?.label}
                </h2>
                <p className="text-base font-bold opacity-80" style={{ color: activeTextColor }}>
                  {selectedYear} • Dashboard Financiero
                </p>
              </div>

              {/* Selectores con blur para que no tapen el fondo */}
              <div className="flex items-center gap-2 bg-white/40 backdrop-blur-md p-2 rounded-xl border border-white/20 shadow-lg self-start">
                <select 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="bg-transparent border-none outline-none font-bold text-slate-900 text-sm cursor-pointer"
                >
                  {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                <div className="h-4 w-[1px] bg-slate-400/50" />
                <select 
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="bg-transparent border-none outline-none font-bold text-slate-900 text-sm cursor-pointer"
                >
                  {[2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            <div className="mb-8">
              <StatsCards 
                totalIncome={totals.income} 
                totalExpenses={totals.expenses} 
                currentBalance={totals.balance}
                cardColor={theme?.card_color || "#ffffff"} 
                textColor={activeTextColor} 
                primaryColor={theme?.primary_color || "#10b981"} 
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-3 items-start">
              <div className="lg:col-span-2 rounded-2xl overflow-hidden">
                <TransactionsTable 
                  cardColor={theme?.card_color || "#ffffff"} 
                  textColor={activeTextColor} 
                  userCedula={profile?.cedula}
                  selectedMonth={selectedMonth}
                  selectedYear={selectedYear}
                />
              </div>

              <div className="lg:col-span-1">
                <CedulaSection 
                  profile={profile} 
                  cardColor={theme?.card_color || "#ffffff"} 
                  textColor={activeTextColor} 
                  primaryColor={theme?.primary_color || "#10b981"}
                />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

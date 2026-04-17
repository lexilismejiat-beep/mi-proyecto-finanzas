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
  // Estados de Interfaz
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  
  // Estados de Datos
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

        // Intentamos obtener el perfil (user_profiles o profiles según tu DB)
        const { data: profileData } = await supabase
          .from("user_profiles") // Cambia a "profiles" si esa es tu tabla principal
          .select("*")
          .eq("id", user.id)
          .maybeSingle()
        
        if (profileData) {
          setProfile(profileData)
          
          // Cálculo de fechas para el filtro
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
            const income = transData
              .filter((t: any) => t.tipo?.trim() === "Ingreso")
              .reduce((acc: number, t: any) => acc + (Number(t.monto) || 0), 0)
            
            const expenses = transData
              .filter((t: any) => t.tipo?.trim() === "Egreso")
              .reduce((acc: number, t: any) => acc + (Number(t.monto) || 0), 0)

            setTotals({ income, expenses, balance: income - expenses })
          }
        }
      } catch (err) {
        console.error("Error en Dashboard:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [supabase, selectedMonth, selectedYear])

  // --- CONFIGURACIÓN DE COLORES DE SEGURIDAD (ANTI-BLANCO) ---
  const backgroundImage = profile?.background_image || theme?.background_image_url
  
  // Si el texto es blanco o no existe, y el fondo es claro, forzamos un color oscuro
  const isTextInvalid = !theme?.text_color || theme?.text_color?.toUpperCase() === "#FFFFFF"
  const activeTextColor = (isTextInvalid && !backgroundImage) ? "#1e293b" : (theme?.text_color || "#1e293b")
  
  const activeSidebarColor = theme?.sidebar_color || "#0f172a"
  const activeCardColor = theme?.card_color || "#ffffff"
  const activePrimaryColor = theme?.primary_color || "#10b981"
  const activeBgColor = theme?.background_color || "#f8fafc"

  // Efecto de borde para legibilidad sobre imágenes
  const textWithOutline = {
    color: activeTextColor,
    textShadow: backgroundImage 
      ? `-1px -1px 0 #FFFFFF, 1px -1px 0 #FFFFFF, -1px 1px 0 #FFFFFF, 1px 1px 0 #FFFFFF, 0px 2px 4px rgba(0,0,0,0.3)`
      : 'none'
  }

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed transition-all duration-500" 
      style={{ 
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
        backgroundColor: backgroundImage ? 'transparent' : activeBgColor 
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
          userName={profile?.nombres || "Usuario"} 
          avatarUrl={profile?.avatar_url}
          onMenuClick={() => setMobileSidebarOpen(true)}
        />

        <main className="flex-1 p-4 md:p-6 lg:p-8 w-full max-w-full overflow-x-hidden">
          
          {/* HEADER DEL DASHBOARD */}
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black tracking-tight" style={textWithOutline}>
                Resumen de {MONTHS.find(m => m.value === selectedMonth)?.label}
              </h2>
              <p className="text-base font-bold opacity-90" style={{ color: activeTextColor }}>
                {selectedYear} • Control de movimientos
              </p>
            </div>

            {/* SELECTORES CON DISEÑO FLOTANTE */}
            <div className="flex items-center gap-2 bg-white/70 backdrop-blur-md p-2 rounded-xl border border-white shadow-sm self-start">
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="bg-transparent border-none outline-none font-bold cursor-pointer text-slate-900 text-sm"
              >
                {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <div className="h-4 w-[1px] bg-slate-300" />
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="bg-transparent border-none outline-none font-bold cursor-pointer text-slate-900 text-sm"
              >
                {[2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          {/* TARJETAS DE ESTADÍSTICAS */}
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

          {/* GRID DE TABLA Y SECCIÓN DE CÉDULA */}
          <div className="grid gap-6 lg:grid-cols-3 w-full items-start">
            <div className="lg:col-span-2 order-1 overflow-hidden rounded-2xl">
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

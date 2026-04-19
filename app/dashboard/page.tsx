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
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns"

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
        
        const { data: mainProfile } = await supabase
          .from("profiles")
          .select("avatar_url, background_image")
          .eq("id", user.id)
          .maybeSingle()
        
        if (profileData) {
          // Guardamos el perfil pero nos aseguramos que si no hay cédula, sea null
          const fullProfile = {
            ...profileData,
            avatar_url: mainProfile?.avatar_url || profileData.avatar_url,
            background_image: mainProfile?.background_image
          }
          setProfile(fullProfile)
          
          const baseDate = new Date(selectedYear, selectedMonth, 1)
          const rangeFrom = startOfMonth(baseDate)
          const rangeTo = endOfMonth(baseDate)

          // --- CAMBIO CLAVE: Solo filtramos si hay cédula ---
          if (profileData.cedula) {
            const { data: transData, error } = await supabase
              .from("transacciones")
              .select("monto, tipo")
              .eq("user_id", profileData.cedula) 
              .gte("created_at", startOfDay(rangeFrom).toISOString())
              .lte("created_at", endOfDay(rangeTo).toISOString())

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
          } else {
            // Si no hay cédula, forzamos valores en cero
            setTotals({ income: 0, expenses: 0, balance: 0 })
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

  const backgroundImage = profile?.background_image || theme?.background_image_url || theme?.background_image
  const activeBgColor = theme?.background_color || "#F3F4F6"
  const activeTextColor = theme?.text_color || "#1e293b"

  const textWithOutline = {
    color: activeTextColor,
    textShadow: backgroundImage 
      ? `-1.5px -1.5px 0 #FFFFFF, 1.5px -1.5px 0 #FFFFFF, -1.5px 1.5px 0 #FFFFFF, 1.5px 1.5px 0 #FFFFFF, 0px 2px 4px rgba(0,0,0,0.2)`
      : 'none'
  }

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-700"
        style={{ 
          backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
          backgroundColor: backgroundImage ? 'transparent' : activeBgColor,
          opacity: (theme?.background_opacity ?? 100) / 100
        }}
      />

      <div className="relative z-10 flex min-h-screen">
        <Sidebar 
          collapsed={sidebarCollapsed} 
          onCollapsedChange={setSidebarCollapsed}
          mobileOpen={mobileSidebarOpen}
          onMobileOpenChange={setMobileSidebarOpen}
          sidebarColor={theme?.sidebar_color || "#0f172a"}
          // PASAMOS LA CÉDULA AL SIDEBAR
          userCedula={profile?.cedula}
        />
        
        <div className={cn(
          "transition-all duration-300 flex-1 flex flex-col", 
          "ml-0", "lg:ml-64", 
          sidebarCollapsed && "lg:ml-16"
        )}>
          <TopBar 
            userName={profile?.nombres || profile?.full_name || "Usuario"} 
            avatarUrl={profile?.avatar_url}
            onMenuClick={() => setMobileSidebarOpen(true)}
          />

          <main className="flex-1 p-4 md:p-6 lg:p-8 bg-transparent">
            {/* ... Resto del contenido igual ... */}
            <div className="grid gap-6 lg:grid-cols-3 w-full">
              <div className="lg:col-span-2">
                <TransactionsTable 
                  cardColor={theme?.card_color || "#FFFFFF"} 
                  textColor={activeTextColor} 
                  userCedula={profile?.cedula}
                  selectedMonth={selectedMonth}
                  selectedYear={selectedYear}
                />
              </div>
              <div className="lg:col-span-1">
                <CedulaSection 
                  profile={profile} 
                  cardColor={theme?.card_color || "#FFFFFF"} 
                  textColor={activeTextColor} 
                  primaryColor={theme?.primary_color || "#10B981"}
                />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

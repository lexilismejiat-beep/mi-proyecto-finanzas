"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation" 
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
  const router = useRouter()
  const { theme } = useThemeSettings()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push("/auth/login")
          return
        }

        // 1. CONSULTA COMBINADA: Traemos datos de user_profiles y de profiles (avatar_url)
        // Usamos la relación por el campo 'id' que comparten ambas tablas
        const { data: profileData } = await supabase
          .from("user_profiles") 
          .select(`
            *,
            profiles:id (avatar_url)
          `)
          .eq("id", user.id)
          .maybeSingle()
        
        if (!profileData || !profileData.registration_complete) {
          router.push("/registro")
          return
        }

        // Aplanamos el objeto para que avatar_url esté al mismo nivel
        const mergedProfile = {
          ...profileData,
          avatar_url: profileData.profiles?.avatar_url
        }

        setProfile(mergedProfile)

        // 2. Cálculo de finanzas usando la cédula
        if (mergedProfile.cedula) {
          const { data: transData } = await supabase
            .from("transacciones")
            .select("monto, tipo")
            .eq("user_id", mergedProfile.cedula) 

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
        console.error("Error crítico en Dashboard:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [supabase, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a] text-white font-mono">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="animate-pulse text-emerald-500">Cargando tus finanzas...</p>
        </div>
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
          userName={profile ? `${profile.nombres} ${profile.apellidos}` : "Usuario"} 
          avatarUrl={profile?.avatar_url} // <--- ¡AQUÍ APARECERÁ TU FOTO!
          onMenuClick={() => setMobileSidebarOpen(true)}
        />

        <main className="p-4 md:p-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold" style={{ color: theme.text_color }}>
              Resumen Financiero
            </h2>
            <p className="text-muted-foreground">Bienvenido de nuevo, {profile?.nombres}</p>
          </div>

          {/* Resto del contenido igual que antes... */}
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

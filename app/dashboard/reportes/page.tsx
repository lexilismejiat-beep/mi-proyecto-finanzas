"use client"

import { useState, useEffect, useMemo } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/top-bar"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Calendar, Loader2, TrendingUp, TrendingDown } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useThemeSettings } from "@/lib/theme-context"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts"

export default function ReportesPage() {
  const supabase = createClient()
  const { theme } = useThemeSettings()
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)

  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"]

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: p } = await supabase.from("user_profiles").select("*").eq("id", user.id).single()
          setProfile(p)
        }

        const { data: t } = await supabase
          .from('transacciones')
          .select('*')
        
        if (t) setTransactions(t)
      } catch (err) {
        console.error("Error cargando reportes:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [supabase])

  // Lógica de procesamiento de datos corregida para evaluar GASTOS
  const { categoryData, monthlyData, stats } = useMemo(() => {
    const cats: Record<string, number> = {}
    const months: Record<string, any> = {}
    let totalIngresos = 0
    let totalGastos = 0

    transactions.forEach((t) => {
      const monto = parseFloat(t.monto) || 0
      const cat = t.categoria || "Otros"
      const date = t.created_at ? new Date(t.created_at) : new Date()
      const monthLabel = date.toLocaleString('es-ES', { month: 'short' }).toUpperCase()

      // Clasificación de Gastos e Ingresos
      if (monto < 0) {
        const valorAbsoluto = Math.abs(monto)
        cats[cat] = (cats[cat] || 0) + valorAbsoluto
        totalGastos += valorAbsoluto
      } else if (monto > 0) {
        totalIngresos += monto
      }

      // Preparación para Gráfica Mensual
      if (!months[monthLabel]) {
        months[monthLabel] = { name: monthLabel, ingresos: 0, gastos: 0 }
      }
      if (monto > 0) {
        months[monthLabel].ingresos += monto
      } else {
        months[monthLabel].gastos += Math.abs(monto)
      }
    })

    return {
      categoryData: Object.entries(cats).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value),
      monthlyData: Object.values(months),
      stats: { totalIngresos, totalGastos, balance: totalIngresos - totalGastos }
    }
  }, [transactions])

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(value)

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Sidebar 
        collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed}
        mobileOpen={mobileSidebarOpen} onMobileOpenChange={setMobileSidebarOpen}
        sidebarColor={theme.sidebar_color}
      />

      <div className={cn("transition-all duration-300", "lg:ml-64", sidebarCollapsed && "lg:ml-16")}>
        <TopBar 
          userName={profile ? `${profile.nombres} ${profile.apellidos}` : "Usuario"} 
          onMenuClick={() => setMobileSidebarOpen(true)}
        />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Reportes Financieros</h1>
              <p className="text-gray-400">Visualización de tus ingresos y gastos reales</p>
            </div>
            <div className="flex gap-2">
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Download className="h-4 w-4 mr-2" /> Exportar PDF
              </Button>
            </div>
          </header>

          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
          ) : (
            <>
              {/* Tarjetas de Resumen */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-[#121212] border-white/10 p-4">
                  <p className="text-gray-400 text-sm">Balance Total</p>
                  <h2 className={cn("text-2xl font-bold", stats.balance >= 0 ? "text-emerald-400" : "text-rose-400")}>
                    {formatCurrency(stats.balance)}
                  </h2>
                </Card>
                <Card className="bg-[#121212] border-white/10 p-4">
                  <p className="text-gray-400 text-sm flex items-center gap-1 text-emerald-500">
                    <TrendingUp size={14} className="mr-1" /> Total Ingresos
                  </p>
                  <h2 className="text-2xl font-bold text-white">{formatCurrency(stats.totalIngresos)}</h2>
                </Card>
                <Card className="bg-[#121212] border-white/10 p-4">
                  <p className="text-gray-400 text-sm flex items-center gap-1 text-rose-500">
                    <TrendingDown size={14} className="mr-1" /> Total Gastos
                  </p>
                  <h2 className="text-2xl font-bold text-white">{formatCurrency(stats.totalGastos)}</h2>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Flujo Mensual */}
                <Card className="bg-[#121212] border-white/10">
                  <CardHeader><CardTitle className="text-base text-white">Ingresos vs Gastos por Mes</CardTitle></CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                        <XAxis dataKey="name" stroke="#737373" fontSize={12} />
                        <YAxis stroke="#737373" fontSize={12} tickFormatter={(v) => `$${v/1000}k`} />
                        <Tooltip contentStyle={{ backgroundColor: "#121212", border: "1px solid #262626" }} />
                        <Bar dataKey="ingresos" fill="#10b981" radius={[4, 4, 0, 0]} name="Ingresos" />
                        <Bar dataKey="gastos" fill="#ef4444" radius={[4, 4, 0, 0]} name="Gastos" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Gastos por Categoría */}
                <Card className="bg-[#121212] border-white/10">
                  <CardHeader><CardTitle className="text-base text-white">Distribución de Gastos</CardTitle></CardHeader>
                  <CardContent className="h-[300px]">
                    {categoryData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryData}
                            innerRadius={60} outerRadius={80}
                            paddingAngle={5} dataKey="value"
                          >
                            {categoryData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: "#121212", border: "1px solid #262626" }} />
                          <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-500 text-sm italic">
                        No hay gastos registrados para mostrar
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}

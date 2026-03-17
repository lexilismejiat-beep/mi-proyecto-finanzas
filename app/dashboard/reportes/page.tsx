"use client"

import { useState, useEffect, useMemo } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/top-bar"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Loader2, TrendingUp, TrendingDown, Calendar as CalendarIcon } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useThemeSettings } from "@/lib/theme-context"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts"

// Componentes para el filtro de fecha
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { es } from "date-fns/locale"

export default function ReportesPage() {
  const supabase = createClient()
  const { theme } = useThemeSettings()
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)

  // Estado del filtro de fechas (Inicia con el mes actual)
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  })

  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"]

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // 1. Obtener perfil por ID de usuario
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()
        
        setProfile(profileData)

        // 2. Filtrar transacciones por Cédula y Rango de Fechas
        if (profileData?.cedula) {
          const { data: transData } = await supabase
            .from("transacciones")
            .select("*")
            .eq("user_id", profileData.cedula)
            .gte("created_at", dateRange.from.toISOString())
            .lte("created_at", dateRange.to.toISOString())
          
          if (transData) setTransactions(transData)
        }
      } catch (err) {
        console.error("Error cargando datos:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [supabase, dateRange])

  const { categoryData, monthlyData, stats } = useMemo(() => {
    const cats: Record<string, number> = {}
    const months: Record<string, any> = {}
    let totalIncome = 0
    let totalExpenses = 0

    transactions.forEach((t) => {
      const monto = Number(t.monto) || 0
      const tipo = t.tipo?.trim()
      const cat = t.categoria || "Otros"
      const date = t.created_at ? new Date(t.created_at) : new Date()
      const monthLabel = date.toLocaleString('es-ES', { month: 'short' }).toUpperCase()

      if (!months[monthLabel]) {
        months[monthLabel] = { name: monthLabel, ingresos: 0, gastos: 0 }
      }

      if (tipo === "Ingreso") {
        totalIncome += monto
        months[monthLabel].ingresos += monto
      } else if (tipo === "Egreso") {
        totalExpenses += monto
        months[monthLabel].gastos += monto
        cats[cat] = (cats[cat] || 0) + monto
      }
    })

    return {
      categoryData: Object.entries(cats).map(([name, value]) => ({ name, value })),
      monthlyData: Object.values(months),
      stats: { totalIncome, totalExpenses, balance: totalIncome - totalExpenses }
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
          userName={profile?.full_name || "Usuario"} 
          avatarUrl={profile?.avatar_url}
          onMenuClick={() => setMobileSidebarOpen(true)}
        />

        <main className="p-6 space-y-6">
          {/* Encabezado con Filtro de Fecha */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Análisis Detallado</h1>
              <p className="text-gray-400">Estadísticas reales basadas en tus movimientos</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 bg-[#121212] p-2 rounded-xl border border-white/10">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" className="text-gray-300 hover:bg-white/5 font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4 text-emerald-500" />
                    {format(dateRange.from, "dd LLL", { locale: es })} - {format(dateRange.to, "dd LLL, yyyy", { locale: es })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-[#121212] border-white/10" align="end">
                  <Calendar
                    initialFocus
                    mode="range"
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range: any) => range?.from && range?.to && setDateRange({ from: range.from, to: range.to })}
                    locale={es}
                    className="text-white"
                  />
                </PopoverContent>
              </Popover>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                <Download size={18} /> Exportar PDF
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
            </div>
          ) : (
            <>
              {/* Tarjetas de Resumen en Modo Oscuro */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-[#121212] border-white/10 shadow-2xl">
                  <CardContent className="pt-6">
                    <p className="text-gray-400 text-sm">Balance General</p>
                    <h2 className={cn("text-2xl font-bold mt-1", stats.balance >= 0 ? "text-emerald-400" : "text-rose-400")}>
                      {formatCurrency(stats.balance)}
                    </h2>
                  </CardContent>
                </Card>
                <Card className="bg-[#121212] border-white/10 shadow-2xl">
                  <CardContent className="pt-6">
                    <p className="text-gray-400 text-sm flex items-center gap-2">
                      <TrendingUp size={16} className="text-emerald-500" /> Ingresos Totales
                    </p>
                    <h2 className="text-2xl font-bold mt-1 text-white">{formatCurrency(stats.totalIncome)}</h2>
                  </CardContent>
                </Card>
                <Card className="bg-[#121212] border-white/10 shadow-2xl">
                  <CardContent className="pt-6">
                    <p className="text-gray-400 text-sm flex items-center gap-2">
                      <TrendingDown size={16} className="text-rose-500" /> Gastos Totales
                    </p>
                    <h2 className="text-2xl font-bold mt-1 text-white">{formatCurrency(stats.totalExpenses)}</h2>
                  </CardContent>
                </Card>
              </div>

              {/* Gráficas */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-[#121212] border-white/10">
                  <CardHeader>
                    <CardTitle className="text-lg font-medium text-gray-200">Comparativa Mensual</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
                        <XAxis dataKey="name" stroke="#737373" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#737373" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v/1000}k`} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: "#121212", border: "1px solid #262626", borderRadius: "8px" }}
                          itemStyle={{ fontSize: "12px" }}
                        />
                        <Bar dataKey="ingresos" fill="#10b981" radius={[4, 4, 0, 0]} name="Ingresos" />
                        <Bar dataKey="gastos" fill="#ef4444" radius={[4, 4, 0, 0]} name="Gastos" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="bg-[#121212] border-white/10">
                  <CardHeader>
                    <CardTitle className="text-lg font-medium text-gray-200">Gastos por Categoría</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={categoryData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                          {categoryData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: "#121212", border: "1px solid #262626", borderRadius: "8px" }} />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: "20px" }} />
                      </PieChart>
                    </ResponsiveContainer>
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

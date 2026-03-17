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

// Importar componentes de UI para el filtro (ajusta según tu librería, ej: shadcn)
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

  // Estado para el filtro de fechas (por defecto el mes actual)
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

        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()
        
        setProfile(profileData)

        if (profileData?.cedula) {
          // Consulta con filtro de fechas directamente en Supabase
          const { data: transData } = await supabase
            .from("transacciones")
            .select("*")
            .eq("user_id", profileData.cedula)
            .gte("created_at", dateRange.from.toISOString())
            .lte("created_at", dateRange.to.toISOString())
          
          if (transData) setTransactions(transData)
        }
      } catch (err) {
        console.error("Error en reportes:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [supabase, dateRange]) // Se recarga cuando cambia la fecha

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
    <div className="min-h-screen bg-[#f4f4f7] text-slate-900">
      <Sidebar 
        collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed}
        mobileOpen={mobileSidebarOpen} onMobileOpenChange={setMobileSidebarOpen}
        sidebarColor="#1e293b" // Sidebar oscuro para contraste
      />

      <div className={cn("transition-all duration-300", "lg:ml-64", sidebarCollapsed && "lg:ml-16")}>
        <TopBar 
          userName={profile?.full_name || "Usuario"} 
          onMenuClick={() => setMobileSidebarOpen(true)}
        />

        <main className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h1 className="text-3xl font-bold text-slate-800">Análisis Detallado</h1>
            
            <div className="flex items-center gap-2 bg-white p-1 rounded-lg border shadow-sm">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" className="text-slate-600 font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dateRange.from, "dd LLL", { locale: es })} - {format(dateRange.to, "dd LLL, yyyy", { locale: es })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range: any) => range?.from && range?.to && setDateRange({ from: range.from, to: range.to })}
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
              <Button className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2">
                <Download size={18} /> Exportar PDF
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>
          ) : (
            <>
              {/* Tarjetas con Fondo Blanco */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white border-none shadow-sm">
                  <CardContent className="pt-6">
                    <p className="text-sm font-medium text-slate-500">Balance General</p>
                    <h2 className="text-2xl font-bold text-emerald-600">{formatCurrency(stats.balance)}</h2>
                  </CardContent>
                </Card>
                <Card className="bg-white border-none shadow-sm">
                  <CardContent className="pt-6">
                    <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
                       Ingresos Totales
                    </p>
                    <h2 className="text-2xl font-bold text-slate-800">{formatCurrency(stats.totalIncome)}</h2>
                  </CardContent>
                </Card>
                <Card className="bg-white border-none shadow-sm">
                  <CardContent className="pt-6">
                    <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
                       Gastos Totales
                    </p>
                    <h2 className="text-2xl font-bold text-rose-500">{formatCurrency(stats.totalExpenses)}</h2>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráficas con estilos claros */}
                <Card className="bg-white border-none shadow-sm">
                  <CardHeader><CardTitle className="text-slate-700 text-lg">Comparativa Mensual</CardTitle></CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                        <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `$${v/1000}k`} />
                        <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="ingresos" fill="#10b981" radius={[4, 4, 0, 0]} name="Ingresos" />
                        <Bar dataKey="gastos" fill="#ef4444" radius={[4, 4, 0, 0]} name="Gastos" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="bg-white border-none shadow-sm">
                  <CardHeader><CardTitle className="text-slate-700 text-lg">Gastos por Categoría</CardTitle></CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={categoryData} innerRadius={70} outerRadius={90} paddingAngle={5} dataKey="value">
                          {categoryData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend iconType="circle" />
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

"use client"

import { useState, useEffect, useMemo } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/top-bar"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Calendar, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useThemeSettings } from "@/lib/theme-context"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
} from "recharts"

export default function ReportesPage() {
  const supabase = createClient()
  const { theme } = useThemeSettings()
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)

  //Colores para las gráficas (puedes personalizarlos)
  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"]

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      // 1. Obtener Perfil
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: p } = await supabase.from("user_profiles").select("*").eq("id", user.id).single()
        setProfile(p)
      }

      // 2. Obtener Transacciones
      const { data: t } = await supabase
        .from('transacciones')
        .select('*')
        .order('created_at', { ascending: true })
      
      if (t) setTransactions(t)
      setLoading(false)
    }
    fetchData()
  }, [supabase])

  // Lógica para transformar datos de Supabase a Formato de Gráficas
  const chartData = useMemo(() => {
    const categories: Record<string, number> = {}
    const monthly: Record<string, { month: string, ingresos: number, gastos: number }> = {}

    transactions.forEach((t: any) => {
      const date = new Date(t.created_at)
      const monthName = date.toLocaleString('es-ES', { month: 'short' })
      const monto = t.monto || 0
      const cat = t.categoria || "Otros"

      // Gastos por Categoría (Solo negativos para la torta)
      if (monto < 0) {
        categories[cat] = (categories[cat] || 0) + Math.abs(monto)
      }

      // Ingresos vs Gastos por mes
      if (!monthly[monthName]) {
        monthly[monthName] = { month: monthName, ingresos: 0, gastos: 0 }
      }
      if (monto > 0) monthly[monthName].ingresos += monto
      else monthly[monthName].gastos += Math.abs(monto)
    })

    return {
      category: Object.entries(categories).map(([name, value]) => ({ name, value })),
      monthly: Object.values(monthly)
    }
  }, [transactions])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      notation: "compact",
    }).format(value)
  }

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
          avatarUrl={profile?.avatar_url}
          onMenuClick={() => setMobileSidebarOpen(true)}
        />

        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold">Reportes</h1>
              <p className="text-gray-400 text-sm">Estadísticas reales basadas en tus movimientos</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="border-white/10 bg-[#121212] hover:bg-white/5">
                <Calendar className="h-4 w-4 mr-2" /> Histórico
              </Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Download className="h-4 w-4 mr-2" /> PDF
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-40">
              <Loader2 className="h-10 w-10 animate-spin text-emerald-500 mb-4" />
              <p className="text-gray-400">Analizando datos...</p>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Gráfica de Barras: Ingresos vs Gastos */}
              <Card className="lg:col-span-2 bg-[#121212] border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Ingresos vs Gastos por Mes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData.monthly}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                        <XAxis dataKey="month" stroke="#737373" />
                        <YAxis stroke="#737373" tickFormatter={formatCurrency} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#121212", border: "1px solid #262626", borderRadius: "8px" }}
                          formatter={(value: number) => [formatCurrency(value), ""]}
                        />
                        <Bar dataKey="ingresos" fill="#10b981" radius={[4, 4, 0, 0]} name="Ingresos" />
                        <Bar dataKey="gastos" fill="#ef4444" radius={[4, 4, 0, 0]} name="Gastos" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Gráfica de Torta: Gastos por Categoría */}
              <Card className="bg-[#121212] border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Distribución de Gastos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData.category}
                          cx="50%" cy="50%"
                          innerRadius={60} outerRadius={80}
                          paddingAngle={5} dataKey="value"
                        >
                          {chartData.category.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: "#121212", border: "1px solid #262626", borderRadius: "8px" }}
                          formatter={(value: number) => [formatCurrency(value), ""]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {chartData.category.map((item, index) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="text-xs text-gray-400 truncate">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Tarjeta Informativa de Resumen */}
              <Card className="bg-[#121212] border-white/10 flex flex-col justify-center p-6">
                 <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                       <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">Categoría Dominante</p>
                       <h3 className="text-2xl font-bold text-white mt-1">
                          {chartData.category.length > 0 ? chartData.category.sort((a,b) => b.value - a.value)[0].name : "N/A"}
                       </h3>
                    </div>
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                       <p className="text-emerald-500/80 text-sm font-medium uppercase tracking-wider">Ahorro Estimado</p>
                       <h3 className="text-2xl font-bold text-emerald-400 mt-1">
                          {formatCurrency(transactions.reduce((acc, t) => acc + (t.monto || 0), 0))}
                       </h3>
                    </div>
                 </div>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

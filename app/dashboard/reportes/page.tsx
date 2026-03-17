"use client"

import { useState, useEffect, useMemo } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/top-bar"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Loader2, TrendingUp, TrendingDown } from "lucide-react"
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
        if (!user) return

        // 1. Obtener perfil para sacar la cédula (igual que en tu Dashboard)
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()
        
        setProfile(profileData)

        // 2. Obtener transacciones usando la cédula como vínculo
        if (profileData?.cedula) {
          const { data: transData } = await supabase
            .from("transacciones")
            .select("*")
            .eq("user_id", profileData.cedula)
          
          if (transData) setTransactions(transData)
        }
      } catch (err) {
        console.error("Error en reportes:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [supabase])

  // Lógica de procesamiento de datos sincronizada con tu estructura de DB
  const { categoryData, monthlyData, stats } = useMemo(() => {
    const cats: Record<string, number> = {}
    const months: Record<string, any> = {}
    let totalIncome = 0
    let totalExpenses = 0

    transactions.forEach((t) => {
      const monto = Number(t.monto) || 0
      const tipo = t.tipo?.trim() // "Ingreso" o "Egreso"
      const cat = t.categoria || "Otros"
      
      // Manejo de fecha
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
        // Llenar datos para la gráfica de torta (solo egresos)
        cats[cat] = (cats[cat] || 0) + monto
      }
    })

    return {
      categoryData: Object.entries(cats).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value),
      monthlyData: Object.values(months),
      stats: { totalIncome, totalExpenses, balance: totalIncome - totalExpenses }
    }
  }, [transactions])

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(value)

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.card_color === '#ffffff' ? '#f4f4f5' : '#0a0a0a' }}>
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
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold" style={{ color: theme.text_color }}>Análisis Detallado</h1>
            <Button className="gap-2" style={{ backgroundColor: theme.primary_color }}>
              <Download size={18} /> Exportar PDF
            </Button>
          </div>

          {loading ? (
            <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin" /></div>
          ) : (
            <>
              {/* Tarjetas de Resumen Sincronizadas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card style={{ backgroundColor: theme.card_color, borderColor: 'rgba(255,255,255,0.1)' }}>
                  <CardContent className="pt-6">
                    <p className="text-sm opacity-70" style={{ color: theme.text_color }}>Balance General</p>
                    <h2 className="text-2xl font-bold" style={{ color: stats.balance >= 0 ? '#10b981' : '#ef4444' }}>
                      {formatCurrency(stats.balance)}
                    </h2>
                  </CardContent>
                </Card>
                <Card style={{ backgroundColor: theme.card_color, borderColor: 'rgba(255,255,255,0.1)' }}>
                  <CardContent className="pt-6">
                    <p className="text-sm opacity-70 flex items-center gap-2" style={{ color: theme.text_color }}>
                      <TrendingUp size={16} className="text-emerald-500" /> Ingresos Totales
                    </p>
                    <h2 className="text-2xl font-bold" style={{ color: theme.text_color }}>{formatCurrency(stats.totalIncome)}</h2>
                  </CardContent>
                </Card>
                <Card style={{ backgroundColor: theme.card_color, borderColor: 'rgba(255,255,255,0.1)' }}>
                  <CardContent className="pt-6">
                    <p className="text-sm opacity-70 flex items-center gap-2" style={{ color: theme.text_color }}>
                      <TrendingDown size={16} className="text-rose-500" /> Gastos Totales
                    </p>
                    <h2 className="text-2xl font-bold" style={{ color: theme.text_color }}>{formatCurrency(stats.totalExpenses)}</h2>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfica de Barras Mensual */}
                <Card style={{ backgroundColor: theme.card_color, borderColor: 'rgba(255,255,255,0.1)' }}>
                  <CardHeader><CardTitle style={{ color: theme.text_color }}>Comparativa Mensual</CardTitle></CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="name" stroke={theme.text_color} fontSize={12} opacity={0.5} />
                        <YAxis stroke={theme.text_color} fontSize={12} opacity={0.5} tickFormatter={(v) => `$${v/1000}k`} />
                        <Tooltip contentStyle={{ backgroundColor: theme.card_color, border: '1px solid rgba(255,255,255,0.1)' }} />
                        <Bar dataKey="ingresos" fill="#10b981" radius={[4, 4, 0, 0]} name="Ingresos" />
                        <Bar dataKey="gastos" fill="#ef4444" radius={[4, 4, 0, 0]} name="Gastos" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Distribución por Categoría */}
                <Card style={{ backgroundColor: theme.card_color, borderColor: 'rgba(255,255,255,0.1)' }}>
                  <CardHeader><CardTitle style={{ color: theme.text_color }}>Gastos por Categoría</CardTitle></CardHeader>
                  <CardContent className="h-80">
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
                          <Tooltip contentStyle={{ backgroundColor: theme.card_color, border: '1px solid rgba(255,255,255,0.1)' }} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center opacity-50 italic">No hay gastos para mostrar</div>
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

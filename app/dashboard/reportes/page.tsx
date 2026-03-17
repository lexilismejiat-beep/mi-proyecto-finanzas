

import { useState, useEffect, useMemo, useRef } from "react"
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

// PDF e Imagen
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

// Filtro de fecha
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { es } from "date-fns/locale"

export default function ReportesPage() {
  const supabase = createClient()
  const { theme } = useThemeSettings()
  const reportRef = useRef<HTMLDivElement>(null) // Referencia para capturar el PDF
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [profile, setProfile] = useState<any>(null)

  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  })

  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"]

  // --- Lógica de exportación a PDF ---
  const exportToPDF = async () => {
    if (!reportRef.current) return
    setIsExporting(true)

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: "#0a0a0a", // Mantiene el fondo oscuro en el PDF
        logging: false,
        useCORS: true
      })
      
      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF("p", "mm", "a4")
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight)
      pdf.save(`Reporte_Financiero_${format(new Date(), "yyyy-MM-dd")}.pdf`)
    } catch (error) {
      console.error("Error al generar PDF:", error)
    } finally {
      setIsExporting(false)
    }
  }

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()
        setProfile(profileData)

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
        console.error("Error:", err)
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
      const date = new Date(t.created_at)
      const monthLabel = date.toLocaleString('es-ES', { month: 'short' }).toUpperCase()

      if (!months[monthLabel]) months[monthLabel] = { name: monthLabel, ingresos: 0, gastos: 0 }

      if (tipo === "Ingreso") {
        totalIncome += monto
        months[monthLabel].ingresos += monto
      } else {
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

  const formatCurrency = (v: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(v)

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Sidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} mobileOpen={mobileSidebarOpen} onMobileOpenChange={setMobileSidebarOpen} />

      <div className={cn("transition-all duration-300", "lg:ml-64", sidebarCollapsed && "lg:ml-16")}>
        <TopBar userName={profile?.full_name || "Usuario"} onMenuClick={() => setMobileSidebarOpen(true)} />

        <main className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h1 className="text-3xl font-bold tracking-tight">Análisis Detallado</h1>
            
            <div className="flex items-center gap-2 bg-[#121212] p-2 rounded-xl border border-white/10">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" className="text-gray-300 font-normal hover:bg-white/5">
                    <CalendarIcon className="mr-2 h-4 w-4 text-emerald-500" />
                    {format(dateRange.from, "dd LLL", { locale: es })} - {format(dateRange.to, "dd LLL, yyyy", { locale: es })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-[#121212] border-white/10" align="end">
                  <Calendar mode="range" selected={{ from: dateRange.from, to: dateRange.to }} onSelect={(r: any) => r?.from && r?.to && setDateRange({ from: r.from, to: r.to })} locale={es} />
                </PopoverContent>
              </Popover>

              {/* BOTÓN DE EXPORTAR PDF HABILITADO */}
              <Button 
                onClick={exportToPDF} 
                disabled={isExporting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              >
                {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download size={18} />}
                {isExporting ? "Generando..." : "Exportar PDF"}
              </Button>
            </div>
          </div>

          <div ref={reportRef} className="space-y-6 p-2"> {/* Contenedor que se captura */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-[#121212] border-white/10 shadow-2xl">
                <CardContent className="pt-6">
                  <p className="text-gray-400 text-sm">Balance General</p>
                  <h2 className={cn("text-2xl font-bold mt-1", stats.balance >= 0 ? "text-emerald-400" : "text-rose-400")}>{formatCurrency(stats.balance)}</h2>
                </CardContent>
              </Card>
              <Card className="bg-[#121212] border-white/10 shadow-2xl">
                <CardContent className="pt-6">
                  <p className="text-gray-400 text-sm flex items-center gap-2"><TrendingUp size={16} className="text-emerald-500" /> Ingresos Totales</p>
                  <h2 className="text-2xl font-bold mt-1">{formatCurrency(stats.totalIncome)}</h2>
                </CardContent>
              </Card>
              <Card className="bg-[#121212] border-white/10 shadow-2xl">
                <CardContent className="pt-6">
                  <p className="text-gray-400 text-sm flex items-center gap-2"><TrendingDown size={16} className="text-rose-500" /> Gastos Totales</p>
                  <h2 className="text-2xl font-bold mt-1">{formatCurrency(stats.totalExpenses)}</h2>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-[#121212] border-white/10 p-4">
                <CardTitle className="text-lg mb-4 text-gray-200">Comparativa Mensual</CardTitle>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
                      <XAxis dataKey="name" stroke="#737373" />
                      <YAxis stroke="#737373" tickFormatter={(v) => `$${v/1000}k`} />
                      <Tooltip contentStyle={{ backgroundColor: "#121212", border: "1px solid #262626" }} />
                      <Bar dataKey="ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="bg-[#121212] border-white/10 p-4">
                <CardTitle className="text-lg mb-4 text-gray-200">Gastos por Categoría</CardTitle>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryData} innerRadius={60} outerRadius={80} dataKey="value">
                        {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

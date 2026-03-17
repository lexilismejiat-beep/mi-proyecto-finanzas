"use client"

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

// Librerías
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
  const reportRef = useRef<HTMLDivElement>(null)
  
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

  // --- FUNCIÓN DE EXPORTACIÓN REFORZADA ---
  const exportToPDF = async () => {
    if (!reportRef.current) return
    setIsExporting(true)

    try {
      // Forzamos un pequeño delay para que el estado de las gráficas sea estático
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const element = reportRef.current
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#0a0a0a", // Forzamos el color de fondo oscuro
        logging: false,
        onclone: (clonedDoc) => {
          // Aseguramos que el elemento sea visible en el clon
          const el = clonedDoc.getElementById("pdf-content")
          if (el) el.style.padding = "20px"
        }
      })
      
      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: "a4"
      })

      const imgProps = pdf.getImageProperties(imgData)
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight)
      pdf.save(`Reporte_Financiero_${format(new Date(), "dd-MM-yyyy")}.pdf`)
      
    } catch (error) {
      console.error("Error crítico al generar PDF:", error)
      alert("No se pudo generar el PDF. Revisa si hay bloqueadores de pop-ups.")
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

          {/* CONTENEDOR CON ID PARA EL CLONADO */}
          <div ref={reportRef} id="pdf-content" className="space-y-6 bg-[#0a0a0a]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-[#121212] border-white/10">
                <CardContent className="pt-6">
                  <p className="text-gray-400 text-sm">Balance General</p>
                  <h2 className={cn("text-2xl font-bold mt-1", stats.balance >= 0 ? "text-emerald-400" : "text-rose-400")}>{formatCurrency(stats.balance)}</h2>
                </CardContent>
              </Card>
              <Card className="bg-[#121212] border-white/10">
                <CardContent className="pt-6">
                  <p className="text-gray-400 text-sm flex items-center gap-2"><TrendingUp size={16} className="text-emerald-500" /> Ingresos</p>
                  <h2 className="text-2xl font-bold mt-1">{formatCurrency(stats.totalIncome)}</h2>
                </CardContent>
              </Card>
              <Card className="bg-[#121212] border-white/10">
                <CardContent className="pt-6">
                  <p className="text-gray-400 text-sm flex items-center gap-2"><TrendingDown size={16} className="text-rose-500" /> Gastos</p>
                  <h2 className="text-2xl font-bold mt-1">{formatCurrency(stats.totalExpenses)}</h2>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-[#121212] border-white/10 p-4">
                <CardTitle className="text-lg mb-4">Comparativa Mensual</CardTitle>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
                      <XAxis dataKey="name" stroke="#737373" />
                      <YAxis stroke="#737373" />
                      <Tooltip contentStyle={{ backgroundColor: "#121212", border: "1px solid #262626" }} />
                      {/* Desactivamos animación durante exportación */}
                      <Bar dataKey="ingresos" fill="#10b981" isAnimationActive={false} />
                      <Bar dataKey="gastos" fill="#ef4444" isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="bg-[#121212] border-white/10 p-4">
                <CardTitle className="text-lg mb-4">Gastos por Categoría</CardTitle>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryData} innerRadius={60} outerRadius={80} dataKey="value" isAnimationActive={false}>
                        {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
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

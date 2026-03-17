"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/top-bar"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Loader2, TrendingUp, TrendingDown, Calendar as CalendarIcon, FileText } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useThemeSettings } from "@/lib/theme-context"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts"

// Librerías de Exportación (Asegúrate de tener dom-to-image-more y jspdf instalados)
import jsPDF from "jspdf"
import domtoimage from "dom-to-image-more"

// Filtro de fecha
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { es } from "date-fns/locale"

export default function ReportesPage() {
  const supabase = createClient()
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
      // Configuraciones para dom-to-image (evita el error de "bloqueadores de pop-ups")
      const scale = 2
      const options = {
        height: reportRef.current.scrollHeight * scale,
        width: reportRef.current.offsetWidth * scale,
        style: {
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          width: `${reportRef.current.offsetWidth}px`,
          height: `${reportRef.current.scrollHeight}px`,
          backgroundColor: "#0a0a0a"
        }
      }

      const dataUrl = await domtoimage.toPng(reportRef.current, options)
      
      const pdf = new jsPDF("p", "mm", "a4")
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const contentHeight = (reportRef.current.scrollHeight * pdfWidth) / reportRef.current.offsetWidth
      
      pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, contentHeight)
      pdf.save(`Reporte_Contable_${format(new Date(), "dd-MM-yyyy")}.pdf`)
    } catch (error) {
      console.error("Error al exportar:", error)
      alert("Error al generar el PDF. Verifica que la página cargó correctamente.")
    } finally {
      setIsExporting(false)
    }
  }

  // Fetch de datos de Supabase
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
            .order("created_at", { ascending: false })
          
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

  // Lógica de cálculo para las gráficas
  const { categoryData, monthlyData, stats } = useMemo(() => {
    const cats: Record<string, number> = {}
    const months: Record<string, any> = {}
    let totalIncome = 0
    let totalExpenses = 0

    transactions.forEach((t) => {
      const monto = Number(t.monto) || 0
      const tipo = t.tipo?.trim()
      const cat = t.categoria || "Otros"
      const monthLabel = format(new Date(t.created_at), "MMM", { locale: es }).toUpperCase()

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

  const formatCurrency = (v: number) => 
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(v)

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Sidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} mobileOpen={mobileSidebarOpen} onMobileOpenChange={setMobileSidebarOpen} />

      <div className={cn("transition-all duration-300", "lg:ml-64", sidebarCollapsed && "lg:ml-16")}>
        <TopBar userName={profile?.full_name || "lexilis mejia"} onMenuClick={() => setMobileSidebarOpen(true)} />

        <main className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h1 className="text-3xl font-bold tracking-tight">Reporte Contable</h1>
            
            <div className="flex items-center gap-2 bg-[#121212] p-2 rounded-xl border border-white/10">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" className="text-gray-300 font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4 text-emerald-500" />
                    {format(dateRange.from, "dd LLL", { locale: es })} - {format(dateRange.to, "dd LLL", { locale: es })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-[#121212] border-white/10" align="end">
                  <Calendar mode="range" selected={{ from: dateRange.from, to: dateRange.to }} onSelect={(r: any) => r?.from && r?.to && setDateRange({ from: r.from, to: r.to })} locale={es} />
                </PopoverContent>
              </Popover>

              <Button onClick={exportToPDF} disabled={isExporting} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText size={18} />}
                {isExporting ? "Generando..." : "Exportar PDF"}
              </Button>
            </div>
          </div>

          {/* CONTENEDOR DE CAPTURA PDF */}
          <div ref={reportRef} className="space-y-8 p-6 bg-[#0a0a0a] rounded-xl border border-white/5">
            <div className="border-b border-white/10 pb-6">
              <h2 className="text-2xl font-bold text-emerald-400">Mis Finanzas - Estado de Cuenta</h2>
              <p className="text-sm text-gray-400 italic">Generado el: {format(new Date(), "dd/MM/yyyy HH:mm")}</p>
            </div>

            {/* Resumen de Totales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-[#121212] border-white/10">
                <CardContent className="pt-6">
                  <p className="text-gray-500 text-xs uppercase font-semibold">Balance General</p>
                  <h2 className={cn("text-2xl font-bold mt-1", stats.balance >= 0 ? "text-emerald-400" : "text-rose-400")}>{formatCurrency(stats.balance)}</h2>
                </CardContent>
              </Card>
              <Card className="bg-[#121212] border-white/10">
                <CardContent className="pt-6">
                  <p className="text-gray-500 text-xs uppercase font-semibold">Ingresos Totales</p>
                  <h2 className="text-2xl font-bold mt-1 text-emerald-500">{formatCurrency(stats.totalIncome)}</h2>
                </CardContent>
              </Card>
              <Card className="bg-[#121212] border-white/10">
                <CardContent className="pt-6">
                  <p className="text-gray-500 text-xs uppercase font-semibold">Gastos Totales</p>
                  <h2 className="text-2xl font-bold mt-1 text-rose-500">{formatCurrency(stats.totalExpenses)}</h2>
                </CardContent>
              </Card>
            </div>

            {/* Gráficas con animaciones desactivadas para PDF */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-72">
                <p className="text-sm font-medium mb-4 text-gray-400">Comparativa Mensual</p>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
                    <XAxis dataKey="name" stroke="#737373" />
                    <YAxis stroke="#737373" tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                    <Bar dataKey="ingresos" fill="#10b981" isAnimationActive={false} />
                    <Bar dataKey="gastos" fill="#ef4444" isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="h-72">
                <p className="text-sm font-medium mb-4 text-gray-400">Gastos por Categoría</p>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} innerRadius={50} outerRadius={70} dataKey="value" isAnimationActive={false}>
                      {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* TABLA CONTABLE DETALLADA (Usando 'descripcion' de Supabase) */}
            <div className="space-y-4 pt-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp size={20} className="text-emerald-500" />
                Listado Detallado de Movimientos
              </h3>
              <div className="overflow-hidden rounded-lg border border-white/10">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#18181b] text-gray-400 border-b border-white/10">
                    <tr>
                      <th className="p-3 font-medium">Fecha</th>
                      <th className="p-3 font-medium">Descripción</th>
                      <th className="p-3 font-medium">Categoría</th>
                      <th className="p-3 font-medium text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {transactions.map((t) => (
                      <tr key={t.id} className="bg-[#121212]">
                        <td className="p-3 text-gray-400">{format(new Date(t.created_at), "dd/MM/yyyy")}</td>
                        <td className="p-3 font-medium text-gray-200">
                          {t.descripcion || "Sin descripción"} {/* Campo mapeado de Supabase */}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-gray-400 border border-white/10 uppercase">
                            {t.categoria}
                          </span>
                        </td>
                        <td className={cn(
                          "p-3 text-right font-bold",
                          t.tipo === "Ingreso" ? "text-emerald-400" : "text-rose-400"
                        )}>
                          {t.tipo === "Ingreso" ? "+" : "-"}{formatCurrency(t.monto)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

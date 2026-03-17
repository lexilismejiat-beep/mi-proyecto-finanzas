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

// Librerías de Exportación
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

  // --- EXPORTACIÓN MEJORADA ---
  const exportToPDF = async () => {
    if (!reportRef.current) return
    setIsExporting(true)

    try {
      const scale = 2
      const options = {
        height: reportRef.current.scrollHeight * scale, // Usamos scrollHeight para capturar todo el largo
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
      alert("Error al procesar el reporte contable.")
    } finally {
      setIsExporting(false)
    }
  }

  // Fetch de datos (igual al anterior)
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
            .order("created_at", { ascending: false }) // Ordenar por fecha
          
          if (transData) setTransactions(transData)
        }
      } catch (err) { console.error(err) } finally { setLoading(false) }
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
      const monthLabel = format(new Date(t.created_at), "MMM").toUpperCase()

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
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Reporte Contable</h1>
              <p className="text-gray-400">Resumen ejecutivo y listado de transacciones</p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button onClick={exportToPDF} disabled={isExporting} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText size={18} />}
                {isExporting ? "Procesando..." : "Descargar Reporte PDF"}
              </Button>
            </div>
          </div>

          {/* CONTENEDOR DE CAPTURA */}
          <div ref={reportRef} className="space-y-8 p-6 bg-[#0a0a0a] rounded-xl border border-white/5">
            {/* 1. Header del Reporte en el PDF */}
            <div className="border-b border-white/10 pb-6">
              <h2 className="text-2xl font-bold text-emerald-400">Mis Finanzas - Estado de Cuenta</h2>
              <p className="text-sm text-gray-400">Periodo: {format(dateRange.from, "dd/MM/yyyy")} al {format(dateRange.to, "dd/MM/yyyy")}</p>
              <p className="text-sm text-gray-400">Generado el: {format(new Date(), "dd/MM/yyyy HH:mm")}</p>
            </div>

            {/* 2. Resumen Numérico (Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#121212] p-4 rounded-lg border border-white/10">
                <p className="text-xs text-gray-500 uppercase">Ingresos Totales</p>
                <p className="text-xl font-bold text-emerald-500">{formatCurrency(stats.totalIncome)}</p>
              </div>
              <div className="bg-[#121212] p-4 rounded-lg border border-white/10">
                <p className="text-xs text-gray-500 uppercase">Gastos Totales</p>
                <p className="text-xl font-bold text-rose-500">{formatCurrency(stats.totalExpenses)}</p>
              </div>
              <div className="bg-[#121212] p-4 rounded-lg border border-white/10">
                <p className="text-xs text-gray-500 uppercase">Balance Neto</p>
                <p className="text-xl font-bold">{formatCurrency(stats.balance)}</p>
              </div>
            </div>

            {/* 3. Gráficas (Lado a lado) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-64">
                <p className="text-sm font-medium mb-4 text-gray-400 text-center">Flujo Mensual</p>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <XAxis dataKey="name" stroke="#525252" fontSize={12} />
                    <Bar dataKey="ingresos" fill="#10b981" isAnimationActive={false} />
                    <Bar dataKey="gastos" fill="#ef4444" isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="h-64">
                <p className="text-sm font-medium mb-4 text-gray-400 text-center">Gastos por Categoría</p>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} innerRadius={40} outerRadius={60} dataKey="value" isAnimationActive={false}>
                      {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 4. TABLA CONTABLE DETALLADA */}
            <div className="space-y-4 pt-6">
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
                        <td className="p-3 font-medium">{t.nombre}</td>
                        <td className="p-3">
                          <span className="px-2 py-1 rounded-full bg-white/5 text-xs text-gray-300">
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
                {transactions.length === 0 && (
                  <div className="p-8 text-center text-gray-500">No hay movimientos en este periodo.</div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/top-bar"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Calendar as CalendarIcon, FileText, TrendingUp } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts"

import jsPDF from "jspdf"
import domtoimage from "dom-to-image-more"

import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns"
import { es } from "date-fns/locale"

const MONTHS = [
  { value: 0, label: "Enero" }, { value: 1, label: "Febrero" },
  { value: 2, label: "Marzo" }, { value: 3, label: "Abril" },
  { value: 4, label: "Mayo" }, { value: 5, label: "Junio" },
  { value: 6, label: "Julio" }, { value: 7, label: "Agosto" },
  { value: 8, label: "Septiembre" }, { value: 9, label: "Octubre" },
  { value: 10, label: "Noviembre" }, { value: 11, label: "Diciembre" }
]

export default function ReportesPage() {
  const supabase = createClient()
  const reportRef = useRef<HTMLDivElement>(null)
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [profile, setProfile] = useState<any>(null)

  // --- NUEVO FILTRO UNIFICADO ---
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"]

  const exportToPDF = async () => {
    if (!reportRef.current) return
    setIsExporting(true)

    try {
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
      pdf.save(`Reporte_${MONTHS[selectedMonth].label}_${selectedYear}.pdf`)
    } catch (error) {
      console.error("Error al exportar:", error)
    } finally {
      setIsExporting(false)
    }
  }

  // --- FETCH DE DATOS ---
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profileData } = await supabase.from("user_profiles").select("*").eq("id", user.id).single()
        const { data: mainProfile } = await supabase.from("profiles").select("avatar_url").eq("id", user.id).single()
        
        if (profileData) {
          setProfile({
            ...profileData,
            avatar_url: mainProfile?.avatar_url || profileData.avatar_url
          })
        }

        // Definir rango basado en el mes/año seleccionado
        const dateFrom = startOfMonth(new Date(selectedYear, selectedMonth))
        const dateTo = endOfMonth(new Date(selectedYear, selectedMonth))

        let query = supabase
          .from("transacciones")
          .select("*")
          .gte("created_at", startOfDay(dateFrom).toISOString())
          .lte("created_at", endOfDay(dateTo).toISOString())
          .order("created_at", { ascending: false })

        if (profileData?.cedula) {
            query = query.eq("user_id", profileData.cedula) 
        } else {
            query = query.eq("user_id", user.id)
        }

        const { data: transData, error } = await query
        if (error) throw error
        setTransactions(transData || [])

      } catch (err) {
        console.error("Error cargando datos:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [supabase, selectedMonth, selectedYear, profile?.cedula])

  const { categoryData, monthlyData, stats } = useMemo(() => {
    const cats: Record<string, number> = {}
    const months: Record<string, any> = {}
    let totalIncome = 0
    let totalExpenses = 0

    transactions.forEach((t) => {
      const monto = Math.abs(Number(t.monto)) || 0
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
        <TopBar 
          userName={profile ? `${profile.nombres} ${profile.apellidos}` : "Usuario"} 
          avatarUrl={profile?.avatar_url} 
          onMenuClick={() => setMobileSidebarOpen(true)} 
        />

        <main className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h1 className="text-3xl font-bold tracking-tight">Reporte Contable</h1>
            
            <div className="flex items-center gap-2">
              {/* SELECTOR UNIFICADO DE MES Y AÑO */}
              <div className="flex items-center gap-2 bg-[#121212] p-2 rounded-xl border border-white/10">
                <CalendarIcon className="h-4 w-4 text-emerald-500 ml-1" />
                <select 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="bg-transparent text-sm font-medium text-white outline-none cursor-pointer"
                >
                  {MONTHS.map(m => <option key={m.value} value={m.value} className="bg-zinc-900">{m.label}</option>)}
                </select>
                <select 
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-transparent text-sm font-medium text-white outline-none cursor-pointer border-l border-white/10 pl-2"
                >
                  {[2024, 2025, 2026].map(y => <option key={y} value={y} className="bg-zinc-900">{y}</option>)}
                </select>
              </div>

              <Button onClick={exportToPDF} disabled={isExporting || loading} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText size={18} />}
                {isExporting ? "Generando..." : "Exportar PDF"}
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-emerald-500" />
                <p className="text-gray-400">Cargando registros...</p>
            </div>
          ) : (
            <div ref={reportRef} className="space-y-8 p-6 bg-[#0a0a0a] rounded-xl border border-white/5">
                {/* Cabecera del reporte */}
                <div className="border-b border-white/10 pb-6 flex justify-between items-end">
                  <div>
                    <h2 className="text-2xl font-bold text-emerald-400">Mis Finanzas - Estado de Cuenta</h2>
                    <p className="text-sm text-gray-400">Periodo: {MONTHS[selectedMonth].label} {selectedYear}</p>
                  </div>
                  <p className="text-[10px] text-gray-500 italic uppercase tracking-widest">Generado el: {format(new Date(), "dd/MM/yyyy HH:mm")}</p>
                </div>

                {/* Resumen de Totales */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-[#121212] border-white/10 text-white">
                    <div className="p-6">
                      <p className="text-gray-500 text-xs uppercase font-semibold">Balance del Periodo</p>
                      <h2 className={cn("text-2xl font-bold mt-1", stats.balance >= 0 ? "text-emerald-400" : "text-rose-400")}>{formatCurrency(stats.balance)}</h2>
                    </div>
                  </Card>
                  <Card className="bg-[#121212] border-white/10 text-white">
                    <div className="p-6">
                      <p className="text-gray-500 text-xs uppercase font-semibold">Ingresos Totales</p>
                      <h2 className="text-2xl font-bold mt-1 text-emerald-500">{formatCurrency(stats.totalIncome)}</h2>
                    </div>
                  </Card>
                  <Card className="bg-[#121212] border-white/10 text-white">
                    <div className="p-6">
                      <p className="text-gray-500 text-xs uppercase font-semibold">Gastos Totales</p>
                      <h2 className="text-2xl font-bold mt-1 text-rose-500">{formatCurrency(stats.totalExpenses)}</h2>
                    </div>
                  </Card>
                </div>

                {/* Gráficas */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="h-72 bg-[#121212] p-4 rounded-xl border border-white/5">
                    <p className="text-sm font-medium mb-4 text-gray-400 text-center uppercase tracking-tighter">Comparativa Ingresos vs Gastos</p>
                    <ResponsiveContainer width="100%" height="90%">
                      <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
                        <XAxis dataKey="name" stroke="#737373" />
                        <YAxis stroke="#737373" tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                        <Tooltip contentStyle={{ backgroundColor: '#121212', borderColor: '#262626' }} />
                        <Bar dataKey="ingresos" fill="#10b981" isAnimationActive={false} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="gastos" fill="#ef4444" isAnimationActive={false} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="h-72 bg-[#121212] p-4 rounded-xl border border-white/5">
                    <p className="text-sm font-medium mb-4 text-gray-400 text-center uppercase tracking-tighter">Distribución de Gastos</p>
                    <ResponsiveContainer width="100%" height="90%">
                      <PieChart>
                        <Pie data={categoryData} innerRadius={50} outerRadius={70} dataKey="value" isAnimationActive={false}>
                          {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Legend />
                        <Tooltip contentStyle={{ backgroundColor: '#121212', borderColor: '#262626' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Tabla */}
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
                        {transactions.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-gray-500">No se encontraron movimientos en este periodo.</td>
                            </tr>
                        ) : (
                            transactions.map((t) => (
                              <tr key={t.id} className="bg-[#121212] hover:bg-white/5 transition-colors">
                                <td className="p-3 text-gray-400 font-mono">{format(new Date(t.created_at), "dd/MM/yyyy")}</td>
                                <td className="p-3 font-medium text-gray-200">{t.descripcion || "Sin descripción"}</td>
                                <td className="p-3">
                                  <span className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-gray-300 border border-white/10 uppercase font-semibold">
                                    {t.categoria}
                                  </span>
                                </td>
                                <td className={cn("p-3 text-right font-bold", t.tipo === "Ingreso" ? "text-emerald-400" : "text-rose-400")}>
                                  {t.tipo === "Ingreso" ? "+" : "-"}{formatCurrency(t.monto)}
                                </td>
                              </tr>
                            ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/top-bar"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
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

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"]

export default function ReportesPage() {
  const supabase = createClient()
  const reportRef = useRef<HTMLDivElement>(null)
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [profile, setProfile] = useState<any>(null)

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  const exportToPDF = async () => {
    if (!reportRef.current) return
    setIsExporting(true)
    try {
      const scale = 2
      const dataUrl = await domtoimage.toPng(reportRef.current, {
        height: reportRef.current.scrollHeight * scale,
        width: reportRef.current.offsetWidth * scale,
        style: {
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          width: `${reportRef.current.offsetWidth}px`,
          height: `${reportRef.current.scrollHeight}px`,
          backgroundColor: "#0a0a0a"
        }
      })
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

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profileData } = await supabase.from("user_profiles").select("*").eq("id", user.id).single()
        
        const dateFrom = startOfMonth(new Date(selectedYear, selectedMonth))
        const dateTo = endOfMonth(new Date(selectedYear, selectedMonth))

        const { data: transData, error } = await supabase
          .from("transacciones")
          .select("*")
          .eq("user_id", profileData?.cedula || user.id)
          .gte("created_at", startOfDay(dateFrom).toISOString())
          .lte("created_at", endOfDay(dateTo).toISOString())
          .order("created_at", { ascending: false })

        if (error) throw error
        setTransactions(transData || [])
        setProfile(profileData)
      } catch (err) {
        console.error("Error:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [supabase, selectedMonth, selectedYear])

  const { categoryData, monthlyData, stats } = useMemo(() => {
    const cats: Record<string, number> = {}
    const months: Record<string, any> = {}
    let totalIncome = 0
    let totalExpenses = 0

    transactions.forEach((t) => {
      const monto = Math.abs(Number(t.monto)) || 0
      const tipo = t.tipo?.trim()
      const monthLabel = format(new Date(t.created_at), "MMM", { locale: es }).toUpperCase()

      if (!months[monthLabel]) months[monthLabel] = { name: monthLabel, ingresos: 0, gastos: 0 }

      if (tipo === "Ingreso") {
        totalIncome += monto
        months[monthLabel].ingresos += monto
      } else {
        totalExpenses += monto
        months[monthLabel].gastos += monto
        cats[t.categoria || "Otros"] = (cats[t.categoria || "Otros"] || 0) + monto
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
        <TopBar userName={profile ? `${profile.nombres}` : "Usuario"} onMenuClick={() => setMobileSidebarOpen(true)} />

        <main className="p-4 md:p-6 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h1 className="text-2xl font-bold">Reporte Contable</h1>
            
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* SELECTORES CON FIX DE COLOR */}
              <div className="flex items-center gap-2 bg-[#121212] p-2 rounded-xl border border-white/10 flex-1 md:flex-none justify-center">
                <CalendarIcon className="h-4 w-4 text-emerald-500" />
                <select 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(Number(e.target.value))} 
                  className="bg-transparent text-sm font-medium text-white outline-none cursor-pointer appearance-none px-1"
                >
                  {MONTHS.map(m => (
                    <option key={m.value} value={m.value} className="bg-zinc-900 text-white">{m.label}</option>
                  ))}
                </select>
                <select 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(Number(e.target.value))} 
                  className="bg-transparent text-sm font-medium text-white outline-none border-l border-white/10 pl-2 cursor-pointer appearance-none"
                >
                  {[2024, 2025, 2026].map(y => (
                    <option key={y} value={y} className="bg-zinc-900 text-white">{y}</option>
                  ))}
                </select>
              </div>

              <Button onClick={exportToPDF} disabled={isExporting || loading} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 flex-1 md:flex-none">
                {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText size={18} />}
                {isExporting ? "Generando..." : "PDF"}
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-emerald-500" />
            </div>
          ) : (
            <div ref={reportRef} className="space-y-8">
                {/* Cards de Resumen */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-[#121212] border-white/10 p-6">
                    <p className="text-gray-500 text-xs uppercase font-semibold">Balance</p>
                    <h2 className={cn("text-2xl font-bold mt-1", stats.balance >= 0 ? "text-emerald-400" : "text-rose-400")}>{formatCurrency(stats.balance)}</h2>
                  </Card>
                  <Card className="bg-[#121212] border-white/10 p-6">
                    <p className="text-gray-500 text-xs uppercase font-semibold">Ingresos</p>
                    <h2 className="text-2xl font-bold mt-1 text-emerald-500">{formatCurrency(stats.totalIncome)}</h2>
                  </Card>
                  <Card className="bg-[#121212] border-white/10 p-6">
                    <p className="text-gray-500 text-xs uppercase font-semibold">Gastos</p>
                    <h2 className="text-2xl font-bold mt-1 text-rose-500">{formatCurrency(stats.totalExpenses)}</h2>
                  </Card>
                </div>

                {/* Gráficas */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="h-80 bg-[#121212] p-4 rounded-xl border border-white/5">
                    <p className="text-xs font-medium mb-4 text-gray-400 text-center uppercase tracking-widest">Ingresos vs Gastos</p>
                    <ResponsiveContainer width="100%" height="90%">
                      <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
                        <XAxis dataKey="name" stroke="#737373" fontSize={10} />
                        <YAxis stroke="#737373" fontSize={10} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                        <Tooltip contentStyle={{ backgroundColor: '#121212', border: '1px solid #262626', color: '#fff' }} itemStyle={{color: '#fff'}} />
                        <Bar dataKey="ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="h-[500px] md:h-80 bg-[#121212] p-4 rounded-xl border border-white/5">
                    <p className="text-xs font-medium mb-4 text-gray-400 text-center uppercase tracking-widest">Distribución de Gastos</p>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={categoryData} innerRadius="45%" outerRadius="60%" dataKey="value" paddingAngle={5}>
                          {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#121212', border: '1px solid #262626', color: '#fff' }} itemStyle={{color: '#fff'}} />
                        <Legend verticalAlign="bottom" height={160} iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '20px', color: '#a1a1aa' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Tabla de Movimientos */}
                <div className="space-y-4 pt-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2 px-2 text-emerald-500">
                    <TrendingUp size={20} /> Movimientos Detallados
                  </h3>
                  <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#121212]">
                    <table className="min-w-[700px] w-full text-left text-sm">
                      <thead className="text-gray-400 border-b border-white/10 uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="p-4 font-medium">Fecha</th>
                          <th className="p-4 font-medium">Descripción</th>
                          <th className="p-4 font-medium">Categoría</th>
                          <th className="p-4 font-medium text-right">Monto</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {transactions.map((t) => (
                          <tr key={t.id} className="hover:bg-white/5 transition-colors">
                            <td className="p-4 text-gray-400 font-mono text-xs">{format(new Date(t.created_at), "dd/MM/yy")}</td>
                            <td className="p-4 font-medium text-gray-200">{t.descripcion || "Sin descripción"}</td>
                            <td className="p-4">
                              <span className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-gray-400 border border-white/10 uppercase">
                                {t.categoria}
                              </span>
                            </td>
                            <td className={cn("p-4 text-right font-bold", t.tipo === "Ingreso" ? "text-emerald-400" : "text-rose-400")}>
                              {t.tipo === "Ingreso" ? "+" : "-"}{formatCurrency(t.monto)}
                            </td>
                          </tr>
                        ))}
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

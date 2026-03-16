"use client"

import { useState, useEffect, useMemo } from "react"
// Cambiamos a la versión más reciente recomendada por Supabase
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/top-bar"
import { cn } from "@/lib/utils"
// Asegúrate de haber ejecutado: npx shadcn-ui@latest add card progress button calendar popover
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarIcon, Utensils, Briefcase, ShoppingCart, Check, Tag, ArrowRight, X, Trash2, Edit } from "lucide-react"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { es } from "date-fns/locale"

const ICON_MAP: Record<string, any> = {
  "Cena": Utensils,
  "Nómina": Briefcase,
  "Alimentación": ShoppingCart,
}

export default function CategoriasPage() {
  const supabase = createClientComponentClient()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  
  const [allTransactions, setAllTransactions] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [tempRange, setTempRange] = useState<any>({ 
    from: startOfMonth(new Date()), 
    to: endOfMonth(new Date()) 
  })
  const [confirmedRange, setConfirmedRange] = useState(tempRange)

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('transacciones')
        .select('*')
        .gte('created_at', confirmedRange.from.toISOString())
        .lte('created_at', confirmedRange.to.toISOString())

      if (error) throw error
      setAllTransactions(data || [])
    } catch (err) {
      console.error("Error cargando transacciones:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [confirmedRange])

  const stats = useMemo(() => {
    const agrupado: Record<string, any> = {}
    allTransactions.forEach(t => {
      const cat = t.categoria || "Otros"
      if (!agrupado[cat]) agrupado[cat] = { nombre: cat, total: 0, count: 0 }
      agrupado[cat].total += Math.abs(t.monto)
      agrupado[cat].count += 1
    })
    return Object.values(agrupado).sort((a: any, b: any) => b.total - a.total)
  }, [allTransactions])

  const detailedTransactions = useMemo(() => {
    if (!selectedCategory) return []
    return allTransactions.filter(t => (t.categoria || "Otros") === selectedCategory)
  }, [selectedCategory, allTransactions])

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(val)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} mobileOpen={mobileSidebarOpen} onMobileOpenChange={setMobileSidebarOpen} />

      <div className={cn("transition-all duration-300", "lg:ml-64", sidebarCollapsed && "lg:ml-16")}>
        <TopBar userName="Lexilis Mejia" onMenuClick={() => setMobileSidebarOpen(true)} />

        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold">Análisis por Categoría</h1>
              <p className="text-muted-foreground text-sm">Gestiona tus movimientos detallados</p>
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[300px] justify-start bg-secondary/20 border-white/10">
                  <CalendarIcon className="mr-2 h-4 w-4 text-emerald-500" />
                  {format(confirmedRange.from, "dd LLL", { locale: es })} - {format(confirmedRange.to, "dd LLL, yyyy", { locale: es })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-4 flex flex-col gap-4" align="end">
                <Calendar mode="range" selected={tempRange} onSelect={setTempRange} locale={es} />
                <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => { setConfirmedRange(tempRange); setSelectedCategory(null); }}>
                  <Check className="mr-2 h-4 w-4" /> Confirmar Fechas
                </Button>
              </PopoverContent>
            </Popover>
          </div>

          {/* Grid de Tarjetas */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-10">
            {stats.map((cat) => {
              const Icon = ICON_MAP[cat.nombre] || Tag
              const isSelected = selectedCategory === cat.nombre

              return (
                <Card 
                  key={cat.nombre} 
                  className={cn(
                    "cursor-pointer transition-all border-white/5 bg-card/40 hover:bg-card/60",
                    isSelected && "ring-2 ring-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                  )}
                  onClick={() => setSelectedCategory(isSelected ? null : cat.nombre)}
                >
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
                        <Icon className="h-6 w-6" />
                      </div>
                      <ArrowRight className={cn("h-4 w-4 text-muted-foreground transition-transform", isSelected && "rotate-90 text-emerald-500")} />
                    </div>
                    <h3 className="font-bold text-lg mb-1">{cat.nombre}</h3>
                    <p className="text-2xl font-bold text-white">{formatCurrency(cat.total)}</p>
                    <p className="text-xs text-muted-foreground mt-2">{cat.count} movimientos en este periodo</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Tabla de Detalle con Acciones */}
          {selectedCategory && (
            <Card className="border-emerald-500/20 bg-card/60 animate-in fade-in slide-in-from-bottom-4 shadow-2xl">
              <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-4">
                <CardTitle className="text-emerald-500 flex items-center gap-2 text-xl">
                  Detalle de {selectedCategory}
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setSelectedCategory(null)} className="hover:bg-white/10">
                  <X className="h-5 w-5" />
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted-foreground border-b border-white/5 bg-white/5">
                        <th className="p-4 font-semibold uppercase tracking-wider">Fecha</th>
                        <th className="p-4 font-semibold uppercase tracking-wider">Descripción</th>
                        <th className="p-4 font-semibold uppercase tracking-wider text-right">Monto</th>
                        <th className="p-4 font-semibold uppercase tracking-wider text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailedTransactions.map((t) => (
                        <tr key={t.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                          <td className="p-4 text-muted-foreground">{format(new Date(t.created_at), "dd/MM/yyyy")}</td>
                          <td className="p-4 font-medium">{t.descripcion || "Sin descripción"}</td>
                          <td className={cn("p-4 text-right font-mono font-bold text-lg", t.monto > 0 ? "text-emerald-400" : "text-red-400")}>
                            {formatCurrency(t.monto)}
                          </td>
                          <td className="p-4">
                            <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-400/10">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  )
}

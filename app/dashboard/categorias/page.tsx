"use client"

import { useState, useEffect, useMemo } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/top-bar"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Calendar as CalendarIcon, Utensils, Briefcase, ShoppingCart, Check, Tag, ArrowRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { es } from "date-fns/locale"

const ICON_MAP: Record<string, any> = {
  "Cena": Utensils,
  "Nómina": Briefcase,
  "Alimentación": ShoppingCart,
}

export default function CategoriasConDetallePage() {
  const supabase = createClientComponentClient()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  
  // Estados de datos
  const [allTransactions, setAllTransactions] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Rango de fechas
  const [tempRange, setTempRange] = useState<any>({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) })
  const [confirmedRange, setConfirmedRange] = useState(tempRange)

  const fetchData = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('transacciones')
      .select('*')
      .gte('created_at', confirmedRange.from.toISOString())
      .lte('created_at', confirmedRange.to.toISOString())

    if (data) setAllTransactions(data)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [confirmedRange])

  // Lógica: Agrupar por categoría
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

  // Filtrar transacciones de la categoría seleccionada
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
              <h1 className="text-2xl font-bold">Gastos por Categoría</h1>
              <p className="text-muted-foreground text-sm">Haz clic en una tarjeta para ver el detalle</p>
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[300px] justify-start bg-secondary/20">
                  <CalendarIcon className="mr-2 h-4 w-4 text-emerald-500" />
                  {format(confirmedRange.from, "dd LLL", { locale: es })} - {format(confirmedRange.to, "dd LLL, yyyy", { locale: es })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-4 flex flex-col gap-4" align="end">
                <Calendar mode="range" selected={tempRange} onSelect={setTempRange} locale={es} />
                <Button className="bg-emerald-600" onClick={() => { setConfirmedRange(tempRange); setSelectedCategory(null); }}>
                  <Check className="mr-2 h-4 w-4" /> Confirmar
                </Button>
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-10">
            {stats.map((cat) => {
              const Icon = ICON_MAP[cat.nombre] || Tag
              const isSelected = selectedCategory === cat.nombre

              return (
                <Card 
                  key={cat.nombre} 
                  className={cn(
                    "cursor-pointer transition-all border-white/5 bg-card/40 hover:scale-[1.02]",
                    isSelected && "ring-2 ring-emerald-500 bg-emerald-500/5"
                  )}
                  onClick={() => setSelectedCategory(isSelected ? null : cat.nombre)}
                >
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
                        <Icon className="h-6 w-6" />
                      </div>
                      <ArrowRight className={cn("h-4 w-4 text-muted-foreground transition-transform", isSelected && "rotate-90")} />
                    </div>
                    <h3 className="font-bold text-lg mb-1">{cat.nombre}</h3>
                    <p className="text-2xl font-bold text-white">{formatCurrency(cat.total)}</p>
                    <p className="text-xs text-muted-foreground mt-2">{cat.count} movimientos</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* SECCIÓN DE DETALLE DINÁMICO */}
          {selectedCategory && (
            <Card className="border-emerald-500/20 bg-card/60 animate-in fade-in slide-in-from-bottom-4">
              <CardHeader className="flex flex-row items-center justify-between border-b border-white/5">
                <CardTitle className="text-emerald-500 flex items-center gap-2">
                  Movimientos de: {selectedCategory}
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setSelectedCategory(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted-foreground border-b border-white/5">
                        <th className="p-4 font-medium">Fecha</th>
                        <th className="p-4 font-medium">Descripción</th>
                        <th className="p-4 font-medium text-right">Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailedTransactions.map((t) => (
                        <tr key={t.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="p-4">{format(new Date(t.created_at), "dd/MM/yyyy")}</td>
                          <td className="p-4">{t.descripcion || "Sin descripción"}</td>
                          <td className={cn("p-4 text-right font-mono font-bold", t.monto > 0 ? "text-emerald-400" : "text-red-400")}>
                            {formatCurrency(t.monto)}
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

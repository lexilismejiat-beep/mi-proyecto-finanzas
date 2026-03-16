"use client"

import { useState, useEffect, useMemo } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/top-bar"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Calendar as CalendarIcon, Utensils, Briefcase, ShoppingCart, Check, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { es } from "date-fns/locale"

// Mapeo de iconos basado en tus categorías reales de Supabase
const ICON_MAP: Record<string, any> = {
  "Cena": Utensils,
  "Nómina": Briefcase,
  "Alimentación": ShoppingCart,
}

export default function CategoriasFinalPage() {
  const supabase = createClientComponentClient()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  
  const [tempRange, setTempRange] = useState<any>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  })

  const [confirmedRange, setConfirmedRange] = useState(tempRange)
  const [stats, setStats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    
    // Obtenemos todas las transacciones del rango seleccionado
    const { data, error } = await supabase
      .from('transacciones')
      .select('*')
      .gte('created_at', confirmedRange.from.toISOString())
      .lte('created_at', confirmedRange.to.toISOString())

    if (data) {
      const agrupado: Record<string, any> = {}
      
      data.forEach(t => {
        // Usamos el nombre de la categoría que viene de Supabase o "Sin Categoría"
        const catNombre = t.categoria || "Sin Categoría"
        
        if (!agrupado[catNombre]) {
          agrupado[catNombre] = { 
            nombre: catNombre, 
            total: 0, 
            // Si no hay presupuesto definido, ponemos uno por defecto de 500k para la barra de progreso
            presupuesto: catNombre === "Cena" ? 300000 : 500000 
          }
        }
        
        // Sumamos el monto (Math.abs para que los gastos negativos se vean como positivos en la gráfica)
        agrupado[catNombre].total += Math.abs(t.monto)
      })
      
      // Ordenamos de mayor a menor gasto
      const resultadoInvertido = Object.values(agrupado).sort((a: any, b: any) => b.total - a.total)
      setStats(resultadoInvertido)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [confirmedRange])

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
              <h1 className="text-2xl font-bold tracking-tight">Gastos por Categoría</h1>
              <p className="text-muted-foreground text-sm">Resumen automático basado en tus transacciones</p>
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[300px] justify-start text-left font-normal border-white/10 bg-secondary/20 hover:bg-secondary/30 transition-colors">
                  <CalendarIcon className="mr-2 h-4 w-4 text-emerald-500" />
                  {format(confirmedRange.from, "dd LLL", { locale: es })} - {format(confirmedRange.to, "dd LLL, yyyy", { locale: es })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-4 flex flex-col gap-4" align="end">
                <Calendar
                  mode="range"
                  selected={tempRange}
                  onSelect={setTempRange}
                  locale={es}
                />
                <Button 
                  className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" 
                  onClick={() => setConfirmedRange(tempRange)}
                  disabled={!tempRange?.from || !tempRange?.to}
                >
                  <Check className="h-4 w-4" />
                  Actualizar Vista
                </Button>
              </PopoverContent>
            </Popover>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-muted-foreground animate-pulse">Calculando totales...</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {stats.length > 0 ? (
                stats.map((cat) => {
                  const Icon = ICON_MAP[cat.nombre] || Tag
                  const percent = Math.min((cat.total / cat.presupuesto) * 100, 100)

                  return (
                    <Card key={cat.nombre} className="border-white/5 bg-card/40 backdrop-blur-md hover:bg-card/60 transition-all border shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
                            <Icon className="h-6 w-6" />
                          </div>
                          <h3 className="font-bold text-lg capitalize">{cat.nombre.toLowerCase()}</h3>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <p className="text-3xl font-bold tracking-tight text-white">{formatCurrency(cat.total)}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Presupuesto sugerido: {formatCurrency(cat.presupuesto)}
                            </p>
                          </div>
                          
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                              <span>Consumo</span>
                              <span className={cn(percent >= 90 ? "text-red-400" : "text-emerald-400")}>
                                {percent.toFixed(0)}%
                              </span>
                            </div>
                            <Progress 
                                value={percent} 
                                className="h-2 bg-white/5" 
                                // @ts-ignore - Si usas una variante personalizada
                                indicatorClassName={percent >= 90 ? "bg-red-500" : "bg-emerald-500"}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              ) : (
                <div className="col-span-full text-center py-20 bg-secondary/10 rounded-2xl border border-dashed border-white/10">
                  <p className="text-muted-foreground">No se encontraron transacciones en estas fechas.</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

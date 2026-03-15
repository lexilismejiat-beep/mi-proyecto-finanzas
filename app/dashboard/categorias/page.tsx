"use client"

import { useState, useEffect, useMemo } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/top-bar"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Calendar as CalendarIcon, Utensils, Briefcase, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, isWithinInterval, startOfMonth, endOfMonth } from "date-fns"
import { es } from "date-fns/locale"

// Definimos los iconos manualmente para que coincidan con los nombres de tus categorías en Supabase
const ICON_MAP: Record<string, any> = {
  "Cena": Utensils,
  "Restaurante": Utensils,
  "Nómina": Briefcase,
  "Alimentación": ShoppingCart,
}

const COLOR_MAP: Record<string, string> = {
  "Cena": "bg-red-500/20 text-red-400",
  "Nómina": "bg-emerald-500/20 text-emerald-400",
  "Alimentación": "bg-orange-500/20 text-orange-400",
}

export default function CategoriasRealesPage() {
  const supabase = createClientComponentClient()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  
  // Estados para datos reales
  const [transacciones, setTransacciones] = useState<any[]>([])
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  })

  // 1. Cargar transacciones reales de Supabase
  useEffect(() => {
    const fetchTransacciones = async () => {
      const { data, error } = await supabase
        .from('transacciones')
        .select('*')
      
      if (data) {
        // Convertimos la fecha de texto a objeto Date para poder filtrar
        const formattedData = data.map(t => ({
          ...t,
          date: new Date(t.created_at) 
        }))
        setTransacciones(formattedData)
      }
    }
    fetchTransacciones()
  }, [])

  // 2. Lógica Automática: Agrupar por Categoría y sumar
  const statsPorCategoria = useMemo(() => {
    const resumen: Record<string, any> = {}

    transacciones.forEach(t => {
      // Filtrar por el rango de fechas seleccionado
      if (isWithinInterval(t.date, { start: dateRange.from, end: dateRange.to })) {
        const catNombre = t.categoria || "Sin Categoría"
        
        if (!resumen[catNombre]) {
          resumen[catNombre] = {
            nombre: catNombre,
            total: 0,
            tipo: t.monto > 0 ? 'income' : 'expense',
            presupuesto: catNombre === "Cena" ? 300000 : 0 // Ejemplo de presupuesto manual
          }
        }
        // Sumamos el valor absoluto para mostrar "has gastado X"
        resumen[catNombre].total += Math.abs(t.monto)
      }
    })

    return Object.values(resumen)
  }, [transacciones, dateRange])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency", currency: "COP", minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} mobileOpen={mobileSidebarOpen} onMobileOpenChange={setMobileSidebarOpen} />

      <div className={cn("transition-all duration-300", "lg:ml-64", sidebarCollapsed && "lg:ml-16")}>
        <TopBar userName="Lexilis Mejia" onMenuClick={() => setMobileSidebarOpen(true)} />

        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold">Gastos por Categoría</h1>
              <p className="text-muted-foreground">Datos reales de tus transacciones</p>
            </div>

            {/* Selector de Fechas */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[280px] justify-start text-left font-normal border-white/10 bg-white/5">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(dateRange.from, "dd LLL", { locale: es })} - {format(dateRange.to, "dd LLL, yyyy", { locale: es })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range: any) => range?.from && range?.to && setDateRange(range)}
                  locale={es}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {statsPorCategoria.length > 0 ? (
              statsPorCategoria.map((cat) => {
                const Icon = ICON_MAP[cat.nombre] || ShoppingCart
                const colorClass = COLOR_MAP[cat.nombre] || "bg-slate-500/20 text-slate-400"
                
                return (
                  <Card key={cat.nombre} className="bg-card border-white/5 overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className={cn("p-3 rounded-xl", colorClass)}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{cat.nombre}</h3>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">
                            {cat.tipo === 'income' ? 'Total Ingresado' : 'Total Gastado'}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-3xl font-bold tracking-tight">
                          {formatCurrency(cat.total)}
                        </span>
                        
                        {cat.presupuesto > 0 && (
                          <div className="mt-4 space-y-1">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-muted-foreground">Progreso presupuesto</span>
                              <span>{((cat.total / cat.presupuesto) * 100).toFixed(0)}%</span>
                            </div>
                            <Progress value={(cat.total / cat.presupuesto) * 100} className="h-1.5" />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            ) : (
              <p className="col-span-full text-center py-20 text-muted-foreground">
                No hay transacciones en este rango de fechas.
              </p>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

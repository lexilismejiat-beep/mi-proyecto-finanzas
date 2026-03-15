"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/top-bar"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Calendar as CalendarIcon, Utensils, Briefcase, ShoppingCart, Check } from "lucide-react"
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

export default function CategoriasFinalPage() {
  const supabase = createClientComponentClient()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  
  // 1. Estado para el rango que se está eligiendo en el calendario
  const [tempRange, setTempRange] = useState<any>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  })

  // 2. Estado para el rango "Confirmado" (el que dispara la búsqueda)
  const [confirmedRange, setConfirmedRange] = useState(tempRange)
  const [stats, setStats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // 3. Función para traer datos de Supabase filtrados por fecha
  const fetchData = async () => {
    setLoading(true)
    
    // Filtramos directamente en la base de datos por el rango confirmado
    const { data, error } = await supabase
      .from('transacciones')
      .select('*')
      .gte('created_at', confirmedRange.from.toISOString())
      .lte('created_at', confirmedRange.to.toISOString())

    if (data) {
      const agrupado: Record<string, any> = {}
      
      data.forEach(t => {
        const cat = t.categoria || "Otros"
        if (!agrupado[cat]) {
          agrupado[cat] = { nombre: cat, total: 0, presupuesto: cat === "Cena" ? 300000 : 500000 }
        }
        agrupado[cat].total += Math.abs(t.monto)
      })
      setStats(Object.values(agrupado))
    }
    setLoading(false)
  }

  // Ejecutar búsqueda cuando cambie el rango confirmado
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
              <h1 className="text-2xl font-bold tracking-tight">Análisis de Gastos</h1>
              <p className="text-muted-foreground text-sm">Visualiza tus consumos por categoría</p>
            </div>

            {/* SELECTOR DE FECHAS CON CONFIRMACIÓN */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[300px] justify-start text-left font-normal border-white/10 bg-secondary/50">
                  <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
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
                {/* EL "CHULITO" O BOTÓN DE CONFIRMACIÓN */}
                <Button 
                  className="w-full gap-2" 
                  onClick={() => setConfirmedRange(tempRange)}
                  disabled={!tempRange?.from || !tempRange?.to}
                >
                  <Check className="h-4 w-4" />
                  Confirmar Fechas
                </Button>
              </PopoverContent>
            </Popover>
          </div>

          {loading ? (
            <div className="text-center py-20 text-muted-foreground animate-pulse">Actualizando datos...</div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {stats.map((cat) => {
                const Icon = ICON_MAP[cat.nombre] || ShoppingCart
                const percent = (cat.total / cat.presupuesto) * 100

                return (
                  <Card key={cat.nombre} className="border-white/5 bg-card/50 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 rounded-xl bg-primary/10 text-primary">
                          <Icon className="h-6 w-6" />
                        </div>
                        <h3 className="font-bold text-lg">{cat.nombre}</h3>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <p className="text-3xl font-bold">{formatCurrency(cat.total)}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Presupuesto: {formatCurrency(cat.presupuesto)}
                          </p>
                        </div>
                        
                        <div className="space-y-1.5">
                          <Progress value={percent} className="h-2" />
                          <p className="text-[10px] text-right text-muted-foreground font-medium uppercase tracking-tighter">
                            {percent.toFixed(1)}% utilizado
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

"use client"

import { useState, useMemo } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/top-bar"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Calendar as CalendarIcon, Plus, Filter } from "lucide-react"
import { 
  ShoppingCart, Home, Car, Utensils, Gamepad2, 
  Briefcase, TrendingUp, Wallet, Heart, GraduationCap 
} from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { format, isWithinInterval, startOfMonth, endOfMonth } from "date-fns"
import { es } from "date-fns/locale"

// 1. Datos de ejemplo: Transacciones (Esto vendría de tu BD)
const MOCK_TRANSACTIONS = [
  { id: "t1", categoryId: "4", amount: 50000, date: new Date(2024, 4, 10), type: "expense" }, // Mayo 10
  { id: "t2", categoryId: "4", amount: 30000, date: new Date(2024, 4, 15), type: "expense" }, // Mayo 15
  { id: "t3", categoryId: "7", amount: 120000, date: new Date(2024, 4, 12), type: "expense" }, // Restaurantes
  { id: "t4", categoryId: "1", amount: 2000000, date: new Date(2024, 4, 1), type: "income" },  // Salario
]

const initialCategories = [
  { id: "1", name: "Salario", icon: Briefcase, color: "bg-emerald-500/20 text-emerald-400", type: "income", budget: 0 },
  { id: "4", name: "Alimentación", icon: ShoppingCart, color: "bg-orange-500/20 text-orange-400", type: "expense", budget: 500000 },
  { id: "7", name: "Restaurantes", icon: Utensils, color: "bg-red-500/20 text-red-400", type: "expense", budget: 300000 },
  // ... (puedes añadir las demás aquí)
]

export default function CategoriasDetallePage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  
  // Estado para el filtro de fechas (Por defecto: Mes actual)
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency", currency: "COP", minimumFractionDigits: 0,
    }).format(amount)
  }

  // 2. LÓGICA AUTOMÁTICA: Filtrar y Calcular
  const categoriesWithTotals = useMemo(() => {
    return initialCategories.map(category => {
      // Filtrar transacciones por categoría y fecha
      const totalSpent = MOCK_TRANSACTIONS
        .filter(t => 
          t.categoryId === category.id && 
          isWithinInterval(t.date, { start: dateRange.from, end: dateRange.to })
        )
        .reduce((sum, t) => sum + t.amount, 0)

      // Calcular porcentaje del presupuesto (solo para gastos)
      const percentage = category.budget > 0 ? (totalSpent / category.budget) * 100 : 0

      return { ...category, totalSpent, percentage }
    })
  }, [dateRange])

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} mobileOpen={mobileSidebarOpen} onMobileOpenChange={setMobileSidebarOpen} />

      <div className={cn("transition-all duration-300", "lg:ml-64", sidebarCollapsed && "lg:ml-16")}>
        <TopBar userName="Juan Pérez" onMenuClick={() => setMobileSidebarOpen(true)} />

        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold">Seguimiento por Categorías</h1>
              <p className="text-muted-foreground">Análisis de gastos según el periodo seleccionado</p>
            </div>

            {/* FILTRO DE FECHAS */}
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal w-[280px]">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "dd LLL", { locale: es })} -{" "}
                          {format(dateRange.to, "dd LLL, yyyy", { locale: es })}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, yyyy")
                      )
                    ) : (
                      <span>Seleccionar fecha</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range: any) => range?.from && range?.to && setDateRange(range)}
                    numberOfMonths={2}
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {categoriesWithTotals.map((category) => {
              const Icon = category.icon
              const isOverBudget = category.percentage > 100

              return (
                <Card key={category.id} className="overflow-hidden border-t-4" style={{ borderTopColor: isOverBudget ? '#ef4444' : 'transparent' }}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className={cn("p-3 rounded-xl", category.color)}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{category.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {category.type === "income" ? "Total Ingresado" : "Gasto en este periodo"}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-end">
                        <span className="text-2xl font-bold">{formatCurrency(category.totalSpent)}</span>
                        {category.budget > 0 && (
                          <span className="text-sm text-muted-foreground">
                            de {formatCurrency(category.budget)}
                          </span>
                        )}
                      </div>

                      {category.type === "expense" && category.budget > 0 && (
                        <div className="space-y-1">
                          <Progress 
                            value={category.percentage} 
                            className="h-2" 
                            indicatorClassName={isOverBudget ? "bg-destructive" : "bg-primary"}
                          />
                          <div className="flex justify-between text-xs">
                            <span className={cn(isOverBudget ? "text-destructive font-medium" : "text-muted-foreground")}>
                              {category.percentage.toFixed(1)}% utilizado
                            </span>
                            {isOverBudget && <span>¡Presupuesto excedido!</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </main>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect, useMemo } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/top-bar"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { 
  Plus, Pencil, Trash2, Calendar as CalendarIcon, Check, X,
  ShoppingCart, Home, Car, Utensils, Gamepad2, Briefcase, 
  TrendingUp, Wallet, Heart, GraduationCap, Tag, ArrowRight
} from "lucide-react"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { es } from "date-fns/locale"

// Mapeo de iconos dinámico
const ICON_MAP: Record<string, any> = {
  "Salario": Briefcase,
  "Nómina": Briefcase,
  "Freelance": Wallet,
  "Inversiones": TrendingUp,
  "Alimentación": ShoppingCart,
  "Vivienda": Home,
  "Transporte": Car,
  "Restaurantes": Utensils,
  "Cena": Utensils,
  "Entretenimiento": Gamepad2,
  "Salud": Heart,
  "Educación": GraduationCap,
}

export default function CategoriasPage() {
  const supabase = createClientComponentClient()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  
  // Estados de datos
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Estados de fecha (Filtro)
  const [tempRange, setTempRange] = useState<any>({ 
    from: startOfMonth(new Date()), 
    to: endOfMonth(new Date()) 
  })
  const [confirmedRange, setConfirmedRange] = useState(tempRange)

  // Carga de datos desde Supabase
  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(false)
      const { data, error } = await supabase
        .from('transacciones')
        .select('*')
        .gte('created_at', confirmedRange.from.toISOString())
        .lte('created_at', confirmedRange.to.toISOString())

      if (data) setTransactions(data)
      setLoading(false)
    }
    fetchTransactions()
  }, [confirmedRange, supabase])

  // Lógica de Agrupación (Calcula montos por categoría)
  const categoryStats = useMemo(() => {
    const stats: Record<string, any> = {}
    
    transactions.forEach(t => {
      const catName = t.categoria || "Otros"
      if (!stats[catName]) {
        stats[catName] = { 
          name: catName, 
          total: 0, 
          type: t.monto >= 0 ? "income" : "expense",
          budget: 500000 // Presupuesto base genérico
        }
      }
      stats[catName].total += Math.abs(t.monto)
    })
    
    return Object.values(stats)
  }, [transactions])

  const incomeCategories = categoryStats.filter(c => c.type === "income")
  const expenseCategories = categoryStats.filter(c => c.type === "expense")

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} mobileOpen={mobileSidebarOpen} onMobileOpenChange={setMobileSidebarOpen} />

      <div className={cn("transition-all duration-300", "lg:ml-64", sidebarCollapsed && "lg:ml-16")}>
        <TopBar userName="Lexilis Mejia" onMenuClick={() => setMobileSidebarOpen(true)} />

        <main className="p-4 sm:p-6 lg:p-8">
          {/* Encabezado con Filtro de Fecha */}
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Análisis de Categorías</h1>
              <p className="text-muted-foreground">Basado en tus transacciones del periodo</p>
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
                <Button className="w-full bg-emerald-600" onClick={() => setConfirmedRange(tempRange)}>
                  <Check className="mr-2 h-4 w-4" /> Confirmar Periodo
                </Button>
              </PopoverContent>
            </Popover>
          </div>

          {loading ? (
            <div className="py-20 text-center animate-pulse text-muted-foreground">Cargando datos de transacciones...</div>
          ) : (
            <div className="space-y-10">
              {/* Sección Ingresos */}
              <section>
                <h2 className="mb-4 text-lg font-semibold text-emerald-500">Ingresos por Categoría</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {incomeCategories.map((cat) => (
                    <CategoryCard key={cat.name} cat={cat} formatCurrency={formatCurrency} onClick={() => setSelectedCategory(cat.name)} />
                  ))}
                </div>
              </section>

              {/* Sección Gastos */}
              <section>
                <h2 className="mb-4 text-lg font-semibold text-red-500">Gastos por Categoría</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {expenseCategories.map((cat) => (
                    <CategoryCard key={cat.name} cat={cat} formatCurrency={formatCurrency} isExpense onClick={() => setSelectedCategory(cat.name)} />
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* Tabla de Detalle (Se activa al hacer clic en una tarjeta) */}
          {selectedCategory && (
            <DetailTable 
              category={selectedCategory} 
              transactions={transactions.filter(t => (t.categoria || "Otros") === selectedCategory)}
              onClose={() => setSelectedCategory(null)}
              formatCurrency={formatCurrency}
            />
          )}
        </main>
      </div>
    </div>
  )
}

// Sub-componente para las Tarjetas
function CategoryCard({ cat, formatCurrency, isExpense, onClick }: any) {
  const Icon = ICON_MAP[cat.name] || Tag
  const percent = Math.min((cat.total / cat.budget) * 100, 100)

  return (
    <Card className="group cursor-pointer hover:border-emerald-500/50 transition-all bg-card/50" onClick={onClick}>
      <CardContent className="p-5">
        <div className="flex items-center gap-4 mb-4">
          <div className={cn("p-3 rounded-xl", isExpense ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400")}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg">{cat.name}</h3>
            <p className="text-2xl font-mono">{formatCurrency(cat.total)}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
        </div>
        {isExpense && (
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] uppercase font-bold text-muted-foreground">
              <span>Progreso Presupuesto</span>
              <span>{percent.toFixed(0)}%</span>
            </div>
            <Progress value={percent} className="h-1.5" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Sub-componente para la Tabla de Detalle
function DetailTable({ category, transactions, onClose, formatCurrency }: any) {
  return (
    <Card className="mt-10 border-emerald-500/30 bg-secondary/10 animate-in fade-in slide-in-from-bottom-5">
      <CardHeader className="flex flex-row items-center justify-between border-b border-white/5">
        <CardTitle className="text-emerald-500">Movimientos: {category}</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
      </CardHeader>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground border-b border-white/5">
              <th className="p-4">Fecha</th>
              <th className="p-4">Descripción</th>
              <th className="p-4 text-right">Monto</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t: any) => (
              <tr key={t.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="p-4">{format(new Date(t.created_at), "dd/MM/yyyy")}</td>
                <td className="p-4">{t.descripcion}</td>
                <td className={cn("p-4 text-right font-bold", t.monto >= 0 ? "text-emerald-400" : "text-red-400")}>
                  {formatCurrency(t.monto)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

"use client"

import { useState, useEffect, useMemo } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/top-bar"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarIcon, Tag, Utensils, Briefcase, ShoppingCart, Check, X, ArrowRight } from "lucide-react"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { es } from "date-fns/locale"

export default function CategoriasPage() {
  const supabase = createClientComponentClient()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState(null)

  const [range, setRange] = useState({ 
    from: startOfMonth(new Date()), 
    to: endOfMonth(new Date()) 
  })

  useEffect(() => {
    async function fetchTransactions() {
      setLoading(true)
      const { data } = await supabase
        .from('transacciones')
        .select('*')
        .gte('created_at', range.from.toISOString())
        .lte('created_at', range.to.toISOString())
      
      if (data) setTransactions(data)
      setLoading(false)
    }
    fetchTransactions()
  }, [range, supabase])

  const stats = useMemo(() => {
    const agrupado = {}
    transactions.forEach(t => {
      const cat = t.categoria || "Otros"
      if (!agrupado[cat]) agrupado[cat] = { nombre: cat, total: 0, count: 0, type: t.monto >= 0 ? 'income' : 'expense' }
      agrupado[cat].total += Math.abs(t.monto)
      agrupado[cat].count += 1
    })
    return Object.values(agrupado).sort((a, b) => b.total - a.total)
  }, [transactions])

  const formatCurrency = (val) => 
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(val)

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} mobileOpen={mobileSidebarOpen} onMobileOpenChange={setMobileSidebarOpen} />
      <div className={cn("transition-all lg:ml-64", sidebarCollapsed && "lg:ml-16")}>
        <TopBar userName="lexilis mejia" onMenuClick={() => setMobileSidebarOpen(true)} />
        
        <main className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-bold">Gastos por Categoría</h1>
              <p className="text-muted-foreground text-sm">Toca una tarjeta para ver transacciones</p>
            </div>
            
            <div className="bg-card p-2 rounded-lg border border-white/5 flex items-center gap-2 text-sm">
              <CalendarIcon className="h-4 w-4 text-emerald-500" />
              <span>{format(range.from, "dd MMM")} - {format(range.to, "dd MMM, yyyy")}</span>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {stats.map((cat) => (
              <Card 
                key={cat.nombre} 
                className={cn(
                  "cursor-pointer hover:bg-emerald-500/5 transition-all border-white/5",
                  selectedCategory === cat.nombre && "ring-2 ring-emerald-500"
                )}
                onClick={() => setSelectedCategory(selectedCategory === cat.nombre ? null : cat.nombre)}
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                      <Tag className="h-5 w-5" />
                    </div>
                    <ArrowRight className={cn("h-4 w-4 transition-transform", selectedCategory === cat.nombre && "rotate-90")} />
                  </div>
                  <h3 className="font-bold text-lg">{cat.nombre}</h3>
                  <p className="text-2xl font-bold">{formatCurrency(cat.total)}</p>
                  <p className="text-xs text-muted-foreground mt-2">{cat.count} movimientos</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedCategory && (
            <Card className="mt-8 border-emerald-500/20 bg-card/50 overflow-hidden">
              <div className="p-4 border-b border-white/5 flex justify-between items-center bg-emerald-500/10">
                <h2 className="font-bold text-emerald-500">Detalle: {selectedCategory}</h2>
                <Button variant="ghost" size="icon" onClick={() => setSelectedCategory(null)}><X className="h-4 w-4"/></Button>
              </div>
              <div className="divide-y divide-white/5">
                {transactions.filter(t => (t.categoria || "Otros") === selectedCategory).map(t => (
                  <div key={t.id} className="p-4 flex justify-between hover:bg-white/5 transition-colors">
                    <div>
                      <p className="font-medium">{t.descripcion || "Sin descripción"}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(t.created_at), "dd/MM/yyyy")}</p>
                    </div>
                    <span className={cn("font-bold", t.monto >= 0 ? "text-emerald-400" : "text-red-400")}>
                      {formatCurrency(t.monto)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </main>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect, useMemo } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/top-bar"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Tag, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useThemeSettings } from "@/lib/theme-context"

export default function CategoriasPage() {
  const supabase = createClient()
  const { theme } = useThemeSettings()
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTransactions() {
      setLoading(true)
      // Traemos las últimas 100 transacciones sin filtro de fecha estricto para probar
      const { data, error } = await supabase
        .from('transacciones')
        .select('*')
        .limit(100)
      
      if (error) console.error("Error de Supabase:", error)
      if (data) setTransactions(data)
      setLoading(false)
    }
    fetchTransactions()
  }, [supabase])

  const stats = useMemo(() => {
    const agrupado: Record<string, any> = {}
    transactions.forEach((t: any) => {
      const cat = t.categoria || "Otros"
      if (!agrupado[cat]) agrupado[cat] = { nombre: cat, total: 0, count: 0 }
      agrupado[cat].total += Math.abs(t.monto || 0)
      agrupado[cat].count += 1
    })
    return Object.values(agrupado)
  }, [transactions])

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} mobileOpen={mobileSidebarOpen} onMobileOpenChange={setMobileSidebarOpen} />
      <div className={cn("transition-all lg:ml-64", sidebarCollapsed && "lg:ml-16")}>
        <TopBar userName="lexilis mejia" onMenuClick={() => setMobileSidebarOpen(true)} />
        
        <main className="p-6">
          <h1 className="text-2xl font-bold mb-6">Análisis por Categoría</h1>

          {loading ? (
            <p>Cargando datos...</p>
          ) : stats.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {stats.map((cat: any) => (
                <Card key={cat.nombre} className="border-white/10 bg-card">
                  <CardContent className="p-6">
                    <Tag className="mb-4 h-5 w-5 text-emerald-500" />
                    <h3 className="font-bold text-lg">{cat.nombre}</h3>
                    <p className="text-2xl font-bold">
                      ${new Intl.NumberFormat("es-CO").format(cat.total)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">{cat.count} movimientos</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-card/50 rounded-xl border border-dashed border-white/20">
              <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-xl font-medium">No se encontraron transacciones</p>
              <p className="text-sm text-muted-foreground">Verifica que tengas datos cargados en Supabase</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect, useMemo } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/top-bar"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Tag, X, ArrowRight, Calendar as CalendarIcon, 
  TrendingUp, TrendingDown, Info 
} from "lucide-react"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { es } from "date-fns/locale"
import { createClient } from "@/lib/supabase/client"
import { useThemeSettings } from "@/lib/theme-context"

export default function CategoriasPage() {
  const supabase = createClient()
  const { theme } = useThemeSettings()
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Rango de fechas por defecto (Mes actual)
  const [range] = useState({ 
    from: startOfMonth(new Date()), 
    to: endOfMonth(new Date()) 
  })

  // 1. Obtener perfil del usuario (Igual que en tu página de Transacciones)
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profileData } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single()
      setProfile(profileData)
    }
    fetchProfile()
  }, [supabase])

  // 2. Obtener transacciones filtradas por la cédula del perfil cargado
  useEffect(() => {
    if (!profile?.cedula) return

    async function fetchTransactions() {
      setLoading(true)
      const { data, error } = await supabase
        .from('transacciones')
        .select('*')
        .eq('cedula', profile.cedula) // Filtro esencial para ver solo tus datos
      
      if (data) setTransactions(data)
      setLoading(false)
    }
    fetchTransactions()
  }, [profile, supabase])

  // 3. Procesar datos para las tarjetas de categorías
  const stats = useMemo(() => {
    const agrupado: Record<string, any> = {}
    
    transactions.forEach((t: any) => {
      const cat = t.categoria || "Otros"
      if (!agrupado[cat]) {
        agrupado[cat] = { 
          nombre: cat, 
          total: 0, 
          count: 0, 
          tipo: t.monto >= 0 ? 'ingreso' : 'gasto' 
        }
      }
      agrupado[cat].total += Math.abs(t.monto || 0)
      agrupado[cat].count += 1
    })
    
    return Object.values(agrupado).sort((a: any, b: any) => b.total - a.total)
  }, [transactions])

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat("es-CO", { 
      style: "currency", 
      currency: "COP", 
      minimumFractionDigits: 0 
    }).format(val)

  return (
    <div className="min-h-screen bg-background">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onCollapsedChange={setSidebarCollapsed} 
        mobileOpen={mobileSidebarOpen} 
        onMobileOpenChange={setMobileSidebarOpen}
        sidebarColor={theme.sidebar_color}
      />
      
      <div className={cn("transition-all duration-300", "lg:ml-64", sidebarCollapsed && "lg:ml-16")}>
        <TopBar 
          userName={profile ? `${profile.nombres} ${profile.apellidos}` : "Cargando..."} 
          avatarUrl={profile?.avatar_url}
          onMenuClick={() => setMobileSidebarOpen(true)} 
        />
        
        <main className="p-4 sm:p-6 lg:p-8">
          <header className="mb-8">
            <h1 className="text-2xl font-bold" style={{ color: theme.text_color }}>
              Análisis por Categoría
            </h1>
            <p className="text-muted-foreground">Visualiza en qué estás gastando tu dinero</p>
          </header>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 mb-4" style={{ borderColor: theme.primary_color }}></div>
              <p className="text-muted-foreground animate-pulse">Sincronizando con Supabase...</p>
            </div>
          ) : stats.length > 0 ? (
            <>
              {/* Grid de Tarjetas */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {stats.map((cat: any) => (
                  <Card 
                    key={cat.nombre}
                    onClick={() => setSelectedCategory(selectedCategory === cat.nombre ? null : cat.nombre)}
                    className={cn(
                      "cursor-pointer transition-all border-white/5 hover:scale-[1.02]",
                      selectedCategory === cat.nombre ? "ring-2 ring-emerald-500 bg-emerald-500/5" : "bg-card"
                    )}
                    style={{ backgroundColor: selectedCategory === cat.nombre ? undefined : theme.card_color }}
                  >
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                          <Tag size={20} />
                        </div>
                        {cat.tipo === 'ingreso' ? (
                          <TrendingUp size={16} className="text-emerald-400" />
                        ) : (
                          <TrendingDown size={16} className="text-rose-400" />
                        )}
                      </div>
                      <h3 className="font-bold text-lg" style={{ color: theme.text_color }}>{cat.nombre}</h3>
                      <p className="text-2xl font-bold mt-1">
                        {formatCurrency(cat.total)}
                      </p>
                      <div className="flex justify-between items-center mt-4 text-xs text-muted-foreground">
                        <span>{cat.count} transacciones</span>
                        <span className="flex items-center gap-1 text-emerald-500 font-medium">
                          Ver detalles <ArrowRight size={12} />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Detalle de la Categoría Seleccionada */}
              {selectedCategory && (
                <div className="mt-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: theme.text_color }}>
                      Movimientos: {selectedCategory}
                    </h2>
                    <Button variant="outline" size="sm" onClick={() => setSelectedCategory(null)} className="border-white/10">
                      <X className="mr-2 h-4 w-4" /> Cerrar
                    </Button>
                  </div>
                  
                  <Card className="border-white/10 overflow-hidden" style={{ backgroundColor: theme.card_color }}>
                    <div className="divide-y divide-white/5">
                      {transactions
                        .filter((t: any) => (t.categoria || "Otros") === selectedCategory)
                        .map((t: any) => (
                          <div key={t.id} className="p-4 flex justify-between items-center hover:bg-white/5">
                            <div>
                              <p className="font-medium" style={{ color: theme.text_color }}>{t.descripcion || "Sin descripción"}</p>
                              <p className="text-xs text-muted-foreground">
                                {t.created_at ? format(new Date(t.created_at), "PPP", { locale: es }) : "S/F"}
                              </p>
                            </div>
                            <span className={cn("font-bold", t.monto >= 0 ? "text-emerald-400" : "text-rose-400")}>
                              {t.monto >= 0 ? "+" : ""}{formatCurrency(t.monto)}
                            </span>
                          </div>
                        ))}
                    </div>
                  </Card>
                </div>
              )}
            </>
          ) : (
            <div className="py-20 text-center border-2 border-dashed border-white/10 rounded-2xl">
              <Info className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No hay datos todavía</h3>
              <p className="text-muted-foreground">Las transacciones que registres aparecerán aquí clasificadas.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

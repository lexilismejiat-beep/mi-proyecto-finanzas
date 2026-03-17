"use client"

import { useState, useEffect, useMemo } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/top-bar"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Tag, X, ArrowRight, TrendingUp, TrendingDown, Info 
} from "lucide-react"
import { format } from "date-fns"
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

  // 1. Obtener perfil del usuario para el TopBar
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

  // 2. Obtener TODAS las transacciones (Sin filtro de cédula temporalmente)
  useEffect(() => {
    async function fetchTransactions() {
      setLoading(true)
      const { data, error } = await supabase
        .from('transacciones')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) console.error("Error cargando datos:", error)
      if (data) setTransactions(data)
      setLoading(false)
    }
    fetchTransactions()
  }, [supabase])

  // 3. Agrupar montos por categoría
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
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onCollapsedChange={setSidebarCollapsed} 
        mobileOpen={mobileSidebarOpen} 
        onMobileOpenChange={setMobileSidebarOpen}
        sidebarColor={theme.sidebar_color}
      />
      
      <div className={cn("transition-all duration-300", "lg:ml-64", sidebarCollapsed && "lg:ml-16")}>
        <TopBar 
          userName={profile ? `${profile.nombres} ${profile.apellidos}` : "Usuario"} 
          avatarUrl={profile?.avatar_url}
          onMenuClick={() => setMobileSidebarOpen(true)} 
        />
        
        <main className="p-4 sm:p-6 lg:p-8">
          <header className="mb-8">
            <h1 className="text-2xl font-bold" style={{ color: theme.text_color }}>
              Análisis por Categoría
            </h1>
            <p className="text-muted-foreground italic">Haz clic en una tarjeta para ver el detalle de movimientos</p>
          </header>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 mb-4" style={{ borderColor: theme.primary_color }}></div>
              <p className="text-muted-foreground">Cargando categorías...</p>
            </div>
          ) : stats.length > 0 ? (
            <>
              {/* Tarjetas de Categorías */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {stats.map((cat: any) => (
                  <Card 
                    key={cat.nombre}
                    onClick={() => setSelectedCategory(selectedCategory === cat.nombre ? null : cat.nombre)}
                    className={cn(
                      "cursor-pointer transition-all border-white/5 hover:scale-[1.02] hover:bg-white/5",
                      selectedCategory === cat.nombre && "ring-2 ring-offset-2 ring-offset-background"
                    )}
                    style={{ 
                      backgroundColor: theme.card_color,
                      borderColor: selectedCategory === cat.nombre ? theme.primary_color : "transparent"
                    }}
                  >
                    <CardContent className="p-6 text-white">
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: `${theme.primary_color}20`, color: theme.primary_color }}>
                          <Tag size={20} />
                        </div>
                        {cat.tipo === 'ingreso' ? (
                          <TrendingUp size={16} className="text-emerald-400" />
                        ) : (
                          <TrendingDown size={16} className="text-rose-400" />
                        )}
                      </div>
                      <h3 className="font-bold text-lg">{cat.nombre}</h3>
                      <p className="text-2xl font-bold mt-1">
                        {formatCurrency(cat.total)}
                      </p>
                      <div className="flex justify-between items-center mt-4 text-xs text-muted-foreground">
                        <span>{cat.count} movimientos</span>
                        <span className="flex items-center gap-1" style={{ color: theme.primary_color }}>
                          Ver detalles <ArrowRight size={12} />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* LISTADO DE DETALLES (Aparece al seleccionar una tarjeta) */}
              {selectedCategory && (
                <div className="mt-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold" style={{ color: theme.text_color }}>
                      Detalles de: {selectedCategory}
                    </h2>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedCategory(null)}>
                      <X className="mr-2 h-4 w-4" /> Cerrar
                    </Button>
                  </div>
                  
                  <Card className="border-white/10" style={{ backgroundColor: theme.card_color }}>
                    <div className="divide-y divide-white/5 text-white">
                      {transactions
                        .filter((t: any) => (t.categoria || "Otros") === selectedCategory)
                        .map((t: any) => (
                          <div key={t.id} className="p-4 flex justify-between items-center hover:bg-white/5">
                            <div>
                              <p className="font-medium">{t.descripcion || "Transacción sin nombre"}</p>
                              <p className="text-xs text-muted-foreground">
                                {t.created_at ? format(new Date(t.created_at), "dd MMM yyyy", { locale: es }) : "S/F"}
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
              <h3 className="text-lg font-medium">No se encontraron datos</h3>
              <p className="text-muted-foreground text-sm px-4">
                Asegúrate de que la tabla "transacciones" tenga registros en tu base de datos de Supabase.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

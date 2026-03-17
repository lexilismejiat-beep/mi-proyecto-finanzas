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

  // 1. Obtener perfil
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

  // 2. Obtener transacciones (Sin filtro de cédula para asegurar que veas datos)
  useEffect(() => {
    async function fetchTransactions() {
      setLoading(true)
      const { data, error } = await supabase
        .from('transacciones')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) console.error("Error:", error)
      if (data) setTransactions(data)
      setLoading(false)
    }
    fetchTransactions()
  }, [supabase])

  // 3. Agrupación de datos
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
    <div className="min-h-screen bg-[#0a0a0a] text-white">
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
            <h1 className="text-2xl font-bold text-white">Análisis por Categoría</h1>
            <p className="text-gray-400">Toca una tarjeta para ver tus movimientos detallados</p>
          </header>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
            </div>
          ) : stats.length > 0 ? (
            <>
              {/* Grid de Tarjetas Oscuras */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {stats.map((cat: any) => (
                  <Card 
                    key={cat.nombre}
                    onClick={() => setSelectedCategory(selectedCategory === cat.nombre ? null : cat.nombre)}
                    className={cn(
                      "cursor-pointer transition-all border-white/10 hover:bg-[#1a1a1a]",
                      selectedCategory === cat.nombre ? "ring-2 ring-emerald-500 bg-[#1a1a1a]" : "bg-[#121212]"
                    )}
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
                      <h3 className="font-bold text-lg text-white">{cat.nombre}</h3>
                      <p className="text-2xl font-bold mt-1 text-white">
                        {formatCurrency(cat.total)}
                      </p>
                      <div className="flex justify-between items-center mt-4 text-xs text-gray-500">
                        <span>{cat.count} movimientos</span>
                        <span className="flex items-center gap-1 text-emerald-500">
                          Detalles <ArrowRight size={12} />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Detalle de Movimientos */}
              {selectedCategory && (
                <div className="mt-10 animate-in fade-in slide-in-from-bottom-4">
                  <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                    <h2 className="text-xl font-bold text-white">Historial: {selectedCategory}</h2>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedCategory(null)} className="text-gray-400">
                      <X className="h-4 w-4 mr-2" /> Cerrar
                    </Button>
                  </div>
                  
                  <Card className="bg-[#121212] border-white/10 overflow-hidden">
                    <div className="divide-y divide-white/5">
                      {transactions
                        .filter((t: any) => (t.categoria || "Otros") === selectedCategory)
                        .map((t: any) => (
                          <div key={t.id} className="p-4 flex justify-between items-center hover:bg-white/5 transition-colors">
                            <div>
                              <p className="font-medium text-gray-200">{t.descripcion || "Sin descripción"}</p>
                              <p className="text-xs text-gray-500">
                                {t.created_at ? format(new Date(t.created_at), "dd MMM yyyy", { locale: es }) : "S/F"}
                              </p>
                            </div>
                            <span className={cn("font-bold text-lg", t.monto >= 0 ? "text-emerald-400" : "text-rose-400")}>
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
            <div className="py-20 text-center border-2 border-dashed border-white/10 rounded-2xl bg-[#121212]">
              <Info className="mx-auto h-12 w-12 text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-white">No hay datos para mostrar</h3>
              <p className="text-gray-500">Registra transacciones para ver tu análisis.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/top-bar"
import { cn } from "@/lib/utils"
import { Loader2, Calendar as CalendarIcon, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useThemeSettings } from "@/lib/theme-context"
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns"
import { toast } from "sonner"

const MONTHS = [
  { value: 0, label: "Enero" }, { value: 1, label: "Febrero" },
  { value: 2, label: "Marzo" }, { value: 3, label: "Abril" },
  { value: 4, label: "Mayo" }, { value: 5, label: "Junio" },
  { value: 6, label: "Julio" }, { value: 7, label: "Agosto" },
  { value: 8, label: "Septiembre" }, { value: 9, label: "Octubre" },
  { value: 10, label: "Noviembre" }, { value: 11, label: "Diciembre" }
]

export default function TransaccionesPage() {
  const supabase = createClient()
  const { theme } = useThemeSettings()

  // Estados de interfaz
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  
  // Estados de datos
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  // 1. Cargar Perfil
  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profileData } = await supabase.from("user_profiles").select("*").eq("id", user.id).single()
      const { data: mainProfile } = await supabase.from("profiles").select("avatar_url").eq("id", user.id).single()
      
      if (profileData) {
        setProfile({
          ...profileData,
          avatar_url: mainProfile?.avatar_url || profileData.avatar_url
        })
      }
    }
    loadUser()
  }, [])

  // 2. Carga de Transacciones
  useEffect(() => {
    async function fetchTransactions() {
      try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const baseDate = new Date(selectedYear, selectedMonth, 1)
        const rangeFrom = startOfMonth(baseDate)
        const rangeTo = endOfMonth(baseDate)

        let query = supabase
          .from("transacciones")
          .select("*")
          .gte("created_at", startOfDay(rangeFrom).toISOString())
          .lte("created_at", endOfDay(rangeTo).toISOString())
          .order("created_at", { ascending: false })

        const userIdToFilter = profile?.cedula || user.id
        query = query.eq("user_id", userIdToFilter)

        const { data, error } = await query
        if (error) throw error
        setTransactions(data || [])
      } catch (err) {
        console.error(err)
        toast.error("Error al sincronizar datos")
      } finally {
        setLoading(false)
      }
    }
    fetchTransactions()
  }, [selectedMonth, selectedYear, profile?.cedula])

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Sidebar con controles de mobile activos */}
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onCollapsedChange={setSidebarCollapsed} 
        mobileOpen={mobileSidebarOpen} 
        onMobileOpenChange={setMobileSidebarOpen} 
      />

      <div className={cn(
        "transition-all duration-300",
        "lg:ml-64",
        sidebarCollapsed && "lg:ml-16"
      )}>
        <TopBar 
          userName={profile ? `${profile.nombres}` : "Usuario"} 
          avatarUrl={profile?.avatar_url}
          onMenuClick={() => setMobileSidebarOpen(true)} // Activa la hamburguesa
        />
        
        <main className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Mis Movimientos</h1>
              <p className="text-gray-400 text-sm">Visualizando {MONTHS[selectedMonth].label} {selectedYear}</p>
            </div>

            {/* Selectores Responsivos */}
            <div className="flex items-center w-full md:w-auto gap-2 bg-[#121212] p-2 rounded-xl border border-white/10">
              <CalendarIcon className="ml-2 h-4 w-4 text-emerald-500" />
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="bg-transparent border-none focus:ring-0 text-sm font-medium cursor-pointer p-1 flex-1 md:flex-none"
              >
                {MONTHS.map(m => <option key={m.value} value={m.value} className="bg-[#121212]">{m.label}</option>)}
              </select>
              
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="bg-transparent border-none focus:ring-0 text-sm font-medium cursor-pointer p-1 border-l border-white/10"
              >
                {[2024, 2025, 2026].map(y => <option key={y} value={y} className="bg-[#121212]">{y}</option>)}
              </select>
            </div>
          </div>

          {/* Contenedor de Resultados */}
          <div className="bg-[#121212] rounded-2xl border border-white/5 overflow-hidden">
            {loading ? (
              <div className="p-20 flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
                <p className="text-gray-500 animate-pulse">Cargando...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-20 text-center">
                <AlertCircle className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No hay registros.</p>
              </div>
            ) : (
              <>
                {/* VISTA PARA MÓVIL (Tarjetas) - Se oculta en Desktop */}
                <div className="block md:hidden divide-y divide-white/5">
                  {transactions.map((t) => (
                    <div key={t.id} className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-100">{t.descripcion || "Sin nombre"}</p>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider">{format(new Date(t.created_at), "dd MMM, yyyy")}</p>
                        </div>
                        <p className={cn(
                          "font-bold",
                          t.tipo?.trim() === "Ingreso" ? "text-emerald-400" : "text-rose-400"
                        )}>
                          {t.tipo?.trim() === "Ingreso" ? "+" : "-"}${Number(t.monto).toLocaleString('es-CO')}
                        </p>
                      </div>
                      <span className="inline-block px-2 py-0.5 rounded-md bg-white/5 text-[9px] text-gray-400 border border-white/10 uppercase">
                        {t.categoria}
                      </span>
                    </div>
                  ))}
                </div>

                {/* VISTA PARA DESKTOP (Tabla) - Se oculta en Móvil */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                      <tr>
                        <th className="p-4 font-semibold">Fecha</th>
                        <th className="p-4 font-semibold">Descripción</th>
                        <th className="p-4 font-semibold">Categoría</th>
                        <th className="p-4 font-semibold text-right">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {transactions.map((t) => (
                        <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="p-4 text-sm text-gray-400">{format(new Date(t.created_at), "dd/MM/yyyy")}</td>
                          <td className="p-4 font-medium">{t.descripcion || "Gasto sin nombre"}</td>
                          <td className="p-4">
                            <span className="px-2 py-1 rounded-md bg-white/5 text-[10px] text-gray-400 border border-white/10 uppercase">
                              {t.categoria}
                            </span>
                          </td>
                          <td className={cn(
                            "p-4 text-right font-bold",
                            t.tipo?.trim() === "Ingreso" ? "text-emerald-400" : "text-rose-400"
                          )}>
                            {t.tipo?.trim() === "Ingreso" ? "+" : "-"}${Number(t.monto).toLocaleString('es-CO')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

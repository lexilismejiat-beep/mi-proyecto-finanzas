"use client"

import { useState, useEffect, useMemo } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/top-bar"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Plus, Loader2, Calendar as CalendarIcon, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useThemeSettings } from "@/lib/theme-context"
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns"
import { es } from "date-fns/locale"
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

  // Estados
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  
  // Control de fecha (Igual que en tu selector de Reportes)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  // 1. Cargar Perfil (Copia exacta de tu lógica de Reportes)
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

  // 2. CARGA DE DATOS (Esta es la parte que debe refrescarse)
  useEffect(() => {
    async function fetchTransactions() {
      try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Calculamos el rango basado en los selectores
        const baseDate = new Date(selectedYear, selectedMonth, 1)
        const rangeFrom = startOfMonth(baseDate)
        const rangeTo = endOfMonth(baseDate)

        let query = supabase
          .from("transacciones")
          .select("*")
          .gte("created_at", startOfDay(rangeFrom).toISOString())
          .lte("created_at", endOfDay(rangeTo).toISOString())
          .order("created_at", { ascending: false })

        // Filtro de ID (Copia exacta de tu ReportePage)
        // Nota: Si profile aún no carga, usamos user.id temporalmente
        const userIdToFilter = profile?.cedula || user.id
        query = query.eq("user_id", userIdToFilter)

        const { data, error } = await query
        if (error) throw error

        setTransactions(data || [])
      } catch (err) {
        console.error("Error cargando transacciones:", err)
        toast.error("Error al sincronizar datos")
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
    // Dependencias: Se dispara cuando cambia el mes, el año o cuando el perfil termina de cargar
  }, [selectedMonth, selectedYear, profile?.cedula])

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Sidebar />
      <div className="lg:ml-64 transition-all">
        <TopBar userName={profile ? `${profile.nombres}` : "Cargando..."} avatarUrl={profile?.avatar_url} />
        
        <main className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold">Mis Movimientos</h1>
              <p className="text-gray-400">Visualizando {MONTHS[selectedMonth].label} {selectedYear}</p>
            </div>

            {/* SELECTORES REACTIVOS */}
            <div className="flex items-center gap-2 bg-[#121212] p-2 rounded-xl border border-white/10">
              <CalendarIcon className="ml-2 h-4 w-4 text-emerald-500" />
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="bg-transparent border-none focus:ring-0 text-sm font-medium cursor-pointer p-1"
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

          {/* TABLA DE RESULTADOS */}
          <div className="bg-[#121212] rounded-2xl border border-white/5 overflow-hidden">
            {loading ? (
              <div className="p-20 flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
                <p className="text-gray-500 animate-pulse">Consultando base de datos...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-20 text-center">
                <AlertCircle className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No hay registros para este periodo.</p>
                <p className="text-xs text-gray-600 mt-2">Intenta cambiar el mes o año arriba.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
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
                        <td className="p-4 text-sm text-gray-400">
                          {format(new Date(t.created_at), "dd/MM/yyyy")}
                        </td>
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
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/top-bar"
import { TransactionsTable } from "@/components/dashboard/transactions-table"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Plus, Loader2, Calendar as CalendarIcon } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useThemeSettings } from "@/lib/theme-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Estados de Fecha - Controlan el refresco de la tabla
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  const [nuevaTrans, setNuevaTrans] = useState({
    descripcion: "",
    monto: "",
    categoria: "",
    fecha: new Date().toISOString().split('T')[0]
  })

  const supabase = createClient()
  const { theme } = useThemeSettings()

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profileData } = await supabase.from("user_profiles").select("*").eq("id", user.id).single()
      if (profileData) setProfile(profileData)
    }
    fetchProfile()
  }, [supabase])

  const handleGuardarManual = async () => {
    if (!nuevaTrans.descripcion || !nuevaTrans.monto) {
      toast.error("Datos incompletos")
      return
    }

    setIsSaving(true)
    try {
      const { error } = await supabase.from("transacciones").insert([{
        user_id: profile?.cedula || (await supabase.auth.getUser()).data.user?.id,
        descripcion: nuevaTrans.descripcion,
        monto: parseFloat(nuevaTrans.monto),
        categoria: nuevaTrans.categoria || "Otros",
        tipo: parseFloat(nuevaTrans.monto) >= 0 ? "Ingreso" : "Egreso"
      }])

      if (error) throw error
      toast.success("¡Guardado!")
      setIsModalOpen(false)
      // Recargar para ver el nuevo dato si está en el mes actual
      window.location.reload()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Sidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} mobileOpen={mobileSidebarOpen} onMobileOpenChange={setMobileSidebarOpen} sidebarColor={theme.sidebar_color} />
      <div className={cn("transition-all duration-300", "lg:ml-64", sidebarCollapsed && "lg:ml-16")}>
        <TopBar userName={profile ? `${profile.nombres}` : "Usuario"} avatarUrl={profile?.avatar_url} onMenuClick={() => setMobileSidebarOpen(true)} />
        <main className="p-4 sm:p-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: theme.text_color }}>Transacciones</h1>
              <p className="text-zinc-400 text-sm">Administra tus movimientos</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* SELECTORES DE FECHA */}
              <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 p-2 rounded-lg">
                <CalendarIcon className="h-4 w-4 text-emerald-500" />
                <select 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="bg-transparent text-sm outline-none cursor-pointer"
                >
                  {MONTHS.map((m) => <option key={m.value} value={m.value} className="bg-zinc-900">{m.label}</option>)}
                </select>
                <select 
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-transparent text-sm outline-none cursor-pointer border-l border-zinc-700 pl-2"
                >
                  {[2024, 2025, 2026].map((y) => <option key={y} value={y} className="bg-zinc-900">{y}</option>)}
                </select>
              </div>

              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 font-bold">
                    <Plus className="h-4 w-4 mr-2" /> Nueva
                  </Button>
                </DialogTrigger>
                {/* Contenido del modal omitido por brevedad, igual al anterior */}
              </Dialog>
            </div>
          </div>

          <TransactionsTable 
            userCedula={profile?.cedula} 
            selectedMonth={selectedMonth} 
            selectedYear={selectedYear} 
            cardColor={theme.card_color}
          />
        </main>
      </div>
    </div>
  )
}

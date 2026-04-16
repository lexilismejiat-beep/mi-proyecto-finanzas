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

// Importaciones de date-fns (Igual que en Reportes)
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns"

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
  
  // Estados para el Filtro Mensual
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

  // Carga de Perfil idéntica a Reportes
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const { data: profileData } = await supabase.from("user_profiles").select("*").eq("id", user.id).single()
      const { data: mainProfile } = await supabase.from("profiles").select("avatar_url").eq("id", user.id).single()
      
      if (profileData) {
        setProfile({ ...profileData, avatar_url: mainProfile?.avatar_url || profileData.avatar_url })
      }
    }
    fetchProfile()
  }, [supabase])

  const handleGuardarManual = async () => {
    if (!nuevaTrans.descripcion || !nuevaTrans.monto) {
      toast.error("Debes ingresar una descripción y un monto")
      return
    }

    setIsSaving(true)
    try {
      const montoNumerico = parseFloat(nuevaTrans.monto)
      
      const { error } = await supabase.from("transacciones").insert([{
        user_id: profile?.cedula || (await supabase.auth.getUser()).data.user?.id,
        descripcion: nuevaTrans.descripcion,
        monto: montoNumerico,
        categoria: nuevaTrans.categoria || "Otros",
        // Usamos la fecha seleccionada en el modal, pero Supabase llenará created_at automáticamente
        fecha: nuevaTrans.fecha, 
        tipo: montoNumerico >= 0 ? "Ingreso" : "Egreso"
      }])

      if (error) throw error

      toast.success("¡Transacción guardada!")
      setNuevaTrans({
        descripcion: "", monto: "", categoria: "",
        fecha: new Date().toISOString().split('T')[0]
      })
      setIsModalOpen(false)
      
      // Recarga para refrescar datos
      setTimeout(() => { window.location.reload() }, 500)

    } catch (error: any) {
      toast.error("Error al guardar: " + error.message)
    } finally {
      setIsSaving(false)
    }
  }

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
        <TopBar userName={profile ? `${profile.nombres} ${profile.apellidos}` : "Usuario"} avatarUrl={profile?.avatar_url} onMenuClick={() => setMobileSidebarOpen(true)} />

        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: theme.text_color }}>Transacciones</h1>
              <p className="text-zinc-400">Administra tus movimientos financieros</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* SELECTOR DE MES (Lógica conectada) */}
              <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 p-2 rounded-lg">
                <CalendarIcon className="h-4 w-4 text-emerald-500 ml-1" />
                <select 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="bg-transparent border-none outline-none font-medium text-sm text-white cursor-pointer"
                >
                  {MONTHS.map((month) => (
                    <option key={month.value} value={month.value} className="bg-zinc-900">{month.label}</option>
                  ))}
                </select>
                <select 
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="bg-transparent border-none outline-none font-medium text-sm text-white cursor-pointer border-l border-zinc-700 pl-2"
                >
                  {[2024, 2025, 2026].map((year) => (
                    <option key={year} value={year} className="bg-zinc-900">{year}</option>
                  ))}
                </select>
              </div>

              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                    <Plus className="h-4 w-4" /> Nueva Transacción
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#121212] border-zinc-800 text-white sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle className="text-emerald-500 text-xl font-bold">Agregar Movimiento</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-6 py-4">
                    <div className="space-y-2">
                      <Label className="text-zinc-300">Descripción</Label>
                      <Input className="bg-zinc-900 border-zinc-700" value={nuevaTrans.descripcion} onChange={(e) => setNuevaTrans({...nuevaTrans, descripcion: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-zinc-300">Monto (Negativo para gastos)</Label>
                      <Input type="number" className="bg-zinc-900 border-zinc-700" value={nuevaTrans.monto} onChange={(e) => setNuevaTrans({...nuevaTrans, monto: e.target.value})} />
                    </div>
                  </div>
                  <Button onClick={handleGuardarManual} disabled={isSaving} className="w-full bg-emerald-600 font-black h-12 text-lg">
                    {isSaving ? <Loader2 className="animate-spin mr-2" /> : "Guardar Transacción"}
                  </Button>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* TABLA CONECTADA A LOS ESTADOS */}
          <TransactionsTable 
            cardColor={theme.card_color} 
            textColor={theme.text_color} 
            userCedula={profile?.cedula} 
            selectedMonth={selectedMonth} 
            selectedYear={selectedYear} 
          />
        </main>
      </div>
    </div>
  )
}

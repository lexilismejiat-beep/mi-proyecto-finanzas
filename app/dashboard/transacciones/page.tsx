"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/top-bar"
import { TransactionsTable } from "@/components/dashboard/transactions-table"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useThemeSettings } from "@/lib/theme-context"
// Importamos un diálogo para el formulario manual
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function TransaccionesPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Estado para la nueva transacción manual
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
      const { data: mainProfile } = await supabase.from("profiles").select("avatar_url").eq("id", user.id).single()
      
      if (profileData) {
        setProfile({ ...profileData, avatar_url: mainProfile?.avatar_url || profileData.avatar_url })
      }
    }
    fetchProfile()
  }, [supabase])

  // Función para guardar la transferencia manual
  const handleGuardarManual = async () => {
    try {
      if (!nuevaTrans.descripcion || !nuevaTrans.monto) {
        toast.error("Llena los campos básicos")
        return
      }

      const { error } = await supabase.from("transacciones").insert([{
        user_id: profile?.cedula, // Usamos la cédula como vinculación
        descripcion: nuevaTrans.descripcion,
        monto: parseFloat(nuevaTrans.monto),
        categoria: nuevaTrans.categoria || "Manual",
        fecha: nuevaTrans.fecha,
        tipo: parseFloat(nuevaTrans.monto) >= 0 ? "Ingreso" : "Egreso"
      }])

      if (error) throw error

      toast.success("Transacción agregada correctamente")
      setIsModalOpen(false)
      window.location.reload() // Recargamos para ver la nueva fila
    } catch (error: any) {
      toast.error("Error al guardar: " + error.message)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} mobileOpen={mobileSidebarOpen} onMobileOpenChange={setMobileSidebarOpen} sidebarColor={theme.sidebar_color} />

      <div className={cn("transition-all duration-300", "lg:ml-64", sidebarCollapsed && "lg:ml-16")}>
        <TopBar userName={profile ? `${profile.nombres} ${profile.apellidos}` : "Usuario"} avatarUrl={profile?.avatar_url} onMenuClick={() => setMobileSidebarOpen(true)} />

        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: theme.text_color }}>Transacciones</h1>
              <p className="text-muted-foreground">Administra todas tus transacciones</p>
            </div>

            {/* MODAL PARA NUEVA TRANSACCIÓN */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2" style={{ backgroundColor: theme.primary_color }}>
                  <Plus className="h-4 w-4" /> Nueva Transacción
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white rounded-2xl">
                <DialogHeader>
                  <DialogTitle>Agregar Movimiento Manual</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Descripción</Label>
                    <Input placeholder="Ej. Pago de arriendo" value={nuevaTrans.descripcion} onChange={(e) => setNuevaTrans({...nuevaTrans, descripcion: e.target.value})} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Monto (usa negativo para gastos)</Label>
                    <Input type="number" placeholder="Ej. -50000" value={nuevaTrans.monto} onChange={(e) => setNuevaTrans({...nuevaTrans, monto: e.target.value})} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Categoría</Label>
                    <Input placeholder="Ej. Hogar" value={nuevaTrans.categoria} onChange={(e) => setNuevaTrans({...nuevaTrans, categoria: e.target.value})} />
                  </div>
                </div>
                <Button onClick={handleGuardarManual} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                  Guardar Transacción
                </Button>
              </DialogContent>
            </Dialog>
          </div>

          <TransactionsTable cardColor={theme.card_color} textColor={theme.text_color} userCedula={profile?.cedula} />
        </main>
      </div>
    </div>
  )
}

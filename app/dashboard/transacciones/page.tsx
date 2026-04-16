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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function TransaccionesPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
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

  const handleGuardarManual = async () => {
    try {
      if (!nuevaTrans.descripcion || !nuevaTrans.monto) {
        toast.error("Por favor, llena la descripción y el monto")
        return
      }

      const { error } = await supabase.from("transacciones").insert([{
        user_id: profile?.cedula,
        descripcion: nuevaTrans.descripcion,
        monto: parseFloat(nuevaTrans.monto),
        categoria: nuevaTrans.categoria || "Manual",
        fecha: nuevaTrans.fecha,
        tipo: parseFloat(nuevaTrans.monto) >= 0 ? "Ingreso" : "Egreso"
      }])

      if (error) throw error

      toast.success("Transacción registrada con éxito")
      setIsModalOpen(false)
      setNuevaTrans({ descripcion: "", monto: "", categoria: "", fecha: new Date().toISOString().split('T')[0] })
      window.location.reload()
    } catch (error: any) {
      toast.error("Error: " + error.message)
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

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                  <Plus className="h-4 w-4" /> Nueva Transacción
                </Button>
              </DialogTrigger>
              {/* MEJORA: Fondo oscuro y bordes para legibilidad */}
              <DialogContent className="bg-[#121212] border-zinc-800 text-white sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="text-emerald-500 text-xl font-bold">Agregar Movimiento Manual</DialogTitle>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Descripción</Label>
                    <Input 
                      className="bg-zinc-900 border-zinc-700 text-white focus:border-emerald-500"
                      placeholder="Ej. Pago de arriendo" 
                      value={nuevaTrans.descripcion} 
                      onChange={(e) => setNuevaTrans({...nuevaTrans, descripcion: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Monto (Negativo para gastos)</Label>
                    <Input 
                      type="number" 
                      className="bg-zinc-900 border-zinc-700 text-white focus:border-emerald-500"
                      placeholder="Ej. -50000" 
                      value={nuevaTrans.monto} 
                      onChange={(e) => setNuevaTrans({...nuevaTrans, monto: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Categoría</Label>
                    <Input 
                      className="bg-zinc-900 border-zinc-700 text-white focus:border-emerald-500"
                      placeholder="Ej. Alimentación" 
                      value={nuevaTrans.categoria} 
                      onChange={(e) => setNuevaTrans({...nuevaTrans, categoria: e.target.value})} 
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleGuardarManual} 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black h-12 text-lg shadow-lg shadow-emerald-900/20"
                >
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

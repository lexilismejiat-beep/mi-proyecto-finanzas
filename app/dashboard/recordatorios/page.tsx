"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, BellRing } from "lucide-react"
import { toast } from "sonner"

export function ModalNuevoRecordatorio({ userCedula, onRefresh }: { userCedula: string, onRefresh: () => void }) {
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)

    const data = {
      titulo: formData.get("titulo"),
      monto: parseFloat(formData.get("monto") as string),
      fecha_vencimiento: formData.get("fecha"),
      recordar_dias_antes: parseInt(formData.get("dias") as string), // <--- Captura la antelación
      frecuencia: formData.get("frecuencia"),
      categoria: formData.get("categoria"),
      user_id: userCedula
    }

    const { error } = await supabase.from("recordatorios").insert([data])

    if (error) {
      toast.error("Error al guardar")
    } else {
      toast.success("Recordatorio programado. ¡El bot te avisará!")
      setOpen(false)
      onRefresh() // Recarga la lista de la página
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
          <Plus size={18} /> Nuevo Recordatorio
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#121212] border-white/10 text-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BellRing className="text-emerald-500" /> Programar Pago
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>¿Qué vas a pagar?</Label>
            <Input name="titulo" placeholder="Ej: Internet Claro" className="bg-white/5 border-white/10" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Monto</Label>
              <Input name="monto" type="number" placeholder="89000" className="bg-white/5 border-white/10" required />
            </div>
            <div className="space-y-2">
              <Label>Fecha de vencimiento</Label>
              <Input name="fecha" type="date" className="bg-white/5 border-white/10" required />
            </div>
          </div>

          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg space-y-2">
            <Label className="text-emerald-400">Configurar Alerta</Label>
            <div className="flex items-center gap-3">
              <span className="text-sm">Avisarme</span>
              <Input 
                name="dias" 
                type="number" 
                defaultValue="3" 
                className="w-20 bg-black/40 border-emerald-500/30 text-center" 
                min="0"
              />
              <span className="text-sm text-gray-400">días antes.</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Frecuencia</Label>
              <Select name="frecuencia" defaultValue="Mensual">
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#121212] border-white/10 text-white">
                  <SelectItem value="Mensual">Mensual</SelectItem>
                  <SelectItem value="Único">Una sola vez</SelectItem>
                  <SelectItem value="Anual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Input name="categoria" placeholder="Servicios" className="bg-white/5 border-white/10" />
            </div>
          </div>

          <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 mt-4" disabled={loading}>
            {loading ? "Guardando..." : "Activar Recordatorio"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

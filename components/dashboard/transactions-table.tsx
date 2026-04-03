"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Edit2, Save, X, Loader2 } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { toast } from "sonner"

export function TransactionsTable({ 
  cardColor, 
  textColor, 
  userCedula 
}: { 
  cardColor?: string, 
  textColor?: string,
  userCedula?: string 
}) {
  const [transactions, setTransactions] = useState<any[]>([])
  const [editingTransaction, setEditingTransaction] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClient()

  const fetchTransactions = async () => {
    if (!userCedula) return
    const { data, error } = await supabase
      .from("transacciones")
      .select("*")
      .eq("user_id", userCedula)
      .order("created_at", { ascending: false })
      .limit(8)
    
    if (!error && data) setTransactions(data)
  }

  useEffect(() => {
    fetchTransactions()
  }, [userCedula])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from("transacciones")
        .update({
          monto: editingTransaction.monto,
          categoria: editingTransaction.categoria,
          descripcion: editingTransaction.descripcion,
          tipo: editingTransaction.tipo
        })
        .eq("id", editingTransaction.id)

      if (error) throw error
      
      toast.success("Transacción actualizada")
      setEditingTransaction(null)
      fetchTransactions() // Recargamos la tabla
    } catch (error: any) {
      toast.error("Error al actualizar: " + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const getCategoryStyle = (category: string) => {
    const cat = category?.toLowerCase().trim()
    const styles: { [key: string]: string } = {
      nómina: "bg-emerald-100 text-emerald-700 border-emerald-200",
      comida: "bg-orange-100 text-orange-700 border-orange-200",
      trading: "bg-blue-100 text-blue-700 border-blue-200",
      mercado: "bg-purple-100 text-purple-700 border-purple-200",
      ocio: "bg-indigo-100 text-indigo-700 border-indigo-200",
    }
    return styles[cat] || "bg-gray-100 text-gray-700 border-gray-200"
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <>
      <Card style={{ backgroundColor: cardColor, color: textColor }}>
        <CardHeader>
          <CardTitle>Transacciones Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead style={{ color: textColor }}>Fecha</TableHead>
                <TableHead style={{ color: textColor }}>Monto</TableHead>
                <TableHead style={{ color: textColor }}>Categoría</TableHead>
                <TableHead style={{ color: textColor }}>Descripción</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center opacity-50 py-10">
                    No hay transacciones aún
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-xs">
                      {new Date(t.created_at).toLocaleDateString('es-CO')}
                    </TableCell>
                    <TableCell className={cn(
                      "font-bold",
                      t.tipo?.trim() === "Ingreso" ? "text-emerald-500" : "text-red-500"
                    )}>
                      {t.tipo?.trim() === "Ingreso" ? "+" : "-"} {formatCurrency(t.monto)}
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "px-2 py-1 rounded-md text-[10px] font-bold border",
                        getCategoryStyle(t.categoria)
                      )}>
                        {t.categoria || "General"}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate text-sm">
                      {t.descripcion}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => setEditingTransaction(t)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* MODAL PARA EDITAR */}
      <Sheet open={!!editingTransaction} onOpenChange={() => setEditingTransaction(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Editar Transacción</SheetTitle>
            <SheetDescription>Realiza los cambios necesarios y guarda.</SheetDescription>
          </SheetHeader>
          
          {editingTransaction && (
            <form onSubmit={handleUpdate} className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Input 
                  value={editingTransaction.descripcion} 
                  onChange={(e) => setEditingTransaction({...editingTransaction, descripcion: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Monto</Label>
                <Input 
                  type="number"
                  value={editingTransaction.monto} 
                  onChange={(e) => setEditingTransaction({...editingTransaction, monto: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Input 
                  value={editingTransaction.categoria} 
                  onChange={(e) => setEditingTransaction({...editingTransaction, categoria: e.target.value})}
                />
              </div>
              
              <div className="pt-4 flex gap-2">
                <Button type="submit" className="flex-1" disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Guardar Cambios
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditingTransaction(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </form>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}

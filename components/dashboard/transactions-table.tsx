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

// AGREGAMOS userCedula a las propiedades
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
  const supabase = createClient()

  const getCategoryStyle = (category: string) => {
    const cat = category?.toLowerCase().trim()
    const styles: { [key: string]: string } = {
      nómina: "bg-emerald-100 text-emerald-700 border-emerald-200",
      comida: "bg-orange-100 text-orange-700 border-orange-200",
      trading: "bg-blue-100 text-blue-700 border-blue-200",
      cena: "bg-orange-100 text-orange-700 border-orange-200",
      mercado: "bg-purple-100 text-purple-700 border-purple-200",
      compra: "bg-pink-100 text-pink-700 border-pink-200",
      ocio: "bg-indigo-100 text-indigo-700 border-indigo-200",
      general: "bg-slate-100 text-slate-700 border-slate-200",
    }
    return styles[cat] || "bg-gray-100 text-gray-700 border-gray-200"
  }

  useEffect(() => {
    const fetchTransactions = async () => {
      // Si no hay cédula aún, no buscamos nada
      if (!userCedula) return

      const { data, error } = await supabase
        .from("transacciones")
        .select("*")
        .eq("user_id", userCedula) // <--- FILTRAMOS POR TU CÉDULA
        .order("created_at", { ascending: false })
        .limit(8)
      
      if (!error && data) {
        setTransactions(data)
      }
    }
    fetchTransactions()
  }, [supabase, userCedula]) // Se actualiza cuando cambia la cédula

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center opacity-50 py-10">
                  No hay transacciones aún para la cédula {userCedula}
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
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

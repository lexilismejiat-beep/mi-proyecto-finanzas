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

export function TransactionsTable({ cardColor, textColor }: { cardColor?: string, textColor?: string }) {
  const [transactions, setTransactions] = useState<any[]>([])
  const supabase = createClient()

  // Función de colores ajustada a tus datos reales
  const getCategoryStyle = (category: string) => {
    const cat = category?.toLowerCase().trim()
    const styles: { [key: string]: string } = {
      sueldo: "bg-emerald-100 text-emerald-700 border-emerald-200",
      trading: "bg-blue-100 text-blue-700 border-blue-200",
      cena: "bg-orange-100 text-orange-700 border-orange-200",
      mercado: "bg-purple-100 text-purple-700 border-purple-200",
      compra: "bg-pink-100 text-pink-700 border-pink-200",
      ocio: "bg-indigo-100 text-indigo-700 border-indigo-200",
    }
    return styles[cat] || "bg-gray-100 text-gray-700 border-gray-200"
  }

  useEffect(() => {
    const fetchTransactions = async () => {
      const { data } = await supabase
        .from("transacciones")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(8)
      if (data) setTransactions(data)
    }
    fetchTransactions()
  }, [supabase])

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
            {transactions.map((t) => (
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
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

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

interface Transaction {
  id: number
  created_at: string
  monto: number
  tipo: string
  categoria: string
  descripcion: string
}

export function TransactionsTable({ cardColor, textColor }: { cardColor?: string, textColor?: string }) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const supabase = createClient()

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
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center opacity-50">No hay transacciones aún</TableCell>
              </TableRow>
            ) : (
              transactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="text-xs">
                    {new Date(t.created_at).toLocaleDateString('es-CO')}
                  </TableCell>
                  <TableCell className={cn(
                    "font-medium",
                    t.tipo === "Ingreso" ? "text-emerald-500" : "text-red-500"
                  )}>
                    {t.tipo === "Ingreso" ? "+" : "-"} {formatCurrency(t.monto)}
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-1 rounded-full bg-secondary text-[10px]">
                      {t.categoria || "General"}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate">
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

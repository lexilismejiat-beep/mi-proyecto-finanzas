"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export default function PagosDashboardPage() {
  const [pagos, setPagos] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    const fetchPagos = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from("payments")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
        
        setPagos(data || [])
      }
    }
    fetchPagos()
  }, [])

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Gestión de Suscripción</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold mb-4">Historial de Transacciones</h2>
        
        {pagos.length === 0 ? (
          <p className="text-gray-500">No tienes pagos registrados aún.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="py-2">Fecha</th>
                  <th className="py-2">Monto</th>
                  <th className="py-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {pagos.map((pago) => (
                  <tr key={pago.id} className="border-b dark:border-gray-700 last:border-0">
                    <td className="py-3">{new Date(pago.created_at).toLocaleDateString()}</td>
                    <td className="py-3">${pago.amount} USD</td>
                    <td className="py-3">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                        {pago.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

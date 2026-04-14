'use client'
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function PagosSection() {
  const supabase = createClientComponentClient()
  const [payments, setPayments] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Traer perfil para ver estado activo/inactivo
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setProfile(prof)
        
        // Traer historial de pagos
        const { data: pays } = await supabase.from('payments').select('*').order('created_at', { ascending: false })
        setPayments(pays || [])
      }
    }
    fetchData()
  }, [])

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm">
      <h2 className="text-2xl font-bold mb-6">Mi Suscripción</h2>
      
      {/* Tarjeta de Estado Actual */}
      <div className="mb-8 p-4 border rounded-lg flex justify-between items-center bg-gray-50">
        <div>
          <p className="text-sm text-gray-500 uppercase font-semibold">Estado Actual</p>
          <span className={`px-3 py-1 rounded-full text-sm font-bold ${
            profile?.subscription_status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {profile?.subscription_status === 'active' ? 'ACTIVO' : 'INACTIVO'}
          </span>
          <p className="text-xs text-gray-400 mt-2 italic">
            Tu acceso vence el: {new Date(profile?.trial_ends_at).toLocaleDateString()}
          </p>
        </div>
        
        {profile?.subscription_status !== 'active' && (
          <button 
            onClick={() => window.location.href = '/checkout'}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
          >
            Activar Ahora
          </button>
        )}
      </div>

      {/* Historial de Pagos */}
      <h3 className="text-lg font-semibold mb-4">Historial de Pagos</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b text-gray-400 text-sm">
              <th className="pb-2">Fecha</th>
              <th className="pb-2">Monto</th>
              <th className="pb-2">Estado</th>
              <th className="pb-2">Referencia</th>
            </tr>
          </thead>
          <tbody>
            {payments.length > 0 ? payments.map((p) => (
              <tr key={p.id} className="border-b text-sm">
                <td className="py-3">{new Date(p.created_at).toLocaleDateString()}</td>
                <td className="py-3">${p.amount} USD</td>
                <td className="py-3 text-green-600 font-medium">{p.status}</td>
                <td className="py-3 text-gray-400 font-mono text-xs">{p.wompi_id}</td>
              </tr>
            )) : (
              <tr><td colSpan={4} className="py-4 text-center text-gray-400">No hay pagos registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

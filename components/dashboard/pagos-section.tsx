'use client'
import { useEffect, useState, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Script from 'next/script'

export default function PagosSection() {
  const supabase = createClientComponentClient()
  const [payments, setPayments] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setProfile(prof)
        const { data: pays } = await supabase.from('payments').select('*').order('created_at', { ascending: false })
        setPayments(pays || [])
      }
    }
    fetchData()
  }, [])

  const handlePagoWompi = async () => {
    setLoading(true)
    // @ts-ignore
    const checkout = new WidgetCheckout({
      currency: 'COP',
      amountInCents: 2800000, // Ajusta al precio que quieras en centavos
      reference: profile.id + '_' + Date.now(),
      publicKey: process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY,
      redirectUrl: window.location.href, // Vuelve aquí mismo
    })

    checkout.open((result: any) => {
      const transaction = result.transaction
      if (transaction.status === 'APPROVED') {
        window.location.reload() // Recarga para ver el estado activo
      }
      setLoading(false)
    })
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm text-gray-900">
      {/* Cargamos el script de Wompi */}
      <Script 
        src="https://checkout.wompi.co/widget.js" 
        strategy="beforeInteractive" 
      />

      <h2 className="text-2xl font-bold mb-6">Mi Suscripción</h2>
      
      <div className="mb-8 p-4 border rounded-lg flex justify-between items-center bg-gray-50">
        <div>
          <p className="text-sm text-gray-500 uppercase font-semibold">Estado Actual</p>
          <span className={`px-3 py-1 rounded-full text-sm font-bold ${
            profile?.subscription_status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {profile?.subscription_status === 'active' ? 'ACTIVO' : 'INACTIVO'}
          </span>
          <p className="text-xs text-gray-400 mt-2 italic">
            Tu acceso vence el: {profile?.trial_ends_at ? new Date(profile.trial_ends_at).toLocaleDateString() : 'Pendiente'}
          </p>
        </div>
        
        {profile?.subscription_status !== 'active' && (
          <button 
            onClick={handlePagoWompi}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition disabled:bg-gray-400"
          >
            {loading ? 'Cargando...' : 'Activar Ahora'}
          </button>
        )}
      </div>

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
                <td className="py-3">${p.amount}</td>
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

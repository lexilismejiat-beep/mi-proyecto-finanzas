'use client'
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Script from 'next/script'

export default function CheckoutPage() {
  const supabase = createClientComponentClient()
  const [user, setUser] = useState<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase])

  const openWompi = () => {
    if (!user) return alert("Inicia sesión primero")
    
    // @ts-ignore
    const checkout = new WidgetCheckout({
      currency: 'USD',
      amountInCents: 700,
      reference: `${user.id}_${Date.now()}`,
      publicKey: process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY,
      redirectUrl: `${window.location.origin}/dashboard`,
    })

    checkout.open((result: any) => {
      if (result.transaction.status === 'APPROVED') {
        window.location.href = '/dashboard'
      }
    })
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <Script 
        src="https://checkout.wompi.co/widget.js" 
        strategy="afterInteractive"
        onLoad={() => setIsLoaded(true)}
      />

      <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center border border-gray-700">
        <h1 className="text-3xl font-bold mb-4">Membresía Expirada</h1>
        <p className="text-gray-400 mb-8">
          Tu tiempo de prueba ha terminado. Suscríbete por <b>$7 USD</b> para seguir gestionando tus finanzas.
        </p>

        <button
          onClick={openWompi}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl transition-all transform hover:scale-105"
        >
          Pagar Suscripción
        </button>
        
        {!isLoaded && <p className="text-xs text-gray-500 mt-4">Cargando pasarela de pago...</p>}
      </div>
    </div>
  )
}

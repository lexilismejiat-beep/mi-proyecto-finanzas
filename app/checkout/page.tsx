'use client'
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Script from 'next/script'

export default function CheckoutPage() {
  const supabase = createClientComponentClient()
  const [user, setUser] = useState<any>(null)
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase])

  const handlePago = () => {
    if (!user) return alert("Por favor, inicia sesión en /auth/login")
    if (!isScriptLoaded) return alert("Cargando Wompi... espera un segundo.")

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
    <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4 text-black">
      <Script 
        src="https://checkout.wompi.co/widget.js" 
        strategy="afterInteractive"
        onLoad={() => setIsScriptLoaded(true)}
      />

      <div className="bg-gray-50 p-8 rounded-2xl shadow-xl max-w-md w-full text-center border">
        <h1 className="text-2xl font-bold mb-4">Suscripción Requerida</h1>
        <p className="text-gray-600 mb-8">
          Tu prueba gratuita ha terminado. Activa tu cuenta por <b>$7 USD</b> mensuales.
        </p>

        <button
          onClick={handlePago}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all"
        >
          Pagar con Wompi
        </button>
      </div>
    </div>
  )
}

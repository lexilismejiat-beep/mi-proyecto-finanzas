'use client'
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Script from 'next/script' // Importamos el componente correcto

export default function CheckoutPage() {
  const supabase = createClientComponentClient()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase])

  const openWompiWidget = () => {
    if (!user) return alert("Debes estar logueado")

    // @ts-ignore
    const checkout = new WidgetCheckout({
      currency: 'USD',
      amountInCents: 700,
      reference: user.id,
      publicKey: process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY,
      // Usamos window.location.origin para que funcione en local y en vercel automáticamente
      redirectUrl: `${window.location.origin}/dashboard`, 
    })

    checkout.open((result: any) => {
      const transaction = result.transaction
      if (transaction.status === 'APPROVED') {
        alert('¡Pago exitoso! Redirigiendo...')
        window.location.href = '/dashboard'
      }
    })
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      {/* Cargamos el script de Wompi correctamente */}
      <Script 
        src="https://checkout.wompi.co/widget.js" 
        strategy="beforeInteractive" 
      />

      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4">Tu tiempo de prueba ha terminado</h1>
        <p className="text-gray-600 mb-6">
          Para continuar gestionando tus finanzas y acceder a la futura APK, suscríbete por solo **$7 USD** al mes.
        </p>

        <button
          onClick={openWompiWidget}
          className="w-full bg-blue-600 text-white font-bold py-3 rounded-md hover:bg-blue-700 transition"
        >
          Pagar $7 USD con Wompi
        </button>
      </div>
    </div>
  )
}

'use client'
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

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

    // @ts-ignore (El script de Wompi se carga globalmente)
    const checkout = new WidgetCheckout({
      currency: 'USD',
      amountInCents: 700, // $7.00 USD (Wompi maneja centavos)
      reference: user.id, // ¡CRÍTICO! Enviamos el ID del usuario para el Webhook
      publicKey: process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY,
      redirectUrl: 'https://tu-app.vercel.app/dashboard', // A donde vuelve tras pagar
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
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4">Tu tiempo de prueba ha terminado</h1>
        <p className="text-gray-600 mb-6">
          Para continuar gestionando tus finanzas y acceder a la futura APK, suscríbete por solo **$7 USD** al mes.
        </p>
        
        {/* Script de Wompi se carga aquí */}
        <script
          src="https://checkout.wompi.co/widget.js"
          async
        ></script>

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

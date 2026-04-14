import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Usa Service Role para saltar el RLS
  )

  try {
    const body = await request.json()
    const { data } = body
    const transaction = data.transaction

    if (transaction.status === 'APPROVED') {
      // La referencia que enviamos es "IDUSUARIO_TIMESTAMP"
      const userId = transaction.reference.split('_')[0]

      // 1. Actualizar Perfil
      await supabase
        .from('profiles')
        .update({ 
          subscription_status: 'active',
          trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // +30 días
        })
        .eq('id', userId)

      // 2. Guardar en historial de pagos
      await supabase.from('payments').insert({
        user_id: userId,
        amount: transaction.amount_in_cents / 100,
        status: 'APPROVED',
        wompi_id: transaction.id
      })
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (err) {
    return NextResponse.json({ error: 'Webhook Error' }, { status: 400 })
  }
}

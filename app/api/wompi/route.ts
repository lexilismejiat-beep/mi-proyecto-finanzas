import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

// Inicializamos Supabase con la Service Role Key (necesaria para saltar el RLS y actualizar el perfil)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { data, event, signature } = body

    // 1. VALIDACIÓN DE SEGURIDAD (Opcional pero recomendada)
    // Wompi envía una firma para asegurar que el mensaje viene de ellos.
    // Por ahora vamos a la lógica principal:

    if (event === 'transaction.updated') {
      const transaction = data.transaction
      const status = transaction.status // 'APPROVED', 'DECLINED', 'VOIDED'
      const userId = transaction.reference // Usaremos la 'reference' de Wompi para pasar el ID del usuario

      if (status === 'APPROVED') {
        // 2. ACTUALIZAR SUPABASE
        // Si el pago es de $7 USD, extendemos 30 días o marcamos como activo
        const { error } = await supabaseAdmin
          .from('profiles')
          .update({ 
            subscription_status: 'active',
            // Opcional: podrías actualizar trial_ends_at sumándole 30 días a la fecha actual
            trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          })
          .eq('id', userId)

        if (error) throw error

        return NextResponse.json({ message: 'Perfil actualizado con éxito' }, { status: 200 })
      }
    }

    return NextResponse.json({ message: 'Evento recibido' }, { status: 200 })
  } catch (error: any) {
    console.error('Error en Webhook:', error.message)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

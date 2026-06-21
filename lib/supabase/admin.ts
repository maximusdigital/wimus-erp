import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase Admin Client mit Service-Role-Key.
 *
 * ⚠️ NUR serverseitig verwenden (app/api/, Server Actions, Webhooks).
 * Der Service-Role-Key UMGEHT RLS – niemals im Client-/Frontend-Code importieren!
 */
export function createAdminClient() {
  if (typeof window !== 'undefined') {
    throw new Error(
      'createAdminClient() darf NUR serverseitig aufgerufen werden (Service-Role-Key).'
    )
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )
}

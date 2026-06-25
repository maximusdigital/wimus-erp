import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Supabase Client für Server Components, Server Actions und Route Handler.
 * Nutzt den ANON-Key + RLS (Mandanten-Isolation greift automatisch).
 *
 * Next 16: `cookies()` ist async → diese Funktion ist async und MUSS awaited werden:
 *   const supabase = await createServerClient()
 */
export async function createServerClient() {
  const cookieStore = await cookies()

  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Cutover: Standard-Schema ist wimus. Reste auf public werden je Query
      // explizit via .schema("public") angesprochen (user_mandanten via RLS,
      // asset_register/Inventar P5).
      db: { schema: "wimus" },
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Aufruf aus einer Server Component: Cookies können hier nicht gesetzt
            // werden. Die Session wird stattdessen im proxy.ts aktualisiert.
          }
        },
      },
    }
  )
}

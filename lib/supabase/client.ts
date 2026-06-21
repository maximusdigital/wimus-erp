import { createBrowserClient } from '@supabase/ssr'

/**
 * Supabase Client für den Browser / Client Components.
 * Nutzt ausschließlich den öffentlichen ANON-Key.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

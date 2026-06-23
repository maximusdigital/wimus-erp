import type { createServerClient } from "@/lib/supabase/server"
import { citytaxBetrag } from "@/lib/utils/citytax"

/**
 * Leitet objekt_id, keybox_pin (statisch aus Einheit) und city_tax serverseitig
 * aus der gewählten Einheit ab. Wird von POST und PATCH der Buchungs-API genutzt.
 */
export async function ableiteEinheitFelder(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  data: {
    einheit_id: string | null
    personen: number | null
    checkin: string | null
    checkout: string | null
  }
): Promise<{
  objekt_id: string | null
  keybox_pin: string | null
  city_tax: number | null
}> {
  if (!data.einheit_id) {
    return { objekt_id: null, keybox_pin: null, city_tax: null }
  }

  const { data: einheit } = await supabase
    .from("einheiten")
    .select("objekt_id, keybox_pin_statisch")
    .eq("id", data.einheit_id)
    .maybeSingle()

  const objekt_id = (einheit?.objekt_id as string | null) ?? null
  const keybox_pin = (einheit?.keybox_pin_statisch as string | null) ?? null

  let city_tax: number | null = null
  if (objekt_id) {
    const { data: objekt } = await supabase
      .from("objekte")
      .select("ort")
      .eq("id", objekt_id)
      .maybeSingle()

    city_tax = citytaxBetrag({
      stadt: (objekt?.ort as string | null) ?? null,
      personen: data.personen,
      checkin: data.checkin,
      checkout: data.checkout,
    })
  }

  return { objekt_id, keybox_pin, city_tax }
}

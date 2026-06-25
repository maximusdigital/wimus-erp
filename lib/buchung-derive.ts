import type { createServerClient } from "@/lib/supabase/server"
import { citytaxBetrag } from "@/lib/utils/citytax"

/**
 * Leitet keybox_pin (statisch aus Einheit) und citytax_betrag serverseitig aus
 * der gewählten Einheit ab. Wird von POST und PATCH der Buchungs-API genutzt.
 *
 * wimus.buchungen führt keine objekt_id mehr – das Objekt (für die CityTax-Stadt)
 * wird weiterhin über die Einheit aufgelöst.
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
  keybox_pin: string | null
  citytax_betrag: number | null
}> {
  if (!data.einheit_id) {
    return { keybox_pin: null, citytax_betrag: null }
  }

  const { data: einheit } = await supabase
    .schema("wimus")
    .from("einheiten")
    .select("objekt_id, keybox_pin_statisch")
    .eq("id", data.einheit_id)
    .maybeSingle()

  const objekt_id = (einheit?.objekt_id as string | null) ?? null
  const keybox_pin = (einheit?.keybox_pin_statisch as string | null) ?? null

  let citytax_betrag: number | null = null
  if (objekt_id) {
    const { data: objekt } = await supabase
      .schema("wimus")
      .from("objekte")
      .select("stadt")
      .eq("id", objekt_id)
      .maybeSingle()

    citytax_betrag = citytaxBetrag({
      stadt: (objekt?.stadt as string | null) ?? null,
      personen: data.personen,
      checkin: data.checkin,
      checkout: data.checkout,
    })
  }

  return { keybox_pin, citytax_betrag }
}

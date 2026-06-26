import { getActiveMandant, getUserMandanten } from "@/lib/mandanten"

/** Aktive Mandant-ID (für Inserts). Null, wenn kein Mandant verfügbar. */
export async function activeMandantId(): Promise<string | null> {
  const mandanten = await getUserMandanten()
  const active = await getActiveMandant(mandanten)
  return active?.id ?? null
}

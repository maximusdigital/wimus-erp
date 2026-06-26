/** Lieferant/Kreditor (Spec 0002, wimus.lieferanten). */

export type Lieferant = {
  id: string
  created_at: string
  updated_at: string
  mandant_id: string
  firma_id: string | null
  name: string
  alias: string[] | null
  ustid: string | null
  iban: string | null
  standard_gewerk: string | null
  standard_konto: string | null
  aktiv: boolean
}

export type LieferantMitFirma = Lieferant & {
  firma?: { id: string; name: string; kuerzel: string | null } | null
}

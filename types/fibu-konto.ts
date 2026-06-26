/** FiBu-Konto / Kontenrahmen (Spec 0002, wimus.fibu_konten). */

export type FibuKonto = {
  id: string
  created_at: string
  updated_at: string
  mandant_id: string
  firma_id: string | null
  kontonummer: string
  bezeichnung: string
  kontoart: string | null
  skr_basis: string | null
  ust_automatik: string | null
  aktiv: boolean
}

export type FibuKontoMitFirma = FibuKonto & {
  firma?: { id: string; name: string; kuerzel: string | null } | null
}

export const KONTOARTEN = ["soll", "haben", "automatik"] as const
export const KONTOART_LABELS: Record<string, string> = {
  soll: "Soll",
  haben: "Haben",
  automatik: "Automatik",
}

export const SKR_BASEN = ["skr03", "skr04", "euer"] as const
export const SKR_BASIS_LABELS: Record<string, string> = {
  skr03: "SKR03",
  skr04: "SKR04",
  euer: "EÜR",
}

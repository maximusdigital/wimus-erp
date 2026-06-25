/** Kontakt – Datentyp + Auswahl-Konstanten (clientseitig nutzbar). */

export type Kontakt = {
  id: string
  created_at: string
  updated_at: string
  mandant_id: string
  firma_id: string | null
  kontakt_typ: string
  anrede: string | null
  vorname: string | null
  nachname: string | null
  firmenname: string | null
  rechtsform: string | null
  strasse: string | null
  hausnummer: string | null
  plz: string | null
  stadt: string | null
  land: string | null
  email: string | null
  telefon_mobil: string | null
  telefon_festnetz: string | null
  iban: string | null
  bic: string | null
  debitor_nr: string | null
  kreditor_nr: string | null
  zahlungsziel_tage: number | null
  ist_mieter: boolean
  ist_eigentuemer: boolean
  ist_dienstleister: boolean
  ist_makler: boolean
  ist_tippgeber: boolean
  ist_bank: boolean
  dsgvo_datenweitergabe: boolean
  sprache: string | null
  aktiv: boolean
  portal_aktiv: boolean | null
  portal_aktiviert_am: string | null
}

// Person vs. Firma – steuert sichtbare Felder im Formular.
export const KONTAKT_TYP = ["person", "firma"] as const

export const KONTAKT_TYP_LABELS: Record<string, string> = {
  person: "Person",
  firma: "Firma",
}

/** Die sechs Rollen-Flags (ist_*) mit deutschen Labels. */
export const ROLLEN = [
  { key: "ist_mieter", label: "Mieter" },
  { key: "ist_eigentuemer", label: "Eigentümer" },
  { key: "ist_dienstleister", label: "Dienstleister" },
  { key: "ist_makler", label: "Makler" },
  { key: "ist_tippgeber", label: "Tippgeber" },
  { key: "ist_bank", label: "Bank" },
] as const

export type RollenKey = (typeof ROLLEN)[number]["key"]

// Design System 40 / Datenmodell v5: Anrede ausschliesslich Herr/Frau/Firma/Keine.
export const ANREDEN = ["Herr", "Frau", "Firma", "Keine"] as const

// Sprache (Kontakt-Korrespondenz).
export const SPRACHEN = ["de", "en", "ru"] as const

export const SPRACHE_LABELS: Record<string, string> = {
  de: "Deutsch",
  en: "Englisch",
  ru: "Russisch",
}

/**
 * Anzeigename: Firmenname oder Vor-/Nachname, Fallback E-Mail.
 *
 * Akzeptiert sowohl `firmenname` (wimus-Schema) als auch `firma`
 * (noch nicht migrierte Embeds aus public.kontakte via vertraege/buchungen/…).
 */
export function kontaktName(k: {
  firmenname?: string | null
  firma?: string | null
  vorname: string | null
  nachname: string | null
  email?: string | null
}): string {
  const person = [k.vorname, k.nachname].filter(Boolean).join(" ").trim()
  return k.firmenname || k.firma || person || k.email || "Kontakt"
}

/** Aktive Rollen-Labels eines Kontakts (für Badge-Anzeige). */
export function kontaktRollen(k: Partial<Record<RollenKey, boolean>>): string[] {
  return ROLLEN.filter((r) => k[r.key]).map((r) => r.label)
}

/** Vertrag – Datentyp + Auswahl-Konstanten (clientseitig nutzbar). */

export type Vertrag = {
  id: string
  created_at: string
  updated_at: string
  mandant_id: string
  einheit_id: string | null
  objekt_id: string | null
  mieter_id: string | null
  vertragsart: string | null
  vertragsnummer: string | null
  beginn: string | null
  ende: string | null
  unbefristet: boolean
  grundmiete: number | null
  bk_pauschale: number | null
  heizkosten_pauschale: number | null
  strompauschale: number | null
  faelligkeitsregel: string | null
  kdu_id: string | null
  kaution_id: string | null
  status: string
}

/** Vertrag inkl. verknüpfter Kurzinfos (Supabase-Embeds mit Alias). */
export type VertragMitRelationen = Vertrag & {
  objekt: { kuerzel: string; bezeichnung: string | null } | null
  einheit: { verwendungszweck_code: string | null; bezeichnung: string | null } | null
  mieter: { vorname: string | null; nachname: string | null; firma: string | null } | null
}

/** Auswahloptionen für das Vertrags-Formular. */
export type ObjektRef = { id: string; kuerzel: string; bezeichnung: string | null }
export type EinheitRef = {
  id: string
  objekt_id: string
  verwendungszweck_code: string | null
  bezeichnung: string | null
}
export type KontaktRef = {
  id: string
  typ: string
  vorname: string | null
  nachname: string | null
  firma: string | null
}

export const VERTRAGSARTEN = ["V01", "V02", "V03", "V04"] as const

// Vertragsarten gem. Spec v5, Kap. 4.5.
export const VERTRAGSART_LABELS: Record<string, string> = {
  V01: "V01 – Standard (Wohnraum)",
  V02: "V02 – Befristet",
  V03: "V03 – KZV (7% USt, Beds24)",
  V04: "V04 – Gewerbe",
}

export const VERTRAG_STATUS = [
  "entwurf",
  "aktiv",
  "gekuendigt",
  "beendet",
] as const

export const VERTRAG_STATUS_LABELS: Record<string, string> = {
  entwurf: "Entwurf",
  aktiv: "Aktiv",
  gekuendigt: "Gekündigt",
  beendet: "Beendet",
}

/** Badge-Variante je Status. */
export const VERTRAG_STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  entwurf: "secondary",
  aktiv: "default",
  gekuendigt: "destructive",
  beendet: "outline",
}

/** Warmmiete = Grundmiete + alle Pauschalen. */
export function warmmiete(v: {
  grundmiete: number | null
  bk_pauschale: number | null
  heizkosten_pauschale: number | null
  strompauschale: number | null
}): number | null {
  const parts = [
    v.grundmiete,
    v.bk_pauschale,
    v.heizkosten_pauschale,
    v.strompauschale,
  ]
  if (parts.every((p) => p == null)) return null
  return parts.reduce<number>((sum, p) => sum + (p ?? 0), 0)
}

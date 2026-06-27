/** Vorgang (P14) – Datentyp + Auswahl-Konstanten (clientseitig nutzbar). */

export type Vorgang = {
  id: string
  created_at: string
  updated_at: string
  mandant_id: string
  objekt_id: string | null
  einheit_id: string | null
  gemeldet_von: string | null
  handwerker_id: string | null
  typ: string | null
  prioritaet: string
  status: string
  kostentraeger: string | null
  massnahme_typ: string | null
  kosten_geschaetzt: number | null
  kosten_ist: number | null
  leistungsdatum: string | null
  aktenzeichen: string | null
  lfd_nr: number | null
  paperless_id: string | null
}

/** Embed-Form eines verknüpften Kontakts (Handwerker / Melder). */
export type VorgangKontaktRef = {
  vorname: string | null
  nachname: string | null
  firmenname: string | null
} | null

/** Vorgang inkl. verknüpfter Kurzinfos (Supabase-Embeds mit Alias). */
export type VorgangMitRelationen = Vorgang & {
  objekt: { kuerzel: string } | null
  einheit: {
    verwendungszweck_code: string | null
    bezeichnung: string | null
  } | null
  handwerker?: VorgangKontaktRef
  gemeldet?: VorgangKontaktRef
}

/** Auswahloptionen für das Vorgangs-Formular. */
export type ObjektRef = { id: string; kuerzel: string; bezeichnung: string | null }
export type EinheitRef = { id: string; objekt_id: string; label: string }
export type KontaktRef = {
  id: string
  vorname: string | null
  nachname: string | null
  firmenname: string | null
}

// ---------------------------------------------------------------------------
// Typ
// ---------------------------------------------------------------------------
export const VORGANG_TYPEN = [
  "schaden",
  "reparatur",
  "reinigung",
  "uebergabe",
  "wartung",
  "anfrage",
  "kuendigung",
  "sonstiges",
] as const

export const VORGANG_TYP_LABELS: Record<string, string> = {
  schaden: "Schaden",
  reparatur: "Reparatur",
  reinigung: "Reinigung",
  uebergabe: "Übergabe",
  wartung: "Wartung",
  anfrage: "Anfrage",
  kuendigung: "Kündigung",
  sonstiges: "Sonstiges",
}

/** Typen mit 1:1-Zusatztabelle (Engine-Erweiterung, Spec 0004). */
export const VORGANG_TYP_ERWEITERUNG = [
  "schaden",
  "reparatur",
  "reinigung",
  "uebergabe",
  "wartung",
] as const

// ---------------------------------------------------------------------------
// Priorität
// ---------------------------------------------------------------------------
// Werte müssen mit dem DB-CHECK (Migration 002) übereinstimmen:
// prioritaet IN ('notfall','hoch','normal','niedrig'). Früher fälschlich
// "kritisch" → verletzte die Constraint beim Insert (2026-06-27 korrigiert).
export const VORGANG_PRIORITAET = [
  "niedrig",
  "normal",
  "hoch",
  "notfall",
] as const

export const VORGANG_PRIORITAET_LABELS: Record<string, string> = {
  niedrig: "Niedrig",
  normal: "Normal",
  hoch: "Hoch",
  notfall: "Notfall",
}

export const VORGANG_PRIORITAET_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  niedrig: "outline",
  normal: "secondary",
  hoch: "default",
  notfall: "destructive",
}

/** Sortier-Rang der Priorität: notfall zuerst. */
export const VORGANG_PRIORITAET_RANG: Record<string, number> = {
  notfall: 0,
  hoch: 1,
  normal: 2,
  niedrig: 3,
}

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------
// Kanonischer Status-Flow (Spec 0004 / DB-CHECK Migration 018):
// offen → zugewiesen → in_arbeit → (wartet_extern) → erledigt → abgenommen;
// abgebrochen aus jedem offenen Status. "wartet" (alt) → "wartet_extern".
export const VORGANG_STATUS = [
  "offen",
  "zugewiesen",
  "in_arbeit",
  "wartet_extern",
  "erledigt",
  "abgenommen",
  "abgebrochen",
] as const

export const VORGANG_STATUS_LABELS: Record<string, string> = {
  offen: "Offen",
  zugewiesen: "Zugewiesen",
  in_arbeit: "In Arbeit",
  wartet_extern: "Wartet (extern)",
  erledigt: "Erledigt",
  abgenommen: "Abgenommen",
  abgebrochen: "Abgebrochen",
}

export const VORGANG_STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  offen: "default",
  zugewiesen: "secondary",
  in_arbeit: "secondary",
  wartet_extern: "outline",
  erledigt: "outline",
  abgenommen: "outline",
  abgebrochen: "destructive",
}

// ---------------------------------------------------------------------------
// Maßnahmen-Typ
// ---------------------------------------------------------------------------
export const MASSNAHME_TYPEN = [
  "reparatur",
  "wartung",
  "modernisierung",
  "instandhaltung",
  "sonstige",
] as const

export const MASSNAHME_TYP_LABELS: Record<string, string> = {
  reparatur: "Reparatur",
  wartung: "Wartung",
  modernisierung: "Modernisierung",
  instandhaltung: "Instandhaltung",
  sonstige: "Sonstige",
}

// ---------------------------------------------------------------------------
// Kostenträger
// ---------------------------------------------------------------------------
export const VORGANG_KOSTENTRAEGER = [
  "vermieter",
  "mieter",
  "versicherung",
  "weg",
] as const

export const VORGANG_KOSTENTRAEGER_LABELS: Record<string, string> = {
  vermieter: "Vermieter",
  mieter: "Mieter",
  versicherung: "Versicherung",
  weg: "WEG",
}

/** Anzeige-Label für die verknüpfte Einheit. */
export function einheitLabel(
  einheit: {
    verwendungszweck_code: string | null
    bezeichnung: string | null
  } | null
): string | null {
  if (!einheit) return null
  return einheit.verwendungszweck_code ?? einheit.bezeichnung ?? null
}

/** Anzeige-Label für einen Kontakt (Handwerker / Melder). */
export function kontaktLabel(
  kontakt:
    | { vorname: string | null; nachname: string | null; firmenname: string | null }
    | null
    | undefined
): string | null {
  if (!kontakt) return null
  const person = [kontakt.vorname, kontakt.nachname].filter(Boolean).join(" ")
  return kontakt.firmenname ?? (person || null)
}

/**
 * Anzeige-Titel eines Vorgangs (es gibt kein freies Titel-Feld mehr).
 * Baut ein Label aus Typ + Bezug (Objekt/Einheit) bzw. Aktenzeichen.
 */
export function vorgangTitel(v: {
  typ?: string | null
  aktenzeichen?: string | null
  objekt?: { kuerzel: string } | null
  einheit?: {
    verwendungszweck_code: string | null
    bezeichnung: string | null
  } | null
}): string {
  const typLabel = v.typ ? (VORGANG_TYP_LABELS[v.typ] ?? v.typ) : "Vorgang"
  const bezug = [v.objekt?.kuerzel, einheitLabel(v.einheit ?? null)]
    .filter(Boolean)
    .join(" · ")
  if (bezug) return `${typLabel} – ${bezug}`
  if (v.aktenzeichen) return `${typLabel} – ${v.aktenzeichen}`
  return typLabel
}

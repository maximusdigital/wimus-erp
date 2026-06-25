import type { SupabaseClient } from "@supabase/supabase-js"

import {
  erstelleAbrechnung,
  type BkAbrechnungErgebnis,
  type BkAbrechnungMitglied,
  type BkPosition,
} from "@/lib/utils/bk-abrechnung"
import type { Umlageschluessel } from "@/lib/utils/bk"
import type {
  AbrechnungseinheitMitRelationen,
  KostenpositionMitRelationen,
  MitgliedMitRelationen,
} from "@/types/betriebskosten"

const AE_SELECT = "*, objekt:objekte(kuerzel, stadt)"
const MITGLIED_SELECT =
  "*, einheit:einheiten(verwendungszweck_code, flaeche), mietvertrag:mietvertraege!mietvertrag_id(aktenzeichen, bk_pauschale)"
const POS_SELECT = "*, bk_art:bk_arten(bezeichnung, kategorie, standard_schluessel)"

export function isUmlageschluessel(v: string | null): v is Umlageschluessel {
  return (
    v === "kopfzahl" ||
    v === "flaeche" ||
    v === "einheit" ||
    v === "verbrauch" ||
    v === "miteigentum" ||
    v === "individuell"
  )
}

/**
 * Periode (Jahr "2025") → von/bis-Datum. Andere Formate → null/null.
 * Rein + testbar.
 */
export function periodeRange(
  period: string | null | undefined
): { von: string | null; bis: string | null } {
  if (period && /^\d{4}$/.test(period)) {
    return { von: `${period}-01-01`, bis: `${period}-12-31` }
  }
  return { von: null, bis: null }
}

/** Anzeigename einer Abrechnungszeile (Aktenzeichen oder Einheit-Code). */
export function zeileLabel(m: MitgliedMitRelationen | undefined, fallback: string): string {
  if (!m) return fallback
  return m.mietvertrag?.aktenzeichen ?? m.einheit?.verwendungszweck_code ?? "Einheit"
}

export type Abrechnungslauf = {
  ae: AbrechnungseinheitMitRelationen
  standardSchluessel: Umlageschluessel
  mitglieder: MitgliedMitRelationen[]
  mitgliedById: Map<string, MitgliedMitRelationen>
  positionen: KostenpositionMitRelationen[]
  ergebnis: BkAbrechnungErgebnis
}

/**
 * Lädt Abrechnungseinheit + Mitglieder + Positionen und berechnet die
 * Abrechnung. Eine Quelle der Wahrheit für Vorschau, Speichern und Druck.
 * Vorauszahlung = bk_pauschale × 12 (Jahresperiode). Liefert null, wenn die
 * Abrechnungseinheit nicht existiert.
 */
export async function ladeAbrechnungslauf(
  supabase: SupabaseClient<any, any, any>,
  abrechnungseinheitId: string,
  period?: string | null
): Promise<Abrechnungslauf | null> {
  const { data: aeData } = await supabase
    .from("abrechnungseinheiten")
    .select(AE_SELECT)
    .eq("id", abrechnungseinheitId)
    .maybeSingle()
  const ae = aeData as unknown as AbrechnungseinheitMitRelationen | null
  if (!ae) return null

  const standardSchluessel: Umlageschluessel = isUmlageschluessel(
    ae.standard_schluessel
  )
    ? ae.standard_schluessel
    : "flaeche"

  const { data: mitgliederData } = await supabase
    .from("abrechnungseinheit_mitglieder")
    .select(MITGLIED_SELECT)
    .eq("abrechnungseinheit_id", abrechnungseinheitId)
    .order("created_at", { ascending: true })
  const mitglieder = (mitgliederData ?? []) as unknown as MitgliedMitRelationen[]

  let posQuery = supabase
    .from("kostenverteilung_positionen")
    .select(POS_SELECT)
    .eq("abrechnungseinheit_id", abrechnungseinheitId)
  if (period) posQuery = posQuery.eq("abrechnungsperiode", period)
  const { data: posData } = await posQuery
  const positionen = (posData ?? []) as unknown as KostenpositionMitRelationen[]

  const mitgliederInput: BkAbrechnungMitglied[] = mitglieder.map((m) => ({
    id: m.mietvertrag_id ?? m.einheit_id,
    wert: m.einheit?.flaeche ?? 0,
    fester_anteil_pct: m.fester_anteil_pct,
    intern_abgerechnet: m.intern_abgerechnet,
    vorauszahlung: (m.mietvertrag?.bk_pauschale ?? 0) * 12,
  }))
  const positionenInput: BkPosition[] = positionen.map((p) => ({
    id: p.id,
    bk_art_id: p.bk_art_id,
    betrag: p.betrag_brutto ?? 0,
    schluessel: null,
  }))

  const ergebnis = erstelleAbrechnung(
    positionenInput,
    mitgliederInput,
    standardSchluessel
  )

  const mitgliedById = new Map<string, MitgliedMitRelationen>()
  for (const m of mitglieder) {
    mitgliedById.set(m.mietvertrag_id ?? m.einheit_id, m)
  }

  return { ae, standardSchluessel, mitglieder, mitgliedById, positionen, ergebnis }
}

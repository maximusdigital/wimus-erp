/** Betriebskosten – Datentypen (Abrechnungseinheiten, Mitglieder, Kostenpositionen). */

/** Kürzel-Embed eines Objekts. */
export type ObjektRef = {
  id: string
  kuerzel: string | null
  stadt?: string | null
}

/** Abrechnungseinheit (Gebäude/Wirtschaftseinheit für BK-Umlage). */
export type Abrechnungseinheit = {
  id: string
  mandant_id: string
  objekt_id: string
  bezeichnung: string
  typ: string | null
  standard_schluessel: string | null
  aktiv: boolean | null
  created_at?: string
  updated_at?: string
}

export type AbrechnungseinheitMitRelationen = Abrechnungseinheit & {
  objekt?: ObjektRef | null
}

/** Mitglied (Einheit/Vertrag) einer Abrechnungseinheit. */
export type Mitglied = {
  id: string
  abrechnungseinheit_id: string
  einheit_id: string
  kontakt_id: string | null
  mietvertrag_id: string | null
  rolle: string | null
  schluessel_override: string | null
  fester_anteil_pct: number | null
  intern_abgerechnet: boolean | null
  aktiv: boolean | null
  created_at?: string
}

export type EinheitRef = {
  id: string
  verwendungszweck_code: string | null
  bezeichnung?: string | null
  flaeche: number | null
  objekt_id?: string
}

export type MietvertragRef = {
  id: string
  aktenzeichen: string | null
  bk_pauschale?: number | null
}

export type MitgliedMitRelationen = Mitglied & {
  einheit?: EinheitRef | null
  mietvertrag?: MietvertragRef | null
}

/** Kostenposition (eine umlagefähige/nicht-umlagefähige Kostenbuchung). */
export type Kostenposition = {
  id: string
  mandant_id: string
  objekt_id: string
  bk_art_id: string
  abrechnungseinheit_id: string | null
  betrag_brutto: number | null
  betrag_netto: number | null
  ust_prozent: number | null
  leistung_von: string | null
  leistung_bis: string | null
  umlagefaehig: boolean | null
  abrechnungsperiode: string | null
  notiz: string | null
  created_at?: string
  updated_at?: string
}

export type BkArtRef = {
  id: string
  bezeichnung: string
  kategorie: string | null
  standard_schluessel: string | null
}

export type KostenpositionMitRelationen = Kostenposition & {
  objekt?: ObjektRef | null
  bk_art?: BkArtRef | null
  abrechnungseinheit?: { id: string; bezeichnung: string } | null
}

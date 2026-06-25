/** BK-Kostenart (Betriebskosten-Kostenarten-Katalog) – clientseitig nutzbar. */
export type BkArt = {
  id: string
  mandant_id: string
  bezeichnung: string
  code: string | null
  kategorie: string | null
  betrkv_nr: string | null
  standard_schluessel: string | null
  umlagefaehig: boolean | null
  hkvo_pflichtig: boolean | null
  hkvo_verbrauch_pct: number | null
  verbrauchsabhaengig: boolean | null
  zaehlerpflicht: boolean | null
  aktiv: boolean | null
  created_at: string
}

export const BK_KATEGORIEN = [
  "heizung",
  "warmwasser",
  "kaltwasser",
  "strom_allgemein",
  "muell",
  "hausmeister",
  "gartenpflege",
  "versicherung",
  "grundsteuer",
  "aufzug",
  "sonstige",
] as const

export type BkKategorie = (typeof BK_KATEGORIEN)[number]

export const BK_KATEGORIE_LABELS: Record<string, string> = {
  heizung: "Heizung",
  warmwasser: "Warmwasser",
  kaltwasser: "Kaltwasser",
  strom_allgemein: "Strom (Allgemein)",
  muell: "Müll",
  hausmeister: "Hausmeister",
  gartenpflege: "Gartenpflege",
  versicherung: "Versicherung",
  grundsteuer: "Grundsteuer",
  aufzug: "Aufzug",
  sonstige: "Sonstige",
}

export const BK_SCHLUESSEL = [
  "flaeche",
  "kopfzahl",
  "verbrauch",
  "einheit",
  "miteigentum",
  "individuell",
] as const

export type BkSchluessel = (typeof BK_SCHLUESSEL)[number]

export const BK_SCHLUESSEL_LABELS: Record<string, string> = {
  flaeche: "Wohnfläche (§556a)",
  kopfzahl: "Kopfzahl",
  verbrauch: "Verbrauch",
  einheit: "Pro Einheit",
  miteigentum: "Miteigentumsanteil",
  individuell: "Individuell",
}

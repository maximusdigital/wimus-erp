import type { Kontakt } from "@/types/kontakt"

/**
 * Demo-Daten NUR für die Dev-Vorschau (PREVIEW_NO_AUTH=1).
 * Werden nie in Produktion verwendet und enthalten keine echten Daten.
 */
const BASE = {
  mandant_id: "demo",
  created_at: "2024-01-01",
  updated_at: "2024-01-01",
  firma_id: null,
  rechtsform: null,
  land: "Deutschland",
  iban: null,
  bic: null,
  debitor_nr: null,
  kreditor_nr: null,
  zahlungsziel_tage: null,
  ist_mieter: false,
  ist_eigentuemer: false,
  ist_dienstleister: false,
  ist_makler: false,
  ist_tippgeber: false,
  ist_bank: false,
  dsgvo_datenweitergabe: false,
  sprache: "de",
  aktiv: true,
  portal_aktiv: false,
  portal_aktiviert_am: null,
} satisfies Partial<Kontakt>

export const DEMO_KONTAKTE: Kontakt[] = [
  {
    ...BASE,
    id: "demo-k1",
    kontakt_typ: "person",
    anrede: "Herr",
    vorname: "Thomas",
    nachname: "Becker",
    firmenname: null,
    email: "t.becker@example.com",
    telefon_mobil: "+49 170 1234567",
    telefon_festnetz: "+49 711 1234567",
    strasse: "Bauhofstraße",
    hausnummer: "16",
    plz: "71640",
    stadt: "Ludwigsburg",
    ist_mieter: true,
    dsgvo_datenweitergabe: true,
  },
  {
    ...BASE,
    id: "demo-k2",
    kontakt_typ: "firma",
    anrede: null,
    vorname: null,
    nachname: null,
    firmenname: "Müller Sanitär GmbH",
    rechtsform: "GmbH",
    email: "info@mueller-sanitaer.example",
    telefon_mobil: null,
    telefon_festnetz: "+49 7141 998877",
    strasse: "Industriestraße",
    hausnummer: "5",
    plz: "71636",
    stadt: "Ludwigsburg",
    kreditor_nr: "70001",
    zahlungsziel_tage: 14,
    ist_dienstleister: true,
  },
  {
    ...BASE,
    id: "demo-k3",
    kontakt_typ: "person",
    anrede: "Frau",
    vorname: "Sabine",
    nachname: "Wolf",
    firmenname: null,
    email: "s.wolf@example.com",
    telefon_mobil: null,
    telefon_festnetz: null,
    strasse: null,
    hausnummer: null,
    plz: null,
    stadt: "Stuttgart",
    ist_eigentuemer: true,
  },
]

export function findDemoKontakt(id: string): Kontakt | undefined {
  return DEMO_KONTAKTE.find((k) => k.id === id)
}

import type { Kontakt } from "@/types/kontakt"

/**
 * Demo-Daten NUR für die Dev-Vorschau (PREVIEW_NO_AUTH=1).
 * Werden nie in Produktion verwendet und enthalten keine echten Daten.
 */
export const DEMO_KONTAKTE: Kontakt[] = [
  {
    id: "demo-k1",
    mandant_id: "demo",
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
    typ: "mieter",
    anrede: "Herr",
    vorname: "Thomas",
    nachname: "Becker",
    firma: null,
    email: "t.becker@example.com",
    telefon: "+49 711 1234567",
    strasse: "Bauhofstraße",
    plz: "71640",
    ort: "Ludwigsburg",
    ausweis_nr: null,
    dsgvo_datenweitergabe: true,
    dsgvo_einwilligung_am: "2024-01-05",
    notiz: null,
  },
  {
    id: "demo-k2",
    mandant_id: "demo",
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
    typ: "dienstleister",
    anrede: null,
    vorname: null,
    nachname: null,
    firma: "Müller Sanitär GmbH",
    email: "info@mueller-sanitaer.example",
    telefon: "+49 7141 998877",
    strasse: "Industriestraße",
    plz: "71636",
    ort: "Ludwigsburg",
    ausweis_nr: null,
    dsgvo_datenweitergabe: false,
    dsgvo_einwilligung_am: null,
    notiz: "Wartung Heizung BHS16.",
  },
  {
    id: "demo-k3",
    mandant_id: "demo",
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
    typ: "eigentuemer",
    anrede: "Frau",
    vorname: "Sabine",
    nachname: "Wolf",
    firma: null,
    email: "s.wolf@example.com",
    telefon: null,
    strasse: null,
    plz: null,
    ort: "Stuttgart",
    ausweis_nr: null,
    dsgvo_datenweitergabe: false,
    dsgvo_einwilligung_am: null,
    notiz: null,
  },
]

export function findDemoKontakt(id: string): Kontakt | undefined {
  return DEMO_KONTAKTE.find((k) => k.id === id)
}

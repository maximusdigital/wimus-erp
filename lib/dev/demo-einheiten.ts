import type { EinheitMitObjekt } from "@/types/einheit"

/**
 * Demo-Daten NUR für die Dev-Vorschau (PREVIEW_NO_AUTH=1).
 * Werden nie in Produktion verwendet und enthalten keine echten Daten.
 * objekt_id referenziert die Demo-Objekte aus lib/dev/demo-objekte.ts.
 */
export const DEMO_EINHEITEN: EinheitMitObjekt[] = [
  {
    id: "demo-e1",
    objekt_id: "demo-1",
    kuerzel: "W3",
    bezeichnung: "Wohnung 3",
    lage: "2. OG links",
    verwendungszweck_code: "BHS16W3Z1",
    typ: "wohnung",
    flaeche: 78,
    zimmer: 3,
    etage_beschreibung: "2. OG",
    aktiv: true,
    objekte: { kuerzel: "BHS16", bezeichnung: "Bauhofstr. 16 – MFH 4WE 14Z" },
  },
  {
    id: "demo-e2",
    objekt_id: "demo-1",
    kuerzel: "W1Z1",
    bezeichnung: "Zimmer 1",
    lage: "EG",
    verwendungszweck_code: "BHS16W1Z1",
    typ: "zimmer",
    flaeche: 18,
    zimmer: 1,
    etage_beschreibung: "EG",
    aktiv: true,
    objekte: { kuerzel: "BHS16", bezeichnung: "Bauhofstr. 16 – MFH 4WE 14Z" },
  },
  {
    id: "demo-e3",
    objekt_id: "demo-2",
    kuerzel: "G1",
    bezeichnung: "Gewerbe EG",
    lage: "EG straßenseitig",
    verwendungszweck_code: "AS125G1",
    typ: "gewerbe",
    flaeche: 95,
    zimmer: null,
    etage_beschreibung: "EG",
    aktiv: true,
    objekte: { kuerzel: "AS125", bezeichnung: "Austraße 125 – MFH 4WE+2G" },
  },
] as EinheitMitObjekt[]

export function findDemoEinheit(id: string): EinheitMitObjekt | undefined {
  return DEMO_EINHEITEN.find((e) => e.id === id)
}

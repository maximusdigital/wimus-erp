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
    bezeichnung: "Wohnung 3",
    lage: "2. OG links",
    verwendungszweck_code: "BHS16W3Z1",
    einheitstyp: "wohnung",
    wohnflaeche_qm: 78,
    zimmer_anzahl: 3,
    etage: "2. OG",
    status: "vermietet",
    objekte: { kuerzel: "BHS16", bezeichnung: "Bauhofstr. 16 – MFH 4WE 14Z" },
  },
  {
    id: "demo-e2",
    objekt_id: "demo-1",
    bezeichnung: "Zimmer 1",
    lage: "EG",
    verwendungszweck_code: "BHS16W1Z1",
    einheitstyp: "zimmer",
    wohnflaeche_qm: 18,
    zimmer_anzahl: 1,
    etage: "EG",
    status: "frei",
    objekte: { kuerzel: "BHS16", bezeichnung: "Bauhofstr. 16 – MFH 4WE 14Z" },
  },
  {
    id: "demo-e3",
    objekt_id: "demo-2",
    bezeichnung: "Gewerbe EG",
    lage: "EG straßenseitig",
    verwendungszweck_code: "AS125G1",
    einheitstyp: "gewerbe",
    wohnflaeche_qm: 95,
    zimmer_anzahl: null,
    etage: "EG",
    status: "vermietet",
    objekte: { kuerzel: "AS125", bezeichnung: "Austraße 125 – MFH 4WE+2G" },
  },
] as EinheitMitObjekt[]

export function findDemoEinheit(id: string): EinheitMitObjekt | undefined {
  return DEMO_EINHEITEN.find((e) => e.id === id)
}

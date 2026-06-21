import type { ObjektMitEinheiten } from "@/types/objekt"

/**
 * Demo-Daten NUR für die Dev-Vorschau (NEXT_PUBLIC_PREVIEW_NO_AUTH=1).
 * Werden nie in Produktion verwendet und enthalten keine echten Daten.
 */
export const DEMO_OBJEKTE: ObjektMitEinheiten[] = [
  {
    id: "demo-1",
    kuerzel: "BHS16",
    bezeichnung: "Bauhofstr. 16 – MFH 4WE 14Z",
    strasse: "Bauhofstraße",
    hausnummer: "16",
    plz: "71640",
    ort: "Ludwigsburg",
    objekttyp: "MFH",
    baujahr: 1965,
    wohnflaeche_qm: 320,
    haltestrategie: "bestand",
    status: "ist",
    nutzen_lasten_datum: "2021-04-01",
    notartermin_datum: "2021-02-15",
    marktwert_sprengnetter: 1850000,
    marktwert_pricehubble: null,
    notiz: "Studentisches Wohnen, 14 Zimmer.",
    einheiten: [{ count: 4 }],
  },
  {
    id: "demo-2",
    kuerzel: "AS125",
    bezeichnung: "Austraße 125 – MFH 4WE+2G",
    strasse: "Austraße",
    hausnummer: "125",
    plz: "70599",
    ort: "Stuttgart-Münster",
    objekttyp: "MFH",
    baujahr: 1958,
    wohnflaeche_qm: 410,
    haltestrategie: "bestand",
    status: "ist",
    marktwert_sprengnetter: 1420000,
    marktwert_pricehubble: null,
    einheiten: [{ count: 6 }],
  },
  {
    id: "demo-3",
    kuerzel: "BS18A1",
    bezeichnung: "Beilsteiner Str. 18A – R2R KZV",
    strasse: "Beilsteiner Straße",
    hausnummer: "18A",
    plz: "70372",
    ort: "Stuttgart",
    objekttyp: "R2R-KZV",
    haltestrategie: "r2r",
    status: "akquise",
    marktwert_sprengnetter: null,
    marktwert_pricehubble: 540000,
    einheiten: [{ count: 1 }],
  },
] as ObjektMitEinheiten[]

export function findDemoObjekt(id: string): ObjektMitEinheiten | undefined {
  return DEMO_OBJEKTE.find((o) => o.id === id)
}

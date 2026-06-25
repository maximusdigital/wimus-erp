import type { ObjektMitEinheiten } from "@/types/objekt"

/**
 * Demo-Daten NUR für die Dev-Vorschau (NEXT_PUBLIC_PREVIEW_NO_AUTH=1).
 * Werden nie in Produktion verwendet und enthalten keine echten Daten.
 */
export const DEMO_OBJEKTE: ObjektMitEinheiten[] = [
  {
    id: "demo-1",
    kuerzel: "BHS16",
    strasse: "Bauhofstraße",
    hausnummer: "16",
    plz: "71640",
    stadt: "Ludwigsburg",
    stadtteil: null,
    land: null,
    typ: "MFH",
    baujahr: 1965,
    haltestrategie: "bestand",
    status: "ist",
    nutzen_lasten_datum: "2021-04-01",
    notartermin_datum: "2021-02-15",
    marktwert_sprengnetter: 1850000,
    marktwert_pricehubble: null,
    einheiten: [{ count: 4 }],
  },
  {
    id: "demo-2",
    kuerzel: "AS125",
    strasse: "Austraße",
    hausnummer: "125",
    plz: "70599",
    stadt: "Stuttgart-Münster",
    stadtteil: null,
    land: null,
    typ: "MFH",
    baujahr: 1958,
    haltestrategie: "bestand",
    status: "ist",
    marktwert_sprengnetter: 1420000,
    marktwert_pricehubble: null,
    einheiten: [{ count: 6 }],
  },
  {
    id: "demo-3",
    kuerzel: "BS18A1",
    strasse: "Beilsteiner Straße",
    hausnummer: "18A",
    plz: "70372",
    stadt: "Stuttgart",
    stadtteil: null,
    land: null,
    typ: "R2R-KZV",
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

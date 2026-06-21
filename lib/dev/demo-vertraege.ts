import type { VertragMitRelationen } from "@/types/vertrag"

/**
 * Demo-Daten NUR für die Dev-Vorschau (PREVIEW_NO_AUTH=1).
 * Werden nie in Produktion verwendet und enthalten keine echten Daten.
 * Referenzen zeigen auf die Demo-Objekte/-Einheiten/-Kontakte.
 */
export const DEMO_VERTRAEGE: VertragMitRelationen[] = [
  {
    id: "demo-v1",
    mandant_id: "demo",
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
    objekt_id: "demo-1",
    einheit_id: "demo-e1",
    mieter_id: "demo-k1",
    vertragsart: "V01",
    vertragsnummer: "2021-BHS16-W3",
    beginn: "2021-05-01",
    ende: null,
    unbefristet: true,
    grundmiete: 780,
    bk_pauschale: 120,
    heizkosten_pauschale: 80,
    strompauschale: null,
    faelligkeitsregel: "3. Werktag des Monats",
    kdu_id: null,
    kaution_id: null,
    status: "aktiv",
    objekt: { kuerzel: "BHS16", bezeichnung: "Bauhofstr. 16 – MFH 4WE 14Z" },
    einheit: { verwendungszweck_code: "BHS16W3Z1", bezeichnung: "Wohnung 3" },
    mieter: { vorname: "Thomas", nachname: "Becker", firma: null },
  },
  {
    id: "demo-v2",
    mandant_id: "demo",
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
    objekt_id: "demo-2",
    einheit_id: "demo-e3",
    mieter_id: null,
    vertragsart: "V02",
    vertragsnummer: "2019-AS125-G1",
    beginn: "2019-09-01",
    ende: null,
    unbefristet: true,
    grundmiete: 1450,
    bk_pauschale: 200,
    heizkosten_pauschale: null,
    strompauschale: null,
    faelligkeitsregel: "1. des Monats",
    kdu_id: null,
    kaution_id: null,
    status: "aktiv",
    objekt: { kuerzel: "AS125", bezeichnung: "Austraße 125 – MFH 4WE+2G" },
    einheit: { verwendungszweck_code: "AS125G1", bezeichnung: "Gewerbe EG" },
    mieter: null,
  },
]

export function findDemoVertrag(id: string): VertragMitRelationen | undefined {
  return DEMO_VERTRAEGE.find((v) => v.id === id)
}

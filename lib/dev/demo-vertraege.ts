import type { VertragMitRelationen } from "@/types/vertrag"

/**
 * Demo-Daten NUR für die Dev-Vorschau (PREVIEW_NO_AUTH=1).
 * Werden nie in Produktion verwendet und enthalten keine echten Daten.
 * Referenzen zeigen auf die Demo-Objekte/-Einheiten/-Kontakte.
 * Das Objekt wird über die Einheit erreicht (mietvertraege hat keine objekt_id).
 */
export const DEMO_VERTRAEGE: VertragMitRelationen[] = [
  {
    id: "demo-v1",
    mandant_id: "demo",
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
    einheit_id: "demo-e1",
    mieter_id: "demo-k1",
    vertragstyp: "V01",
    mietbeginn: "2021-05-01",
    mietende: null,
    grundmiete: 780,
    bk_pauschale: 120,
    heizkosten_pauschale: 80,
    strompauschale: null,
    faelligkeitsregel: "3. Werktag des Monats",
    kdu_relevant: false,
    status: "aktiv",
    einheit: {
      verwendungszweck_code: "BHS16W3Z1",
      bezeichnung: "Wohnung 3",
      objekt_id: "demo-1",
      objekt: { kuerzel: "BHS16" },
    },
    mieter: { vorname: "Thomas", nachname: "Becker", firmenname: null },
  },
  {
    id: "demo-v2",
    mandant_id: "demo",
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
    einheit_id: "demo-e3",
    mieter_id: null,
    vertragstyp: "V02",
    mietbeginn: "2019-09-01",
    mietende: null,
    grundmiete: 1450,
    bk_pauschale: 200,
    heizkosten_pauschale: null,
    strompauschale: null,
    faelligkeitsregel: "1. des Monats",
    kdu_relevant: false,
    status: "aktiv",
    einheit: {
      verwendungszweck_code: "AS125G1",
      bezeichnung: "Gewerbe EG",
      objekt_id: "demo-2",
      objekt: { kuerzel: "AS125" },
    },
    mieter: null,
  },
]

export function findDemoVertrag(id: string): VertragMitRelationen | undefined {
  return DEMO_VERTRAEGE.find((v) => v.id === id)
}

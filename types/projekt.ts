/** Projekt (Org-Ebene 3) – clientseitig nutzbarer Typ ohne Server-Imports. */
export type Projekt = {
  id: string
  name: string
  kuerzel: string | null
  typ: string | null
  parent_projekt_id: string | null
  ebene: number | null
  ci_farbe_primary: string | null
}

/** Projekt-Typen (Spezifikation V501 Kap. 2.2). */
export const PROJEKT_TYPEN = [
  "kzv",
  "monteur",
  "wg",
  "hausverwaltung",
  "development",
  "ankauf",
  "bauprojekt",
  "r2r",
] as const

/** Labels für die Projekt-Typen (Spezifikation V501 Kap. 2.2). */
export const PROJEKT_TYP_LABELS: Record<string, string> = {
  kzv: "KZV / Touristen",
  monteur: "Monteure",
  wg: "WG / Studenten",
  hausverwaltung: "Hausverwaltung",
  development: "Development",
  ankauf: "Ankauf",
  bauprojekt: "Bauprojekt",
  r2r: "Rent2Rent",
}

/** Projekt-Status (Spezifikation V501). */
export const PROJEKT_STATUS = ["planung", "aktiv", "abgeschlossen"] as const

export const PROJEKT_STATUS_LABELS: Record<string, string> = {
  planung: "Planung",
  aktiv: "Aktiv",
  abgeschlossen: "Abgeschlossen",
}

/**
 * Flache Projektliste in Anzeige-Reihenfolge bringen: jedes Top-Level-Projekt
 * gefolgt von seinen Unterprojekten (rekursiv, alphabetisch je Ebene).
 */
export function orderProjekteTree(projekte: Projekt[]): Projekt[] {
  const byParent = new Map<string | null, Projekt[]>()
  for (const p of projekte) {
    const key = p.parent_projekt_id ?? null
    const arr = byParent.get(key) ?? []
    arr.push(p)
    byParent.set(key, arr)
  }
  for (const arr of byParent.values()) {
    arr.sort((a, b) => a.name.localeCompare(b.name, "de"))
  }
  const out: Projekt[] = []
  const walk = (parent: string | null) => {
    for (const p of byParent.get(parent) ?? []) {
      out.push(p)
      walk(p.id)
    }
  }
  walk(null)
  return out
}

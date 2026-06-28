import { describe, it, expect } from "vitest"

import { leiteBezuege } from "@/lib/historie/bezug"
import {
  aktivitaetFarbe, aktivitaetIcon, zeitGruppe, gruppiereFeed,
} from "@/lib/historie/stil"
import type { EntityRef, Hierarchie } from "@/lib/historie/types"

describe("historie/bezug – leiteBezuege (0007-Muster)", () => {
  it("Mietvertrag → primär + abgeleitete Mieter/Einheit/Objekt", () => {
    const primaer: EntityRef = { typ: "mietvertrag", id: "mv1" }
    const h: Hierarchie = { mietvertrag_id: "mv1", mieter_id: "k1", einheit_id: "e1", objekt_id: "o1" }
    const b = leiteBezuege(primaer, h)
    const byTyp = Object.fromEntries(b.map((x) => [x.typ, x]))
    expect(byTyp.mietvertrag).toMatchObject({ id: "mv1", quelle: "primaer" })
    expect(byTyp.mieter).toMatchObject({ id: "k1", quelle: "abgeleitet" })
    expect(byTyp.einheit).toMatchObject({ id: "e1", quelle: "abgeleitet" })
    expect(byTyp.objekt).toMatchObject({ id: "o1", quelle: "abgeleitet" })
    expect(b).toHaveLength(4)
  })

  it("dedupliziert: Primär gewinnt über abgeleitet bei gleicher Entität", () => {
    const b = leiteBezuege({ typ: "objekt", id: "o1" }, { objekt_id: "o1" })
    expect(b).toHaveLength(1)
    expect(b[0]).toMatchObject({ typ: "objekt", id: "o1", quelle: "primaer" })
  })

  it("leere Hierarchie → nur Primär-Bezug", () => {
    const b = leiteBezuege({ typ: "kontakt", id: "k9" }, {})
    expect(b).toEqual([{ typ: "kontakt", id: "k9", quelle: "primaer" }])
  })
})

describe("historie/stil – Farbe + Icon", () => {
  it("Typ-Farbe gewinnt über Modul-Farbe", () => {
    expect(aktivitaetFarbe({ typ: "mahnung_versandt", modul: "fibu" })).toBe("danger")
    expect(aktivitaetFarbe({ typ: "beleg_verbucht", modul: "fibu" })).toBe("success") // Modul-Default
    expect(aktivitaetFarbe({ typ: "nachricht_gesendet", modul: "kommunikation" })).toBe("secondary")
    expect(aktivitaetFarbe({ typ: "unbekannt", modul: "unbekannt" })).toBe("muted")
  })

  it("Icon-Fallback auf circle-dot", () => {
    expect(aktivitaetIcon({ typ: "zahlung_eingegangen", modul: "fibu" })).toBe("banknote")
    expect(aktivitaetIcon({ typ: "irgendwas", modul: "x" })).toBe("circle-dot")
  })
})

describe("historie/stil – Zeit-Gruppierung", () => {
  const jetzt = new Date(2026, 5, 28, 12, 0, 0) // 28.06.2026 12:00 lokal

  it("ordnet Zeitpunkte den Gruppen zu", () => {
    expect(zeitGruppe(new Date(2026, 5, 28, 8, 0, 0), jetzt)).toBe("heute")
    expect(zeitGruppe(new Date(2026, 5, 27, 23, 0, 0), jetzt)).toBe("gestern")
    expect(zeitGruppe(new Date(2026, 5, 23, 9, 0, 0), jetzt)).toBe("letzte_woche")
    expect(zeitGruppe(new Date(2026, 5, 10, 9, 0, 0), jetzt)).toBe("aelter")
  })

  it("gruppiereFeed behält Reihenfolge heute→älter und bündelt", () => {
    const items = [
      { zeitpunkt: new Date(2026, 5, 28, 10, 0, 0).toISOString() },
      { zeitpunkt: new Date(2026, 5, 28, 9, 0, 0).toISOString() },
      { zeitpunkt: new Date(2026, 5, 27, 9, 0, 0).toISOString() },
      { zeitpunkt: new Date(2026, 5, 10, 9, 0, 0).toISOString() },
    ]
    const g = gruppiereFeed(items, jetzt)
    expect(g.map((x) => x.gruppe)).toEqual(["heute", "gestern", "aelter"])
    expect(g[0].items).toHaveLength(2)
  })
})

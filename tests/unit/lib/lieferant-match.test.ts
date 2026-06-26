import { describe, expect, it } from "vitest"

import { matchLieferant, type LieferantKandidat } from "@/lib/fibu/lieferant-match"

const K: LieferantKandidat[] = [
  { id: "l1", name: "Stadtwerke Stuttgart GmbH", alias: ["SWS"], firma_id: "f1", standard_konto: "4240", standard_gewerk: "Strom" },
  { id: "l2", name: "dm-drogerie markt", alias: ["DM"], firma_id: "f2", standard_konto: "4250", standard_gewerk: "Reinigung" },
]

describe("matchLieferant", () => {
  it("exakter Name (Rechtsform/Satzzeichen ignoriert) → Treffer + firma_id/Konto", () => {
    const t = matchLieferant("Stadtwerke Stuttgart GmbH", K)
    expect(t?.lieferant_id).toBe("l1")
    expect(t?.firma_id).toBe("f1")
    expect(t?.standard_konto).toBe("4240")
  })
  it("Alias-Treffer (DM)", () => {
    expect(matchLieferant("DM", K)?.lieferant_id).toBe("l2")
  })
  it("Teilstring (OCR-Variante)", () => {
    expect(matchLieferant("Stadtwerke Stuttgart", K)?.lieferant_id).toBe("l1")
  })
  it("kein Treffer → null", () => {
    expect(matchLieferant("Notar Müller", K)).toBeNull()
  })
  it("leer → null", () => {
    expect(matchLieferant(null, K)).toBeNull()
    expect(matchLieferant("  ", K)).toBeNull()
  })
})

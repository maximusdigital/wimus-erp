import { describe, expect, it } from "vitest"

import { kiStatusAusConfidence } from "@/lib/ops/confidence"

describe("kiStatusAusConfidence", () => {
  it("≥0.90 → auto (unkritisch)", () => {
    expect(kiStatusAusConfidence(0.9)).toBe("auto")
    expect(kiStatusAusConfidence(0.97)).toBe("auto")
    expect(kiStatusAusConfidence(1)).toBe("auto")
  })

  it("0.75–0.89 → pruefen", () => {
    expect(kiStatusAusConfidence(0.75)).toBe("pruefen")
    expect(kiStatusAusConfidence(0.89)).toBe("pruefen")
  })

  it("<0.75 → manuell", () => {
    expect(kiStatusAusConfidence(0.74)).toBe("manuell")
    expect(kiStatusAusConfidence(0)).toBe("manuell")
  })

  it("kritische Felder nie auto → mindestens pruefen", () => {
    expect(kiStatusAusConfidence(0.99, true)).toBe("pruefen")
    expect(kiStatusAusConfidence(0.9, true)).toBe("pruefen")
    // unter den Schwellen bleibt es trotzdem manuell
    expect(kiStatusAusConfidence(0.5, true)).toBe("manuell")
  })

  it("ungültige Confidence → manuell", () => {
    expect(kiStatusAusConfidence(NaN)).toBe("manuell")
    expect(kiStatusAusConfidence(Number.POSITIVE_INFINITY)).toBe("manuell")
  })
})

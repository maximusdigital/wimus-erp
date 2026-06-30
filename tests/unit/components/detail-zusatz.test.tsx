import { render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { DetailZusatz } from "@/components/shared/detail-zusatz"

class RO {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(globalThis as any).ResizeObserver = RO

beforeEach(() => {
  const fn = vi.fn((url: string) => {
    if (url.startsWith("/api/felder/werte")) {
      return Promise.resolve({ ok: true, json: async () => ({ definitionen: [], werte: [] }) })
    }
    // /api/historie
    return Promise.resolve({ ok: true, json: async () => [] })
  })
  vi.stubGlobal("fetch", fn)
})
afterEach(() => {
  vi.unstubAllGlobals()
})

describe("DetailZusatz", () => {
  it("rendert beide Abschnitte und reicht bezugTyp/bezugId an die Historie durch", async () => {
    render(
      <DetailZusatz feldEntitaet="objekt" bezugTyp="objekt" bezugId="obj-9" hatUntergeordnete />,
    )

    expect(screen.getByText("Weitere Felder")).toBeInTheDocument()
    expect(screen.getByText("Historie")).toBeInTheDocument()

    await waitFor(() => {
      const calls = (globalThis.fetch as unknown as { mock: { calls: unknown[][] } }).mock.calls
      const hist = calls.find((c) => String(c[0]).startsWith("/api/historie"))
      expect(hist).toBeTruthy()
      expect(String(hist![0])).toContain("bezug_typ=objekt")
      expect(String(hist![0])).toContain("bezug_id=obj-9")
    })
  })

  it("nutzt für Kontakte die abweichende Felder-Entität (person)", () => {
    render(<DetailZusatz feldEntitaet="person" bezugTyp="kontakt" bezugId="k-1" />)
    // Felder-API wird mit der Person-Entität geladen, Historie mit bezugTyp kontakt.
    const calls = (globalThis.fetch as unknown as { mock: { calls: unknown[][] } }).mock.calls
    expect(calls.some((c) => String(c[0]).includes("/api/felder/werte?entitaet=person"))).toBe(true)
    expect(calls.some((c) => String(c[0]).includes("bezug_typ=kontakt"))).toBe(true)
  })
})

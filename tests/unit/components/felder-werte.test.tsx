import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { FelderWerte } from "@/components/felder/felder-werte"

// base-ui Select braucht ResizeObserver (in jsdom nicht vorhanden).
class RO {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(globalThis as any).ResizeObserver = RO

function def(over: Record<string, unknown>) {
  return {
    id: "d",
    mandant_id: "m",
    entitaet: "objekt",
    key: "k",
    label: "Feld",
    typ: "text",
    geschuetzt: false,
    pflicht: false,
    sortierung: 0,
    gruppe: null,
    aktiv: true,
    optionen: [],
    ...over,
  }
}

const DEFS = [
  def({ id: "d-text", key: "notiz", label: "Notiz", typ: "text" }),
  def({ id: "d-zahl", key: "flaeche", label: "Fläche", typ: "zahl", pflicht: true }),
  def({ id: "d-datum", key: "stichtag", label: "Stichtag", typ: "datum" }),
  def({
    id: "d-multi",
    key: "tags",
    label: "Tags",
    typ: "mehrfachauswahl",
    optionen: [
      { id: "o-x", opt_key: "x", label: "X", sortierung: 0, aktiv: true },
      { id: "o-y", opt_key: "y", label: "Y", sortierung: 10, aktiv: true },
    ],
  }),
  def({
    id: "d-auswahl",
    key: "kategorie",
    label: "Kategorie",
    typ: "auswahl",
    optionen: [{ id: "o-a", opt_key: "a", label: "A", sortierung: 0, aktiv: true }],
  }),
  def({ id: "d-bool", key: "aktiv", label: "Aktiv?", typ: "janein" }),
]

function stubFetch(definitionen: unknown[], werte: unknown[] = []) {
  const fn = vi.fn((url: string, opts?: { method?: string }) => {
    if (opts?.method === "PUT") {
      return Promise.resolve({ ok: true, json: async () => ({ ok: true }) })
    }
    return Promise.resolve({ ok: true, json: async () => ({ definitionen, werte }) })
  })
  vi.stubGlobal("fetch", fn)
  return fn
}

beforeEach(() => {
  vi.restoreAllMocks()
})
afterEach(() => {
  vi.unstubAllGlobals()
})

describe("FelderWerte", () => {
  it("rendert je Feldtyp das passende Element", async () => {
    stubFetch(DEFS, [{ def_id: "d-text", typ: "text", text: "hallo" }])
    const { container } = render(<FelderWerte entitaet="objekt" entitaetId="obj-1" />)

    // Text: vorbelegter Wert
    expect(await screen.findByDisplayValue("hallo")).toBeInTheDocument()
    // Zahl: number-Input
    expect(container.querySelector('input[type="number"]')).toBeTruthy()
    // Datum: date-Input
    expect(container.querySelector('input[type="date"]')).toBeTruthy()
    // Mehrfachauswahl: je Option eine Checkbox
    expect(container.querySelectorAll('input[type="checkbox"]').length).toBe(2)
    // Auswahl + JaNein: je ein Select-Trigger
    expect(container.querySelectorAll('[data-slot="select-trigger"]').length).toBe(2)
    // Pflichtfeld * im Label
    expect(screen.getByText("Fläche").parentElement?.textContent).toContain("*")
  })

  it("blockt leeres Pflichtfeld und speichert es NICHT", async () => {
    const fetchFn = stubFetch(DEFS)
    render(<FelderWerte entitaet="objekt" entitaetId="obj-1" />)
    const zahl = (await screen.findByLabelText(/Fläche/)) as HTMLInputElement
    fireEvent.blur(zahl) // leer + pflicht

    expect(await screen.findByText("Pflichtfeld darf nicht leer sein.")).toBeInTheDocument()
    expect(fetchFn.mock.calls.some((c) => c[1]?.method === "PUT")).toBe(false)
  })

  it("speichert einen Textwert via PUT mit korrektem Body", async () => {
    const fetchFn = stubFetch(DEFS)
    render(<FelderWerte entitaet="objekt" entitaetId="obj-7" />)
    const text = (await screen.findByLabelText("Notiz")) as HTMLInputElement
    fireEvent.change(text, { target: { value: "neuer Wert" } })
    fireEvent.blur(text)

    await waitFor(() => {
      const put = fetchFn.mock.calls.find((c) => c[1]?.method === "PUT")
      expect(put).toBeTruthy()
      const body = JSON.parse((put![1] as { body: string }).body)
      expect(body).toMatchObject({
        entitaet: "objekt",
        id: "obj-7",
        def_id: "d-text",
        wert: "neuer Wert",
      })
    })
    expect(await screen.findByText("Gespeichert.")).toBeInTheDocument()
  })

  it("zeigt den Leerzustand mit Link zur Feldverwaltung", async () => {
    stubFetch([])
    render(<FelderWerte entitaet="objekt" entitaetId="obj-1" />)
    expect(await screen.findByText(/Keine Felder definiert/)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Felder verwalten" })).toHaveAttribute(
      "href",
      "/einstellungen/felder",
    )
  })
})

import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { AddressBlock } from "@/components/ui/address-block"

// Design System 40, Pflichtregel #7: Adresse immer als Block
describe("AddressBlock", () => {
  it("rendert Strasse+Hausnummer und PLZ+Stadt als getrennte Zeilen", () => {
    render(
      <AddressBlock
        adresse={{ strasse: "Bauhofstraße", hausnummer: "16", plz: "71640", stadt: "Ludwigsburg" }}
      />
    )
    expect(screen.getByText("Bauhofstraße 16")).toBeInTheDocument()
    expect(screen.getByText("71640 Ludwigsburg")).toBeInTheDocument()
  })

  it("zeigt Stadtteil in Klammern", () => {
    render(
      <AddressBlock
        adresse={{ plz: "70372", stadt: "Stuttgart", stadtteil: "Bad Cannstatt" }}
      />
    )
    expect(screen.getByText("70372 Stuttgart (Bad Cannstatt)")).toBeInTheDocument()
  })

  it("blendet Deutschland aus, zeigt anderes Land", () => {
    const { rerender } = render(
      <AddressBlock adresse={{ strasse: "Hauptstr.", stadt: "Wien", land: "Österreich" }} />
    )
    expect(screen.getByText("Österreich")).toBeInTheDocument()
    rerender(<AddressBlock adresse={{ strasse: "Hauptstr.", stadt: "Berlin", land: "Deutschland" }} />)
    expect(screen.queryByText("Deutschland")).not.toBeInTheDocument()
  })

  it("leere Adresse -> Hinweis statt leerem Block", () => {
    render(<AddressBlock adresse={{}} />)
    expect(screen.getByText("Keine Adresse hinterlegt")).toBeInTheDocument()
  })
})

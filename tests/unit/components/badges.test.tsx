import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { PriorityBadge } from "@/components/ui/priority-badge"
import { StatusBadge } from "@/components/ui/status-badge"

// Phase 4 + Design System 40: WIMUS-Custom-Badges
describe("PriorityBadge", () => {
  it("zeigt Notfall-Label und pulsiert bei 'notfall'", () => {
    render(<PriorityBadge prioritaet="notfall" />)
    const el = screen.getByText("Notfall")
    expect(el).toBeInTheDocument()
    expect(el.className).toContain("animate-pulse")
  })

  it("Alias: DB-Wert 'kritisch' wird wie Notfall behandelt", () => {
    render(<PriorityBadge prioritaet="kritisch" />)
    const el = screen.getByText("Notfall")
    expect(el.className).toContain("animate-pulse")
    expect(el.className).toContain("bg-danger")
  })

  it("unbekannte Priorität fällt auf 'normal' zurück", () => {
    render(<PriorityBadge prioritaet="quatsch" />)
    expect(screen.getByText("Normal")).toBeInTheDocument()
  })
})

describe("StatusBadge", () => {
  it("mappt 'aktiv' auf success-Ton", () => {
    render(<StatusBadge status="aktiv" />)
    const el = screen.getByText("aktiv")
    expect(el.className).toContain("text-success")
  })

  it("mappt 'gekuendigt' auf danger-Ton", () => {
    render(<StatusBadge status="gekuendigt" />)
    expect(screen.getByText("gekuendigt").className).toContain("text-danger")
  })

  it("unbekannter Status -> muted", () => {
    render(<StatusBadge status="schwebt" />)
    expect(screen.getByText("schwebt").className).toContain("text-muted-foreground")
  })

  it("Vertrags-/Kautions-Vokabular: korrekte Töne", () => {
    const cases: [string, string][] = [
      ["hinterlegt", "text-success"],
      ["angelegt", "bg-warning/10"],
      ["beendet", "text-muted-foreground"],
      ["ausgezahlt", "text-muted-foreground"],
    ]
    for (const [status, cls] of cases) {
      const { unmount } = render(<StatusBadge status={status} />)
      expect(screen.getByText(status).className).toContain(cls)
      unmount()
    }
  })

  it("children überschreiben den angezeigten Text, Ton bleibt am Status", () => {
    render(<StatusBadge status="aktiv">Aktiv</StatusBadge>)
    const el = screen.getByText("Aktiv")
    expect(el.className).toContain("text-success")
  })
})

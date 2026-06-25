import { effectiveCi, isHexColor, type Projekt } from "@/types/projekt"

/**
 * Design-Token-UI (Design System V104, Kap. 4.2): setzt die CI-Farben des
 * aktiven Projekts zur LAUFZEIT als CSS Custom Properties – kein Build, kein
 * Deployment. Marketing-Vererbung (NULL → Parent) via effectiveCi().
 *
 * Greift die Tailwind-v4-Tokens --color-primary/--color-secondary ab; ohne
 * gesetzte CI bleibt der globale WIMUS-Default aus globals.css aktiv.
 */
export function ProjektTheme({
  projekt,
  projekte,
}: {
  projekt: Projekt | null
  projekte: Projekt[]
}) {
  const { primary, secondary } = effectiveCi(projekt, projekte)
  const rules: string[] = []
  if (isHexColor(primary)) rules.push(`--color-primary:${primary};`)
  if (isHexColor(secondary)) rules.push(`--color-secondary:${secondary};`)
  if (rules.length === 0) return null

  return <style>{`:root{${rules.join("")}}`}</style>
}

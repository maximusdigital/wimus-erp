import { requireAdmin } from "@/lib/berechtigungen/istAdmin"

/**
 * Admin-Gate für den gesamten Einstellungs-/Admin-Bereich (Modul 010, Stufe 0).
 * Zentral hier — deckt ALLE Unterseiten ab (projekte/firmen/workspace/bk-arten/
 * felder/kontakttypen/audit/benutzer), keine Duplizierung je Seite. Nicht-Admin →
 * Redirect aufs Dashboard (via requireAdmin → nur über den Berechtigungs-Wrapper).
 */
export default async function EinstellungenLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin()
  return <>{children}</>
}

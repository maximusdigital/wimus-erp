/**
 * Vorschau-/Demo-Modus: überspringt den Auth-Guard und blendet Demo-Daten ein.
 *
 * Server-seitige Runtime-Variable (KEIN NEXT_PUBLIC_-Prefix), damit sie auch im
 * Produktions-Build zur Laufzeit greift, ohne den Wert fest einzubacken.
 *
 *   Dev:   PREVIEW_NO_AUTH=1 npm run dev
 *   Prod:  npm run build && PREVIEW_NO_AUTH=1 npm run start
 *
 * ⚠️ Aktiviert offenen Zugriff OHNE Login. Nur für temporäre UI-Tests.
 */
export function isPreviewNoAuth(): boolean {
  return process.env.PREVIEW_NO_AUTH === "1"
}

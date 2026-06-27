/**
 * Confidence-Routing für die KI-Bildanalyse (Modul 004 ops, Übergabe-Fotos).
 *
 * Spiegelt die Belegpipeline-Logik (Spec 0002): das Modell liefert eine
 * Selbsteinschätzung 0..1, das System leitet daraus deterministisch ab, ob das
 * Ergebnis automatisch übernommen, markiert oder manuell geprüft werden muss.
 *
 *   ≥ 0.90  → auto      (übernehmbar)
 *   0.75–0.89 → pruefen (markieren, kurzer Blick)
 *   < 0.75  → manuell   (vollständig manuell)
 *
 * Kritische Felder (z. B. Zählerstand → Abrechnung, Schaden → Kaution) werden
 * NIE automatisch übernommen → mindestens `pruefen`, egal wie hoch die Confidence.
 */

export const KI_SCHWELLE_AUTO = 0.9
export const KI_SCHWELLE_PRUEFEN = 0.75

export type KiStatus = "auto" | "pruefen" | "manuell"

/**
 * Leitet den Routing-Status aus der Modell-Confidence ab.
 * @param confidence Selbsteinschätzung 0..1.
 * @param kritisch   true = Ergebnis fließt in Abrechnung/Forderung → nie auto.
 */
export function kiStatusAusConfidence(confidence: number, kritisch = false): KiStatus {
  if (!Number.isFinite(confidence) || confidence < KI_SCHWELLE_PRUEFEN) return "manuell"
  if (confidence < KI_SCHWELLE_AUTO) return "pruefen"
  return kritisch ? "pruefen" : "auto"
}

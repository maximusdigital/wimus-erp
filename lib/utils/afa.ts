/**
 * AfA – Absetzung für Abnutzung (lineare Gebäude-AfA).
 *
 * Selbst gebaute Steuer-/Finanzlogik (Schaltzentrale-Prinzip: das ist
 * immobilienspezifisch und wird nicht zugekauft).
 *
 * Grundlagen:
 *  - Nur der Gebäudeanteil ist abschreibbar, nicht der Grundstücksanteil.
 *    Bemessungsgrundlage = Gesamtkaufpreis × (1 − Grundstücksanteil%).
 *    Ein KPA-/Kaufpreisaufteilungs-Gutachten kann den Grundstücksanteil
 *    senken (z. B. 20 % statt 30 %) → höhere Bemessungsgrundlage → höhere AfA.
 *  - Lineare AfA: konstanter Jahresbetrag = Bemessungsgrundlage × Satz%.
 *  - Restbuchwert = Bemessungsgrundlage − (Jahresbetrag × abgelaufene Jahre),
 *    nie unter 0.
 *  - IST vs. PLAN: nur Zeilen mit ist_oder_plan = 'IST' fließen in die
 *    tatsächliche AfA-Summe; PLAN-Zeilen sind reine Vorschau/Szenario.
 */

/** Rundet auf 2 Nachkommastellen (Euro-Cent). */
function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/**
 * Abschreibbare Bemessungsgrundlage (Gebäudeanteil) aus Gesamtkaufpreis
 * und Grundstücksanteil in Prozent (0–100).
 */
export function afaBemessungsgrundlage(
  gesamtkaufpreis: number,
  grundstuecksanteilProzent: number
): number {
  const anteil = Math.min(Math.max(grundstuecksanteilProzent, 0), 100)
  return round2(gesamtkaufpreis * (1 - anteil / 100))
}

/** Linearer AfA-Jahresbetrag = Bemessungsgrundlage × Satz%. */
export function afaJahresbetrag(
  bemessungsgrundlage: number,
  satzProzent: number
): number {
  return round2(bemessungsgrundlage * (satzProzent / 100))
}

/**
 * Restbuchwert nach `jahre` voll abgeschriebenen Jahren (linear),
 * nie unter 0.
 */
export function restbuchwert(
  bemessungsgrundlage: number,
  satzProzent: number,
  jahre: number
): number {
  const verbraucht = afaJahresbetrag(bemessungsgrundlage, satzProzent) * jahre
  return round2(Math.max(0, bemessungsgrundlage - verbraucht))
}

export type AfaZeile = {
  betrag: number
  ist_oder_plan: "IST" | "PLAN"
}

/** Summe nur der IST-Zeilen (PLAN-Zeilen bleiben außen vor). */
export function summeAfaIst(zeilen: AfaZeile[]): number {
  return round2(
    zeilen
      .filter((z) => z.ist_oder_plan === "IST")
      .reduce((acc, z) => acc + z.betrag, 0)
  )
}

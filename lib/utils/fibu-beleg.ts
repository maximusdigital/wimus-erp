/**
 * FiBu-Belegprüfung & Gating (Spec 0002, 60_tests "Validierung"/"Gating").
 * Reine Funktionen – KI extrahiert, diese Logik prüft deterministisch und
 * entscheidet auto-buchbar vs. review_flag. Keine externen Dienste.
 *
 * Schwellen (Spec-OP-2, hier als dokumentierte Standardannahme, überschreibbar):
 *   - Auto-Buchung nur bei confidence ≥ 0.95 UND brutto ≤ 200 €.
 *   - Beträge darüber immer durch den Menschen, auch bei confidence 1.0.
 */

/** 1-Cent-Toleranz für Betragsabgleiche. */
const CENT = 0.01

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export type BelegBetraege = {
  netto: number | null
  brutto: number | null
  ust_betrag: number | null
  ust_satz: number | null
  belegdatum: string | null
}

export type BelegPruefung = {
  ok: boolean
  review_flag: boolean
  gruende: string[]
}

/**
 * Deterministische Belegvalidierung. Prüft netto+ust≈brutto, ust≈netto×satz
 * und die Datumsplausibilität. Jede Abweichung > 1 Cent / unplausibles Datum
 * setzt review_flag (kein Auto-Buchen).
 */
export function pruefeBeleg(
  beleg: BelegBetraege,
  heute: string
): BelegPruefung {
  const gruende: string[] = []
  const { netto, brutto, ust_betrag, ust_satz, belegdatum } = beleg

  // netto + ust ≈ brutto (Differenz gerundet → keine Float-Artefakte)
  if (netto != null && ust_betrag != null && brutto != null) {
    if (round2(Math.abs(netto + ust_betrag - brutto)) > CENT) {
      gruende.push("netto + USt ≠ brutto")
    }
  } else {
    gruende.push("Beträge unvollständig")
  }

  // ust ≈ netto × satz
  if (netto != null && ust_satz != null && ust_betrag != null) {
    const erwartet = (netto * ust_satz) / 100
    if (round2(Math.abs(erwartet - ust_betrag)) > CENT) {
      gruende.push("USt-Betrag passt nicht zum Satz")
    }
  }

  // Datum plausibel: nicht in der Zukunft, nicht vor 2000.
  if (!belegdatum) {
    gruende.push("Belegdatum fehlt")
  } else {
    const d = new Date(belegdatum)
    if (Number.isNaN(d.getTime())) {
      gruende.push("Belegdatum ungültig")
    } else {
      if (belegdatum > heute) gruende.push("Belegdatum liegt in der Zukunft")
      if (d.getFullYear() < 2000) gruende.push("Belegdatum unplausibel alt")
    }
  }

  const ok = gruende.length === 0
  return { ok, review_flag: !ok, gruende }
}

/**
 * IBAN-Prüfsumme (ISO 13616, mod-97 == 1). Format/Länge grob geprüft,
 * inhaltliche Prüfung über die Modulo-Rechnung.
 */
export function ibanGueltig(iban: string | null | undefined): boolean {
  if (!iban) return false
  const clean = iban.replace(/\s+/g, "").toUpperCase()
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(clean)) return false
  // Erste 4 Zeichen ans Ende, Buchstaben → Zahlen (A=10 … Z=35).
  const rearranged = clean.slice(4) + clean.slice(0, 4)
  const digits = rearranged.replace(/[A-Z]/g, (c) =>
    String(c.charCodeAt(0) - 55)
  )
  // Modulo 97 stückweise (Zahl zu groß für Number).
  let rest = 0
  for (const ch of digits) {
    rest = (rest * 10 + (ch.charCodeAt(0) - 48)) % 97
  }
  return rest === 1
}

export type GatingErgebnis = {
  auto_buchbar: boolean
  review_flag: boolean
  grund: string
}

/**
 * Auto-Buchung-Gating: nur bei ausreichender Confidence UND Betrag unter der
 * Schwelle. Darüber immer Mensch.
 */
export function gating(
  confidence: number,
  brutto: number,
  opts?: { minConfidence?: number; maxBetrag?: number }
): GatingErgebnis {
  const minConfidence = opts?.minConfidence ?? 0.95
  const maxBetrag = opts?.maxBetrag ?? 200
  if (brutto > maxBetrag) {
    return {
      auto_buchbar: false,
      review_flag: true,
      grund: `Betrag über Schwelle (${maxBetrag} €)`,
    }
  }
  if (confidence < minConfidence) {
    return {
      auto_buchbar: false,
      review_flag: true,
      grund: `Confidence unter ${minConfidence}`,
    }
  }
  return { auto_buchbar: true, review_flag: false, grund: "auto-buchbar" }
}

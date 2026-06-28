/**
 * KSK-Ludwigsburg/WISO-CSV-Parser (Spec 0002, Bank-Abgleich).
 *
 * Export-Format (fix): Trennzeichen `;`, Header
 *   Wertstellung;Empfänger/Auftraggeber;Verwendungszweck;Kategorie;Betrag;Stand
 * Datum `TT.MM.JJJJ HH:MM:SS`, Betrag deutsch `-1.128,87` (Minus = Ausgabe), Stand = Saldo.
 *
 * Die CP1252→UTF8-Dekodierung passiert beim Aufrufer (API, Datei-Bytes →
 * TextDecoder('windows-1252')); dieser Parser arbeitet auf dem dekodierten String
 * und ist damit rein/testbar (papaparse).
 */
import Papa from "papaparse"

export type BankZeile = {
  wertstellung: string // ISO YYYY-MM-DD
  empfaenger: string
  verwendungszweck: string
  kategorie_wiso: string
  betrag: number // mit Vorzeichen
  saldo: number | null
  richtung: "einnahme" | "ausgabe"
}

export type BankCsvErgebnis = {
  zeilen: BankZeile[]
  fehler: string[]
}

/** "TT.MM.JJJJ[ HH:MM:SS]" → ISO "YYYY-MM-DD". null bei ungültig. */
export function parseDeutschesDatum(s: string | undefined | null): string | null {
  if (!s) return null
  const m = s.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/)
  if (!m) return null
  const [, d, mo, y] = m
  const dd = d.padStart(2, "0")
  const mm = mo.padStart(2, "0")
  if (Number(mm) < 1 || Number(mm) > 12 || Number(dd) < 1 || Number(dd) > 31) return null
  return `${y}-${mm}-${dd}`
}

/** Deutscher Betrag "-1.128,87" / "1.234,00" / "+5,00" → number. null bei ungültig. */
export function parseDeutscherBetrag(s: string | undefined | null): number | null {
  if (s == null) return null
  const t = String(s).trim()
  if (t === "") return null
  // Tausenderpunkte raus, Dezimal-Komma → Punkt, Whitespace im Zahlkörper raus.
  const norm = t.replace(/\./g, "").replace(",", ".").replace(/\s/g, "")
  const n = Number(norm)
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null
}

/** Header-Key per Teilstring finden (toleriert BOM/Umlaut-Varianten). */
function findKey(keys: string[], needle: string): string | undefined {
  const n = needle.toLowerCase()
  return keys.find((k) => k.toLowerCase().replace(/[^a-zäöü/]/g, "").includes(n))
}

/** Parst den (bereits dekodierten) KSK/WISO-CSV-Text. */
export function parseKskCsv(text: string): BankCsvErgebnis {
  const fehler: string[] = []
  const zeilen: BankZeile[] = []

  const parsed = Papa.parse<Record<string, string>>(text, {
    delimiter: ";",
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.replace(/^﻿/, "").trim(),
  })

  const keys = parsed.meta.fields ?? []
  if (keys.length === 0) {
    return { zeilen, fehler: ["Keine Kopfzeile erkannt (Trennzeichen ; erwartet)."] }
  }
  const kWert = findKey(keys, "wertstellung")
  const kEmpf = findKey(keys, "empf")
  const kZweck = findKey(keys, "verwendung")
  const kKat = findKey(keys, "kategorie")
  const kBetrag = findKey(keys, "betrag")
  const kStand = findKey(keys, "stand")
  if (!kWert || !kBetrag) {
    return { zeilen, fehler: ["Pflichtspalten Wertstellung/Betrag nicht gefunden."] }
  }

  parsed.data.forEach((row, i) => {
    const datum = parseDeutschesDatum(row[kWert])
    const betrag = parseDeutscherBetrag(row[kBetrag])
    if (datum === null || betrag === null) {
      fehler.push(`Zeile ${i + 2}: Datum/Betrag unlesbar (übersprungen).`)
      return
    }
    zeilen.push({
      wertstellung: datum,
      empfaenger: (kEmpf ? row[kEmpf] : "")?.trim() ?? "",
      verwendungszweck: (kZweck ? row[kZweck] : "")?.trim() ?? "",
      kategorie_wiso: (kKat ? row[kKat] : "")?.trim() ?? "",
      betrag,
      saldo: kStand ? parseDeutscherBetrag(row[kStand]) : null,
      richtung: betrag < 0 ? "ausgabe" : "einnahme",
    })
  })

  return { zeilen, fehler }
}

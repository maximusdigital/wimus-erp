/**
 * DATEV-EXTF-Buchungsstapel-Export (Spec 0002 Decision: Export = DATEV-CSV pro
 * Einheit → TaxPool-Import). Reine String-Erzeugung, testbar.
 *
 * Aufbau (3 Zeilen-Typen):
 *  1. EXTF-Header  – Metazeile (Format 700, Kategorie 21 "Buchungsstapel").
 *  2. Spaltenüberschriften – TaxPool/DATEV mappen die Datenspalten darüber.
 *  3. Buchungszeilen.
 *
 * OP-1 (Spec offen): das vollständige 116-Spalten-Layout. Hier wird der
 * konsistente Kern emittiert (Überschrift == Datenspalten), den TaxPool über
 * die Spaltennamen importiert; KOST1=K1, KOST2=K2, stabile BuchungsID für die
 * Dublettenerkennung. Erweiterbar, sobald OP-1 fixiert ist.
 *
 * Kodierung: DATEV erwartet Windows-1252; diese Funktion liefert einen String,
 * die Kodierung übernimmt der Aufrufer beim Schreiben.
 */

export type ExtfBuchung = {
  /** Umsatz (immer positiv); Vorzeichen über soll_haben. */
  umsatz: number
  soll_haben: "S" | "H"
  konto: string
  gegenkonto: string
  bu_schluessel?: string | null
  /** Belegdatum ISO (YYYY-MM-DD) → DATEV TTMM. */
  belegdatum: string
  belegfeld1?: string | null
  buchungstext?: string | null
  kost1?: string | null
  kost2?: string | null
  /** Stabile ID für die TaxPool-Dublettenerkennung. */
  buchungs_id?: string | null
}

export type ExtfMeta = {
  berater_nr?: string | number
  mandant_nr?: string | number
  /** Wirtschaftsjahresbeginn ISO. */
  wj_beginn: string
  /** Stapel-Datumsbereich ISO. */
  datum_von: string
  datum_bis: string
  bezeichnung?: string
  /** Erzeugt-Zeitstempel "YYYYMMDDHHMMSSmmm" (optional, sonst leer). */
  erzeugt_am?: string
}

const SPALTEN = [
  "Umsatz (ohne Soll/Haben-Kz)",
  "Soll/Haben-Kennzeichen",
  "WKZ Umsatz",
  "Konto",
  "Gegenkonto (ohne BU-Schlüssel)",
  "BU-Schlüssel",
  "Belegdatum",
  "Belegfeld 1",
  "Buchungstext",
  "KOST1",
  "KOST2",
  "BuchungsID",
] as const

/** CSV-Feld: Text in Anführungszeichen, " verdoppelt. */
function feld(v: string): string {
  return `"${v.replace(/"/g, '""')}"`
}

/** Betrag → deutsches Format (Komma, 2 Nachkommastellen, kein Tausenderpunkt). */
function betrag(n: number): string {
  return Math.abs(n).toFixed(2).replace(".", ",")
}

/** ISO YYYY-MM-DD → DATEV TTMM (Jahr kommt aus dem WJ im Header). */
function ttmm(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  return m ? `${m[3]}${m[2]}` : ""
}

/** ISO → YYYYMMDD (Header-Datumsfelder). */
function yyyymmdd(iso: string): string {
  return iso.replace(/-/g, "")
}

function headerZeile(meta: ExtfMeta): string {
  // 31-Feld-Metazeile; relevante Positionen gesetzt, Rest leer.
  const f: string[] = new Array(31).fill("")
  f[0] = feld("EXTF")
  f[1] = "700"
  f[2] = "21"
  f[3] = feld("Buchungsstapel")
  f[4] = "13" // Formatversion Buchungsstapel
  f[5] = meta.erzeugt_am ?? ""
  f[11] = String(meta.berater_nr ?? "")
  f[12] = String(meta.mandant_nr ?? "")
  f[13] = yyyymmdd(meta.wj_beginn)
  f[14] = "4" // Sachkontenlänge
  f[15] = yyyymmdd(meta.datum_von)
  f[16] = yyyymmdd(meta.datum_bis)
  f[17] = feld(meta.bezeichnung ?? "")
  f[18] = "1" // Diktatkürzel/Buchungstyp-Defaults
  f[19] = "0"
  f[20] = "0"
  f[22] = feld("EUR")
  return f.join(";")
}

function buchungsZeile(b: ExtfBuchung): string {
  return [
    betrag(b.umsatz),
    feld(b.soll_haben),
    feld("EUR"),
    feld(b.konto),
    feld(b.gegenkonto),
    feld(b.bu_schluessel ?? ""),
    ttmm(b.belegdatum),
    feld((b.belegfeld1 ?? "").slice(0, 36)),
    feld((b.buchungstext ?? "").slice(0, 60)),
    feld(b.kost1 ?? ""),
    feld(b.kost2 ?? ""),
    feld(b.buchungs_id ?? ""),
  ].join(";")
}

/** Vollständiger EXTF-Buchungsstapel (Header + Spaltenzeile + Buchungen). */
export function extfBuchungsstapel(
  buchungen: ExtfBuchung[],
  meta: ExtfMeta
): string {
  const zeilen = [
    headerZeile(meta),
    SPALTEN.map((s) => feld(s)).join(";"),
    ...buchungen.map(buchungsZeile),
  ]
  // DATEV-Zeilenende CRLF.
  return zeilen.join("\r\n") + "\r\n"
}

/**
 * Reine Abbildung Feldtyp → Speicher (Variante C) und Feldtyp → 0006-Filtertyp.
 * Hier gekapselt, damit ein Varianten-Wechsel C↔B nur diese Datei + value.ts trifft.
 */
import type { FieldType } from "./types"
import type { FilterFieldType } from "@/lib/search/types"

export type WertSpalte = "wert_text" | "wert_zahl" | "wert_datum" | "wert_bool" | "option"

/** Skalar-Speicherspalte je Feldtyp. `option` = über custom_field_value_option (Mehrfach). */
export function wertSpalte(typ: FieldType): WertSpalte {
  switch (typ) {
    case "zahl":
      return "wert_zahl"
    case "datum":
      return "wert_datum"
    case "janein":
      return "wert_bool"
    case "auswahl":
      return "wert_text" // speichert den stabilen opt_key
    case "mehrfachauswahl":
      return "option"
    case "text":
    default:
      return "wert_text"
  }
}

/** 0006-Filtertyp je Feldtyp (für die dynamischen filterFields). */
export function filterTypFor(typ: FieldType): FilterFieldType {
  switch (typ) {
    case "zahl":
      return "number"
    case "datum":
      return "date"
    case "janein":
      return "bool"
    case "auswahl":
    case "mehrfachauswahl":
      return "enum"
    case "text":
    default:
      return "text"
  }
}

/**
 * Validiert/normalisiert einen Roh-Eingabewert gegen den Feldtyp.
 * Liefert die typgerechten Spaltenwerte ODER einen Fehler (für Pflicht-/Typprüfung).
 */
export type NormWert = {
  wert_text: string | null
  wert_zahl: number | null
  wert_datum: string | null
  wert_bool: boolean | null
  optionen: string[] // opt_key[]
}

export function leererWert(): NormWert {
  return { wert_text: null, wert_zahl: null, wert_datum: null, wert_bool: null, optionen: [] }
}

export function normalisiereWert(
  typ: FieldType,
  roh: unknown,
): { ok: true; wert: NormWert } | { ok: false; fehler: string } {
  const w = leererWert()
  // leer/null erlaubt (Pflichtprüfung passiert separat)
  if (roh === null || roh === undefined || roh === "") return { ok: true, wert: w }

  switch (typ) {
    case "text": {
      w.wert_text = String(roh)
      return { ok: true, wert: w }
    }
    case "auswahl": {
      w.wert_text = String(roh) // opt_key
      return { ok: true, wert: w }
    }
    case "zahl": {
      const n = typeof roh === "number" ? roh : Number(String(roh).replace(",", "."))
      if (!Number.isFinite(n)) return { ok: false, fehler: "Keine gültige Zahl." }
      w.wert_zahl = n
      return { ok: true, wert: w }
    }
    case "datum": {
      const s = String(roh)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return { ok: false, fehler: "Datum erwartet (YYYY-MM-DD)." }
      w.wert_datum = s
      return { ok: true, wert: w }
    }
    case "janein": {
      if (typeof roh === "boolean") w.wert_bool = roh
      else w.wert_bool = roh === "true" || roh === "1" || roh === 1
      return { ok: true, wert: w }
    }
    case "mehrfachauswahl": {
      const arr = Array.isArray(roh) ? roh : [roh]
      w.optionen = arr.map((x) => String(x)).filter(Boolean)
      return { ok: true, wert: w }
    }
    default:
      return { ok: false, fehler: `Unbekannter Feldtyp: ${typ}` }
  }
}

/** Pflichtprüfung auf einem normalisierten Wert. */
export function istLeer(typ: FieldType, w: NormWert): boolean {
  switch (typ) {
    case "zahl":
      return w.wert_zahl === null
    case "datum":
      return w.wert_datum === null
    case "janein":
      return w.wert_bool === null
    case "mehrfachauswahl":
      return w.optionen.length === 0
    default:
      return w.wert_text === null || w.wert_text === ""
  }
}

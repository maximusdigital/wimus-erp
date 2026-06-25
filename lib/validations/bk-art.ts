import { z } from "zod"

import { BK_KATEGORIEN, BK_SCHLUESSEL } from "@/types/bk-art"

// ---------------------------------------------------------------------------
// Client-Form-Schema: alle Felder als String; Booleans als "ja"/"nein"-Selects.
// bezeichnung ist Pflicht; Rest optional.
// ---------------------------------------------------------------------------
const numericString = z
  .string()
  .optional()
  .refine((v) => !v || !Number.isNaN(Number(v)), { message: "Ungültige Zahl" })

export const bkArtFormSchema = z.object({
  bezeichnung: z.string().min(1, "Pflichtfeld"),
  code: z.string().optional(),
  kategorie: z.string().optional(),
  betrkv_nr: z.string().optional(),
  standard_schluessel: z.string().optional(),
  hkvo_verbrauch_pct: numericString,
  umlagefaehig: z.enum(["ja", "nein"]),
  hkvo_pflichtig: z.enum(["ja", "nein"]),
  verbrauchsabhaengig: z.enum(["ja", "nein"]),
  zaehlerpflicht: z.enum(["ja", "nein"]),
  aktiv: z.enum(["ja", "nein"]),
})

export type BkArtFormValues = z.infer<typeof bkArtFormSchema>

// ---------------------------------------------------------------------------
// Server-Insert-Schema: bereinigt + typisiert die rohen Form-Werte.
// mandant_id wird serverseitig ergänzt.
// ---------------------------------------------------------------------------
const textOrNull = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== "" ? v.trim() : null))

const intOrNull = z
  .union([z.string(), z.number()])
  .optional()
  .transform((v) => (v === "" || v == null ? null : Math.trunc(Number(v))))
  .refine((v) => v === null || !Number.isNaN(v), { message: "Ungültige Zahl" })

const enumOrNull = (values: readonly string[]) =>
  z
    .string()
    .optional()
    .transform((v) => (v && v.trim() !== "" ? v : null))
    .refine((v) => v === null || values.includes(v), {
      message: "Ungültige Auswahl",
    })

// Boolean-Transform mit konfigurierbarem Default (für fehlende Werte).
const booleanWithDefault = (fallback: boolean) =>
  z
    .union([z.boolean(), z.enum(["ja", "nein"])])
    .optional()
    .transform((v) => {
      if (v === undefined) return fallback
      return v === true || v === "ja"
    })

export const bkArtInsertSchema = z.object({
  bezeichnung: z.string().min(1, "Pflichtfeld").transform((v) => v.trim()),
  code: textOrNull,
  kategorie: enumOrNull(BK_KATEGORIEN),
  betrkv_nr: textOrNull,
  standard_schluessel: enumOrNull(BK_SCHLUESSEL),
  hkvo_verbrauch_pct: intOrNull,
  umlagefaehig: booleanWithDefault(true),
  hkvo_pflichtig: booleanWithDefault(false),
  verbrauchsabhaengig: booleanWithDefault(false),
  zaehlerpflicht: booleanWithDefault(false),
  aktiv: booleanWithDefault(true),
})

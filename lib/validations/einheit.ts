import { z } from "zod"

import { EINHEITSTYPEN } from "@/types/einheit"

// ---------------------------------------------------------------------------
// Client-Form-Schema: alle Felder als String (UI-Eingaben), keine Typ-Transform.
// → kompatibel mit react-hook-form FormField.
// ---------------------------------------------------------------------------
const numericString = z
  .string()
  .optional()
  .refine((v) => !v || !Number.isNaN(Number(v)), { message: "Ungültige Zahl" })

export const einheitFormSchema = z.object({
  objekt_id: z.string().min(1, "Pflichtfeld"),
  kuerzel: z.string().optional(),
  bezeichnung: z.string().optional(),
  lage: z.string().optional(),
  verwendungszweck_code: z.string().optional(),
  typ: z.string().optional(),
  aktiv: z.enum(["ja", "nein"]),
  flaeche: numericString,
  zimmer: numericString,
  schlafzimmer: numericString,
  baeder: numericString,
  etage_beschreibung: z.string().optional(),
  keybox_pin_statisch: z.string().optional(),
  keybox_standort: z.string().optional(),
  max_personen: numericString,
  anleitung_url: z.string().optional(),
  gaestemappe_url_slug: z.string().optional(),
})

export type EinheitFormValues = z.infer<typeof einheitFormSchema>

// ---------------------------------------------------------------------------
// Server-Insert-Schema: bereinigt + typisiert die rohen Form-Werte.
// leere Eingabe → null, Zahlen → number, Enums geprüft, Code → UPPERCASE.
// ---------------------------------------------------------------------------
const textOrNull = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== "" ? v.trim() : null))

const numberOrNull = z
  .union([z.string(), z.number()])
  .optional()
  .transform((v) => (v === "" || v == null ? null : Number(v)))
  .refine((v) => v === null || !Number.isNaN(v), { message: "Ungültige Zahl" })

const enumOrNull = (values: readonly string[]) =>
  z
    .string()
    .optional()
    .transform((v) => (v && v.trim() !== "" ? v : null))
    .refine((v) => v === null || values.includes(v), {
      message: "Ungültige Auswahl",
    })

export const einheitInsertSchema = z.object({
  objekt_id: z.string().uuid("Ungültiges Objekt"),
  kuerzel: textOrNull,
  bezeichnung: textOrNull,
  lage: textOrNull,
  verwendungszweck_code: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() !== "" ? v.trim().toUpperCase() : null)),
  typ: enumOrNull(EINHEITSTYPEN),
  aktiv: z
    .union([z.boolean(), z.enum(["ja", "nein"])])
    .optional()
    .transform((v) => v !== false && v !== "nein"),
  flaeche: numberOrNull,
  zimmer: numberOrNull,
  schlafzimmer: numberOrNull,
  baeder: numberOrNull,
  etage_beschreibung: textOrNull,
  keybox_pin_statisch: textOrNull,
  keybox_standort: textOrNull,
  max_personen: numberOrNull,
  anleitung_url: textOrNull,
  gaestemappe_url_slug: textOrNull,
})

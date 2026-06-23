import { z } from "zod"

import { EINHEITSTYPEN, EINHEIT_STATUS } from "@/types/einheit"

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
  bezeichnung: z.string().optional(),
  lage: z.string().optional(),
  verwendungszweck_code: z.string().optional(),
  einheitstyp: z.string().optional(),
  status: z.enum(EINHEIT_STATUS),
  wohnflaeche_qm: numericString,
  zimmer_anzahl: numericString,
  etage: z.string().optional(),
  keybox_pin_statisch: z.string().optional(),
  keybox_standort: z.string().optional(),
  max_personen: numericString,
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
  bezeichnung: textOrNull,
  lage: textOrNull,
  verwendungszweck_code: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() !== "" ? v.trim().toUpperCase() : null)),
  einheitstyp: enumOrNull(EINHEITSTYPEN),
  status: z.enum(EINHEIT_STATUS),
  wohnflaeche_qm: numberOrNull,
  zimmer_anzahl: numberOrNull,
  etage: textOrNull,
  keybox_pin_statisch: textOrNull,
  keybox_standort: textOrNull,
  max_personen: numberOrNull,
})

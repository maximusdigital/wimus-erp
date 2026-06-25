import { z } from "zod"

import { KAUTION_ANLAGE_ARTEN, KAUTION_STATUS } from "@/types/kaution"

// ---------------------------------------------------------------------------
// Client-Form-Schema: alle Felder als String (UI-Eingaben).
// ---------------------------------------------------------------------------
const numericString = z
  .string()
  .optional()
  .refine((v) => !v || !Number.isNaN(Number(v)), { message: "Ungültige Zahl" })

export const kautionFormSchema = z.object({
  mietvertrag_id: z.string().optional(),
  betrag: numericString,
  anlage_art: z.string().optional(),
  zinssatz: numericString,
  zinsen_kumuliert: numericString,
  rueckzahlung_datum: z.string().optional(),
  status: z.enum(KAUTION_STATUS),
})

export type KautionFormValues = z.infer<typeof kautionFormSchema>

// ---------------------------------------------------------------------------
// Server-Insert-Schema: bereinigt + typisiert die rohen Form-Werte.
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

const uuidOrNull = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== "" ? v.trim() : null))
  .refine((v) => v === null || z.string().uuid().safeParse(v).success, {
    message: "Ungültige Auswahl",
  })

const enumOrNull = (values: readonly string[]) =>
  z
    .string()
    .optional()
    .transform((v) => (v && v.trim() !== "" ? v : null))
    .refine((v) => v === null || values.includes(v), {
      message: "Ungültige Auswahl",
    })

export const kautionInsertSchema = z.object({
  mietvertrag_id: uuidOrNull,
  betrag: numberOrNull,
  anlage_art: enumOrNull(KAUTION_ANLAGE_ARTEN),
  zinssatz: numberOrNull,
  zinsen_kumuliert: numberOrNull,
  rueckzahlung_datum: textOrNull,
  status: z.enum(KAUTION_STATUS),
})

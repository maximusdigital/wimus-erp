import { z } from "zod"

import { MAHN_STATUS } from "@/types/mahnung"

// ---------------------------------------------------------------------------
// Client-Form-Schema: alle Felder als String (UI-Eingaben).
// ---------------------------------------------------------------------------
const numericString = z
  .string()
  .optional()
  .refine((v) => !v || !Number.isNaN(Number(v)), { message: "Ungültige Zahl" })

export const mahnungFormSchema = z.object({
  mietvertrag_id: z.string().optional(),
  stufe: z.string().optional(),
  hauptforderung: numericString,
  zinsen: numericString,
  gebuehren: numericString,
  faellig_am: z.string().optional(),
  mahngericht_az: z.string().optional(),
  status: z.enum(MAHN_STATUS),
})

export type MahnungFormValues = z.infer<typeof mahnungFormSchema>

// ---------------------------------------------------------------------------
// Server-Insert-Schema: bereinigt + typisiert die rohen Form-Werte.
// Hinweis: `gesamtforderung` wird serverseitig (API) aus den Teilbeträgen berechnet.
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

const stufeInt = z
  .union([z.string(), z.number()])
  .optional()
  .transform((v) => (v === "" || v == null ? 1 : Number(v)))
  .refine((v) => Number.isInteger(v) && v >= 1 && v <= 5, {
    message: "Ungültige Stufe",
  })

export const mahnungInsertSchema = z.object({
  mietvertrag_id: uuidOrNull,
  stufe: stufeInt,
  hauptforderung: numberOrNull,
  zinsen: numberOrNull,
  gebuehren: numberOrNull,
  faellig_am: textOrNull,
  mahngericht_az: textOrNull,
  status: z.enum(MAHN_STATUS),
})

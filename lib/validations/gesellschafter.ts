import { z } from "zod"

import { GESELLSCHAFTER_TYPEN } from "@/types/gesellschafter"

const textOrNull = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== "" ? v.trim() : null))

// ---- Gesellschafter ----

export const gesellschafterFormSchema = z.object({
  name: z.string().min(1, "Pflichtfeld"),
  typ: z.enum(GESELLSCHAFTER_TYPEN),
  steuerliche_id: z.string().optional(),
  strasse: z.string().optional(),
  hausnummer: z.string().optional(),
  plz: z.string().optional(),
  stadt: z.string().optional(),
  land: z.string().optional(),
})

export type GesellschafterFormValues = z.infer<typeof gesellschafterFormSchema>

export const gesellschafterInsertSchema = z.object({
  name: z.string().min(1, "Pflichtfeld"),
  typ: z.enum(GESELLSCHAFTER_TYPEN),
  steuerliche_id: textOrNull,
  strasse: textOrNull,
  hausnummer: textOrNull,
  plz: textOrNull,
  stadt: textOrNull,
  land: textOrNull,
})

// ---- Beteiligung ----
// Im Formular wird die Quote in Prozent erfasst (50 = 50 %) und für die DB
// (CHECK quote BETWEEN 0 AND 1) zum Bruchteil normalisiert.

export const beteiligungFormSchema = z.object({
  firma_id: z.string().min(1, "Pflichtfeld"),
  quote_prozent: z.string().min(1, "Pflichtfeld"),
  gueltig_ab: z.string().min(1, "Pflichtfeld"),
  gueltig_bis: z.string().optional(),
})

export type BeteiligungFormValues = z.infer<typeof beteiligungFormSchema>

const prozentZuBruch = z
  .string()
  .min(1, "Pflichtfeld")
  .transform((v) => Number(v.replace(",", ".")) / 100)
  .refine((n) => Number.isFinite(n) && n >= 0 && n <= 1, "Quote 0–100 %")

export const beteiligungInsertSchema = z.object({
  gesellschafter_id: z.string().uuid(),
  firma_id: z.string().uuid("Firma wählen"),
  quote: prozentZuBruch,
  gueltig_ab: z.string().min(1, "Pflichtfeld"),
  gueltig_bis: textOrNull,
})

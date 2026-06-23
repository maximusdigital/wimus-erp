import { z } from "zod"

import { BUCHUNG_STATUS, KANAELE } from "@/types/buchung"

// ---------------------------------------------------------------------------
// Client-Form-Schema: alle Felder als String (UI-Eingaben).
// checkin/checkout als datetime-local-Strings.
// ---------------------------------------------------------------------------
const numericString = z
  .string()
  .optional()
  .refine((v) => !v || !Number.isNaN(Number(v)), { message: "Ungültige Zahl" })

export const buchungFormSchema = z.object({
  einheit_id: z.string().optional(),
  gast_id: z.string().optional(),
  kanal: z.string().optional(),
  beds24_id: z.string().optional(),
  checkin: z.string().optional(),
  checkout: z.string().optional(),
  personen: numericString,
  betrag: numericString,
  ust_prozent: numericString,
  apartment_pin: z.string().optional(),
  status: z.enum(BUCHUNG_STATUS),
})

export type BuchungFormValues = z.infer<typeof buchungFormSchema>

// ---------------------------------------------------------------------------
// Server-Insert-Schema: bereinigt + typisiert die rohen Form-Werte.
// Hinweis: objekt_id, keybox_pin und city_tax werden serverseitig (API) aus
// der gewählten Einheit / dem Objekt abgeleitet – daher NICHT hier enthalten.
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

const intOrNull = z
  .union([z.string(), z.number()])
  .optional()
  .transform((v) => (v === "" || v == null ? null : Number(v)))
  .refine((v) => v === null || Number.isInteger(v), {
    message: "Ungültige Zahl",
  })

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

export const buchungInsertSchema = z.object({
  einheit_id: uuidOrNull,
  gast_id: uuidOrNull,
  kanal: enumOrNull(KANAELE),
  beds24_id: textOrNull,
  checkin: textOrNull,
  checkout: textOrNull,
  personen: intOrNull,
  betrag: numberOrNull,
  ust_prozent: numberOrNull,
  apartment_pin: textOrNull,
  status: z.enum(BUCHUNG_STATUS),
})

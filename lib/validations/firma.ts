import { z } from "zod"

// Client-Form-Schema (alle Felder als String).
export const firmaFormSchema = z.object({
  name: z.string().min(1, "Pflichtfeld"),
  kuerzel: z.string().optional(),
  rechtsform: z.string().optional(),
  geschaeftsfuehrer: z.string().optional(),
  handelsregister_nr: z.string().optional(),
  handelsregister_gericht: z.string().optional(),
  steuernummer: z.string().optional(),
  ust_id: z.string().optional(),
  datev_mandant_nr: z.string().optional(),
  iban: z.string().optional(),
  bic: z.string().optional(),
  mutter_firma_id: z.string().optional(),
  ci_farbe_primary: z.string().optional(),
  aktiv: z.enum(["ja", "nein"]),
})

export type FirmaFormValues = z.infer<typeof firmaFormSchema>

const textOrNull = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== "" ? v.trim() : null))

const uuidOrNull = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== "" ? v.trim() : null))
  .refine((v) => v === null || z.string().uuid().safeParse(v).success, {
    message: "Ungültige Auswahl",
  })

// Server-Insert-Schema (workspace_id serverseitig ergänzt).
export const firmaInsertSchema = z.object({
  name: z.string().min(1, "Pflichtfeld").transform((v) => v.trim()),
  kuerzel: textOrNull,
  rechtsform: textOrNull,
  geschaeftsfuehrer: textOrNull,
  handelsregister_nr: textOrNull,
  handelsregister_gericht: textOrNull,
  steuernummer: textOrNull,
  ust_id: textOrNull,
  datev_mandant_nr: textOrNull,
  iban: textOrNull,
  bic: textOrNull,
  mutter_firma_id: uuidOrNull,
  ci_farbe_primary: textOrNull,
  aktiv: z
    .union([z.boolean(), z.enum(["ja", "nein"])])
    .transform((v) => v === true || v === "ja"),
})

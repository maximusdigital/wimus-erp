import { z } from "zod"

import { BK_SCHLUESSEL } from "@/types/bk-art"

// Client-Form-Schema (Strings; aktiv als ja/nein-Select).
export const abrechnungseinheitFormSchema = z.object({
  objekt_id: z.string().min(1, "Pflichtfeld"),
  bezeichnung: z.string().min(1, "Pflichtfeld"),
  typ: z.string().optional(),
  standard_schluessel: z.string().optional(),
  aktiv: z.enum(["ja", "nein"]),
})

export type AbrechnungseinheitFormValues = z.infer<
  typeof abrechnungseinheitFormSchema
>

const textOrNull = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== "" ? v.trim() : null))

const enumOrNull = (values: readonly string[]) =>
  z
    .string()
    .optional()
    .transform((v) => (v && v.trim() !== "" ? v : null))
    .refine((v) => v === null || values.includes(v), {
      message: "Ungültige Auswahl",
    })

const booleanWithDefault = (fallback: boolean) =>
  z
    .union([z.boolean(), z.enum(["ja", "nein"])])
    .optional()
    .transform((v) => {
      if (v === undefined) return fallback
      return v === true || v === "ja"
    })

// Server-Insert-Schema. mandant_id wird serverseitig ergänzt.
export const abrechnungseinheitInsertSchema = z.object({
  objekt_id: z.string().uuid("Ungültiges Objekt"),
  bezeichnung: z.string().min(1, "Pflichtfeld").transform((v) => v.trim()),
  typ: textOrNull,
  standard_schluessel: enumOrNull(BK_SCHLUESSEL),
  aktiv: booleanWithDefault(true),
})

// ---------------------------------------------------------------------------
// Mitglied (abrechnungseinheit_mitglieder) – Insert-Schema.
// abrechnungseinheit_id kommt aus der Route.
// ---------------------------------------------------------------------------
const uuidOrNull = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== "" ? v.trim() : null))
  .refine((v) => v === null || z.string().uuid().safeParse(v).success, {
    message: "Ungültige Auswahl",
  })

const numberOrNull = z
  .union([z.string(), z.number()])
  .optional()
  .transform((v) =>
    v === "" || v == null ? null : Number(String(v).replace(",", "."))
  )
  .refine((v) => v === null || !Number.isNaN(v), { message: "Ungültige Zahl" })

export const mitgliedInsertSchema = z.object({
  einheit_id: z.string().uuid("Ungültige Einheit"),
  mietvertrag_id: uuidOrNull,
  fester_anteil_pct: numberOrNull,
  intern_abgerechnet: booleanWithDefault(false),
})

import { z } from "zod"

// Client-Form-Schema (Strings; umlagefaehig als ja/nein-Select).
export const kostenpositionFormSchema = z.object({
  objekt_id: z.string().min(1, "Pflichtfeld"),
  bk_art_id: z.string().min(1, "Pflichtfeld"),
  abrechnungseinheit_id: z.string().optional(),
  betrag_brutto: z.string().min(1, "Pflichtfeld"),
  leistung_von: z.string().optional(),
  leistung_bis: z.string().optional(),
  umlagefaehig: z.enum(["ja", "nein"]),
  abrechnungsperiode: z.string().optional(),
  notiz: z.string().optional(),
})

export type KostenpositionFormValues = z.infer<typeof kostenpositionFormSchema>

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

const booleanWithDefault = (fallback: boolean) =>
  z
    .union([z.boolean(), z.enum(["ja", "nein"])])
    .optional()
    .transform((v) => {
      if (v === undefined) return fallback
      return v === true || v === "ja"
    })

// Server-Insert-Schema. mandant_id wird serverseitig ergänzt.
export const kostenpositionInsertSchema = z.object({
  objekt_id: z.string().uuid("Ungültiges Objekt"),
  bk_art_id: z.string().uuid("Ungültige Kostenart"),
  abrechnungseinheit_id: uuidOrNull,
  betrag_brutto: z
    .union([z.string(), z.number()])
    .transform((v) => Number(String(v).replace(",", ".")))
    .refine((v) => !Number.isNaN(v), { message: "Ungültige Zahl" }),
  leistung_von: textOrNull,
  leistung_bis: textOrNull,
  umlagefaehig: booleanWithDefault(true),
  abrechnungsperiode: textOrNull,
  notiz: textOrNull,
})

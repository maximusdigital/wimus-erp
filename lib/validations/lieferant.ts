import { z } from "zod"

const textOrNull = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== "" ? v.trim() : null))

export const lieferantFormSchema = z.object({
  name: z.string().min(1, "Pflichtfeld"),
  alias: z.string().optional(),
  ustid: z.string().optional(),
  iban: z.string().optional(),
  standard_gewerk: z.string().optional(),
  standard_konto: z.string().optional(),
  firma_id: z.string().optional(),
})

export type LieferantFormValues = z.infer<typeof lieferantFormSchema>

/** "DM, dm-drogerie, Drogeriemarkt" → ["DM","dm-drogerie","Drogeriemarkt"]. */
const aliasArray = z
  .string()
  .optional()
  .transform((v) => {
    if (!v || v.trim() === "") return [] as string[]
    return v
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  })

export const lieferantInsertSchema = z.object({
  name: z.string().min(1, "Pflichtfeld"),
  alias: aliasArray,
  ustid: textOrNull,
  iban: textOrNull,
  standard_gewerk: textOrNull,
  standard_konto: textOrNull,
  firma_id: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() !== "" ? v.trim() : null)),
})

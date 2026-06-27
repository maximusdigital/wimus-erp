import { z } from "zod"

/** Berichtsposition – Spec 0002, reporting_taxonomie. mapping = { art, konten[] }. */
export const taxonomieInsertSchema = z.object({
  position_code: z.string().min(1, "Pflichtfeld").transform((v) => v.trim()),
  bezeichnung: z.string().min(1, "Pflichtfeld").transform((v) => v.trim()),
  art: z.enum(["ertrag", "aufwand", "neutral"]),
  konten: z.array(z.string().min(1)).default([]),
})

export type TaxonomieInsert = z.infer<typeof taxonomieInsertSchema>

/** Baut die DB-Zeile (mapping JSONB) aus den Formularfeldern. */
export function toTaxonomieRow(d: TaxonomieInsert) {
  return {
    position_code: d.position_code,
    bezeichnung: d.bezeichnung,
    mapping: { art: d.art, konten: d.konten },
  }
}

import { z } from "zod"

/** Persistierte Feststellung (Spec 0002, feststellungen). verteilung = JSONB-Array. */
export const feststellungInsertSchema = z.object({
  firma_id: z.string().uuid(),
  periode_von: z.string().min(1),
  periode_bis: z.string().min(1),
  ermitteltes_ergebnis: z.union([z.number(), z.string()]).transform((v) => {
    const n = typeof v === "number" ? v : Number(String(v).replace(",", "."))
    return Number.isFinite(n) ? n : 0
  }),
  verteilung: z
    .array(
      z.object({
        gesellschafter_id: z.string(),
        name: z.string().optional().nullable(),
        effektiv_quote: z.number(),
        anteil_betrag: z.number(),
      })
    )
    .default([]),
})

export type FeststellungInsert = z.infer<typeof feststellungInsertSchema>

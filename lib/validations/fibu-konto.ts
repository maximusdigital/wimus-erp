import { z } from "zod"

import { KONTOARTEN, SKR_BASEN } from "@/types/fibu-konto"

const textOrNull = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== "" ? v.trim() : null))

const enumOrNull = <T extends readonly [string, ...string[]]>(werte: T) =>
  z
    .string()
    .optional()
    .transform((v) => (v && v.trim() !== "" ? v.trim() : null))
    .refine(
      (v) => v === null || (werte as readonly string[]).includes(v),
      "Ungültiger Wert"
    )

export const fibuKontoFormSchema = z.object({
  kontonummer: z.string().min(1, "Pflichtfeld"),
  bezeichnung: z.string().min(1, "Pflichtfeld"),
  kontoart: z.string().optional(),
  skr_basis: z.string().optional(),
  ust_automatik: z.string().optional(),
  firma_id: z.string().optional(),
})

export type FibuKontoFormValues = z.infer<typeof fibuKontoFormSchema>

export const fibuKontoInsertSchema = z.object({
  kontonummer: z.string().min(1, "Pflichtfeld"),
  bezeichnung: z.string().min(1, "Pflichtfeld"),
  kontoart: enumOrNull(KONTOARTEN),
  skr_basis: enumOrNull(SKR_BASEN),
  ust_automatik: textOrNull,
  firma_id: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() !== "" ? v.trim() : null)),
})

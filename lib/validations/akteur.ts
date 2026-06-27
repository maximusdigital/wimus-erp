import { z } from "zod"

const optUuid = z
  .string()
  .uuid()
  .optional()
  .nullable()
  .transform((v) => (v && v.trim() !== "" ? v : null))

const optText = z
  .string()
  .optional()
  .nullable()
  .transform((v) => (v && v.trim() !== "" ? v.trim() : null))

export const AKTEUR_TYPEN = [
  { value: "mensch", label: "Mensch" },
  { value: "ki", label: "KI-Agent" },
  { value: "extern", label: "Extern" },
] as const

/** Akteur (Träger von Vorgängen, Mensch/KI/extern) – Spec 0004/0001. */
export const akteurInsertSchema = z.object({
  name: z.string().min(1, "Pflichtfeld"),
  typ: z.enum(["mensch", "ki", "extern"]).default("mensch"),
  kontakt_id: optUuid,
  organisation_id: optUuid,
  ki_modell: optText,
  bereich: z.array(z.string()).default([]),
  aktiv: z.boolean().default(true),
})

export type AkteurInsert = z.infer<typeof akteurInsertSchema>

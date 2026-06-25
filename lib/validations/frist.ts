import { z } from "zod"

import { FRIST_STATUS, FRIST_TYPEN } from "@/types/frist"

// Client-Form-Schema (Strings; erinnerung als kommaseparierte Liste).
export const fristFormSchema = z.object({
  frist_typ: z.enum(FRIST_TYPEN),
  bezeichnung: z.string().optional(),
  start_datum: z.string().optional(),
  faellig_am: z.string().min(1, "Pflichtfeld"),
  erinnerung_tage_vorher: z.string().optional(),
  aktion_typ: z.string().optional(),
  status: z.enum(FRIST_STATUS),
})

export type FristFormValues = z.infer<typeof fristFormSchema>

const textOrNull = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== "" ? v.trim() : null))

/** "30, 14, 7, 1" → [30,14,7,1]; leer → null. */
const intArrayOrNull = z
  .string()
  .optional()
  .transform((v) => {
    if (!v || v.trim() === "") return null
    const arr = v
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isInteger(n) && n >= 0)
    return arr.length > 0 ? arr : null
  })

// Server-Insert-Schema. mandant_id serverseitig.
export const fristInsertSchema = z.object({
  frist_typ: z.enum(FRIST_TYPEN),
  bezeichnung: textOrNull,
  start_datum: textOrNull,
  faellig_am: z.string().min(1, "Pflichtfeld"),
  erinnerung_tage_vorher: intArrayOrNull,
  aktion_typ: textOrNull,
  status: z.enum(FRIST_STATUS),
})

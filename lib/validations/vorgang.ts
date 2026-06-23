import { z } from "zod"

import {
  VORGANG_KOSTENTRAEGER,
  VORGANG_PRIORITAET,
  VORGANG_STATUS,
  VORGANG_TYPEN,
} from "@/types/vorgang"

// ---------------------------------------------------------------------------
// Client-Form-Schema: alle Felder als String (UI-Eingaben).
// titel ist Pflicht; status/prioritaet als Enum (mit Defaults).
// ---------------------------------------------------------------------------
export const vorgangFormSchema = z.object({
  titel: z.string().min(1, "Pflichtfeld"),
  beschreibung: z.string().optional(),
  objekt_id: z.string().optional(),
  einheit_id: z.string().optional(),
  typ: z.string().optional(),
  prioritaet: z.enum(VORGANG_PRIORITAET),
  kostentraeger: z.string().optional(),
  faellig_am: z.string().optional(),
  status: z.enum(VORGANG_STATUS),
})

export type VorgangFormValues = z.infer<typeof vorgangFormSchema>

// ---------------------------------------------------------------------------
// Server-Insert-Schema: bereinigt + typisiert die rohen Form-Werte.
// ---------------------------------------------------------------------------
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

const enumOrNull = (values: readonly string[]) =>
  z
    .string()
    .optional()
    .transform((v) => (v && v.trim() !== "" ? v : null))
    .refine((v) => v === null || values.includes(v), {
      message: "Ungültige Auswahl",
    })

export const vorgangInsertSchema = z.object({
  titel: z.string().min(1, "Pflichtfeld").transform((v) => v.trim()),
  beschreibung: textOrNull,
  objekt_id: uuidOrNull,
  einheit_id: uuidOrNull,
  typ: enumOrNull(VORGANG_TYPEN),
  prioritaet: z.enum(VORGANG_PRIORITAET),
  kostentraeger: enumOrNull(VORGANG_KOSTENTRAEGER),
  faellig_am: textOrNull,
  status: z.enum(VORGANG_STATUS),
})

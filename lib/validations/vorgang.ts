import { z } from "zod"

import {
  MASSNAHME_TYPEN,
  VORGANG_KOSTENTRAEGER,
  VORGANG_PRIORITAET,
  VORGANG_STATUS,
  VORGANG_TYPEN,
} from "@/types/vorgang"

// ---------------------------------------------------------------------------
// Client-Form-Schema: alle Felder als String (UI-Eingaben).
// status/prioritaet als Enum (mit Defaults). aktenzeichen/lfd_nr sind AUTO
// (DB-Trigger) und tauchen hier NICHT auf.
// ---------------------------------------------------------------------------
export const vorgangFormSchema = z.object({
  objekt_id: z.string().optional(),
  einheit_id: z.string().optional(),
  gemeldet_von: z.string().optional(),
  handwerker_id: z.string().optional(),
  typ: z.string().optional(),
  massnahme_typ: z.string().optional(),
  prioritaet: z.enum(VORGANG_PRIORITAET),
  status: z.enum(VORGANG_STATUS),
  kostentraeger: z.string().optional(),
  kosten_geschaetzt: z.string().optional(),
  kosten_ist: z.string().optional(),
  leistungsdatum: z.string().optional(),
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

const numberOrNull = z
  .union([z.string(), z.number()])
  .optional()
  .transform((v) => {
    if (v === undefined || v === null) return null
    if (typeof v === "number") return Number.isFinite(v) ? v : null
    const trimmed = v.trim()
    if (trimmed === "") return null
    const n = Number(trimmed.replace(",", "."))
    return Number.isFinite(n) ? n : null
  })
  .refine((v) => v === null || Number.isFinite(v), {
    message: "Ungültiger Betrag",
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
  objekt_id: uuidOrNull,
  einheit_id: uuidOrNull,
  gemeldet_von: uuidOrNull,
  handwerker_id: uuidOrNull,
  typ: enumOrNull(VORGANG_TYPEN),
  massnahme_typ: enumOrNull(MASSNAHME_TYPEN),
  prioritaet: z.enum(VORGANG_PRIORITAET),
  status: z.enum(VORGANG_STATUS),
  kostentraeger: enumOrNull(VORGANG_KOSTENTRAEGER),
  kosten_geschaetzt: numberOrNull,
  kosten_ist: numberOrNull,
  leistungsdatum: textOrNull,
})

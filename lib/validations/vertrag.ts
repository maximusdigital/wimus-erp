import { z } from "zod"

import { VERTRAGSARTEN, VERTRAG_STATUS } from "@/types/vertrag"

// ---------------------------------------------------------------------------
// Client-Form-Schema: alle Felder als String (UI-Eingaben).
// unbefristet als "ja"/"nein"-Auswahl → Boolean erst im Insert.
// ---------------------------------------------------------------------------
const numericString = z
  .string()
  .optional()
  .refine((v) => !v || !Number.isNaN(Number(v)), { message: "Ungültige Zahl" })

export const vertragFormSchema = z.object({
  vertragsnummer: z.string().optional(),
  vertragsart: z.string().optional(),
  status: z.enum(VERTRAG_STATUS),
  objekt_id: z.string().optional(),
  einheit_id: z.string().optional(),
  mieter_id: z.string().optional(),
  beginn: z.string().optional(),
  ende: z.string().optional(),
  unbefristet: z.enum(["ja", "nein"]),
  grundmiete: numericString,
  bk_pauschale: numericString,
  heizkosten_pauschale: numericString,
  strompauschale: numericString,
  faelligkeitsregel: z.string().optional(),
})

export type VertragFormValues = z.infer<typeof vertragFormSchema>

// ---------------------------------------------------------------------------
// Server-Insert-Schema: bereinigt + typisiert die rohen Form-Werte.
// ---------------------------------------------------------------------------
const textOrNull = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== "" ? v.trim() : null))

const numberOrNull = z
  .union([z.string(), z.number()])
  .optional()
  .transform((v) => (v === "" || v == null ? null : Number(v)))
  .refine((v) => v === null || !Number.isNaN(v), { message: "Ungültige Zahl" })

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

export const vertragInsertSchema = z.object({
  vertragsnummer: textOrNull,
  vertragsart: enumOrNull(VERTRAGSARTEN),
  status: z.enum(VERTRAG_STATUS),
  objekt_id: uuidOrNull,
  einheit_id: uuidOrNull,
  mieter_id: uuidOrNull,
  beginn: textOrNull,
  ende: textOrNull,
  unbefristet: z
    .union([z.boolean(), z.enum(["ja", "nein"])])
    .transform((v) => v === true || v === "ja"),
  grundmiete: numberOrNull,
  bk_pauschale: numberOrNull,
  heizkosten_pauschale: numberOrNull,
  strompauschale: numberOrNull,
  faelligkeitsregel: textOrNull,
})

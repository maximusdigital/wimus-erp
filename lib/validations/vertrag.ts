import { z } from "zod"

import { VERTRAGSTYPEN, VERTRAG_STATUS } from "@/types/vertrag"

// ---------------------------------------------------------------------------
// Client-Form-Schema: alle Felder als String (UI-Eingaben).
// ---------------------------------------------------------------------------
const numericString = z
  .string()
  .optional()
  .refine((v) => !v || !Number.isNaN(Number(v)), { message: "Ungültige Zahl" })

export const vertragFormSchema = z.object({
  vertragstyp: z.string().optional(),
  status: z.enum(VERTRAG_STATUS),
  einheit_id: z.string().optional(),
  mieter_id: z.string().optional(),
  mietbeginn: z.string().optional(),
  mietende: z.string().optional(),
  kdu_relevant: z.enum(["ja", "nein"]),
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
  vertragstyp: enumOrNull(VERTRAGSTYPEN),
  status: z.enum(VERTRAG_STATUS),
  einheit_id: uuidOrNull,
  mieter_id: uuidOrNull,
  mietbeginn: textOrNull,
  mietende: textOrNull,
  kdu_relevant: z
    .union([z.boolean(), z.enum(["ja", "nein"])])
    .transform((v) => v === true || v === "ja"),
  grundmiete: numberOrNull,
  bk_pauschale: numberOrNull,
  heizkosten_pauschale: numberOrNull,
  strompauschale: numberOrNull,
  faelligkeitsregel: textOrNull,
})

import { z } from "zod"

import { FORDERUNG_STATUS, FORDERUNG_TYPEN } from "@/types/forderung"

// Client-Form-Schema (Strings).
export const forderungFormSchema = z.object({
  kontakt_id: z.string().min(1, "Pflichtfeld"),
  mietvertrag_id: z.string().optional(),
  einheit_id: z.string().optional(),
  forderung_typ: z.enum(FORDERUNG_TYPEN),
  schaden_typ: z.string().optional(),
  betrag: z.string().min(1, "Pflichtfeld"),
  faellig_am: z.string().min(1, "Pflichtfeld"),
  bezahlt_betrag: z.string().optional(),
  bezahlt_am: z.string().optional(),
  status: z.enum(FORDERUNG_STATUS),
  notiz: z.string().optional(),
})

export type ForderungFormValues = z.infer<typeof forderungFormSchema>

const textOrNull = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== "" ? v.trim() : null))

const numberOrNull = z
  .union([z.string(), z.number()])
  .optional()
  .transform((v) => (v === "" || v == null ? null : Number(String(v).replace(",", "."))))
  .refine((v) => v === null || !Number.isNaN(v), { message: "Ungültige Zahl" })

const uuidOrNull = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== "" ? v.trim() : null))
  .refine((v) => v === null || z.string().uuid().safeParse(v).success, {
    message: "Ungültige Auswahl",
  })

// Server-Insert-Schema. kontakt_id + betrag + faellig_am + forderung_typ Pflicht;
// mandant_id wird serverseitig ergänzt.
export const forderungInsertSchema = z.object({
  kontakt_id: z.string().uuid("Ungültiger Kontakt"),
  mietvertrag_id: uuidOrNull,
  einheit_id: uuidOrNull,
  forderung_typ: z.enum(FORDERUNG_TYPEN),
  schaden_typ: textOrNull,
  betrag: z
    .union([z.string(), z.number()])
    .transform((v) => Number(String(v).replace(",", ".")))
    .refine((v) => !Number.isNaN(v), { message: "Ungültige Zahl" }),
  faellig_am: z.string().min(1, "Pflichtfeld"),
  bezahlt_betrag: numberOrNull,
  bezahlt_am: textOrNull,
  status: z.enum(FORDERUNG_STATUS),
  notiz: textOrNull,
})

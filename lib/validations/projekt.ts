import { z } from "zod"

import { PROJEKT_STATUS, PROJEKT_TYPEN } from "@/types/projekt"

// ---------------------------------------------------------------------------
// Client-Form-Schema: alle Felder als String (UI-Eingaben).
// ---------------------------------------------------------------------------
export const projektFormSchema = z.object({
  name: z.string().min(1, "Pflichtfeld"),
  kuerzel: z.string().min(1, "Pflichtfeld").max(20, "Max. 20 Zeichen"),
  typ: z.string().optional(),
  status: z.enum(PROJEKT_STATUS),
  firma_id: z.string().optional(),
  parent_projekt_id: z.string().optional(),
  marke: z.string().optional(),
  domain: z.string().optional(),
  email: z.string().optional(),
  telefon: z.string().optional(),
  whatsapp: z.string().optional(),
  ci_farbe_primary: z.string().optional(),
  aktiv: z.enum(["ja", "nein"]),
})

export type ProjektFormValues = z.infer<typeof projektFormSchema>

// ---------------------------------------------------------------------------
// Server-Insert-Schema: bereinigt + typisiert. workspace_id wird serverseitig
// ergänzt (wie mandant_id bei Objekten).
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

export const projektInsertSchema = z.object({
  name: z.string().min(1, "Pflichtfeld").transform((v) => v.trim()),
  kuerzel: z
    .string()
    .min(1, "Pflichtfeld")
    .max(20, "Max. 20 Zeichen")
    .transform((v) => v.trim().toUpperCase()),
  typ: enumOrNull(PROJEKT_TYPEN),
  status: z.enum(PROJEKT_STATUS),
  firma_id: uuidOrNull,
  parent_projekt_id: uuidOrNull,
  marke: textOrNull,
  domain: textOrNull,
  email: textOrNull,
  telefon: textOrNull,
  whatsapp: textOrNull,
  ci_farbe_primary: textOrNull,
  aktiv: z
    .union([z.boolean(), z.enum(["ja", "nein"])])
    .transform((v) => v === true || v === "ja"),
})

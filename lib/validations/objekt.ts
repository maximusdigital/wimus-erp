import { z } from "zod"

import { HALTESTRATEGIEN, OBJEKTTYPEN, OBJEKT_STATUS } from "@/types/objekt"

// ---------------------------------------------------------------------------
// Client-Form-Schema: alle Felder als String (UI-Eingaben), keine Typ-Transform.
// → kompatibel mit react-hook-form FormField (keine Transformed-Values-Friktion).
// ---------------------------------------------------------------------------
const numericString = z
  .string()
  .optional()
  .refine((v) => !v || !Number.isNaN(Number(v)), { message: "Ungültige Zahl" })

export const objektFormSchema = z.object({
  kuerzel: z.string().min(1, "Pflichtfeld").max(20, "Max. 20 Zeichen"),
  bezeichnung: z.string().optional(),
  strasse: z.string().optional(),
  hausnummer: z.string().optional(),
  plz: z.string().optional(),
  ort: z.string().optional(),
  objekttyp: z.string().optional(),
  haltestrategie: z.string().optional(),
  status: z.enum(OBJEKT_STATUS),
  baujahr: numericString,
  wohnflaeche_qm: numericString,
  marktwert_sprengnetter: numericString,
  marktwert_pricehubble: numericString,
  nutzen_lasten_datum: z.string().optional(),
  notartermin_datum: z.string().optional(),
  notiz: z.string().optional(),
})

export type ObjektFormValues = z.infer<typeof objektFormSchema>

// ---------------------------------------------------------------------------
// Server-Insert-Schema: bereinigt + typisiert die rohen Form-Werte.
// leere Eingabe → null, Zahlen → number, Enums geprüft.
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

const enumOrNull = (values: readonly string[]) =>
  z
    .string()
    .optional()
    .transform((v) => (v && v.trim() !== "" ? v : null))
    .refine((v) => v === null || values.includes(v), {
      message: "Ungültige Auswahl",
    })

export const objektInsertSchema = z.object({
  kuerzel: z
    .string()
    .min(1, "Pflichtfeld")
    .max(20, "Max. 20 Zeichen")
    .transform((v) => v.trim().toUpperCase()),
  bezeichnung: textOrNull,
  strasse: textOrNull,
  hausnummer: textOrNull,
  plz: textOrNull,
  ort: textOrNull,
  objekttyp: enumOrNull(OBJEKTTYPEN),
  haltestrategie: enumOrNull(HALTESTRATEGIEN),
  status: z.enum(OBJEKT_STATUS),
  baujahr: numberOrNull,
  wohnflaeche_qm: numberOrNull,
  marktwert_sprengnetter: numberOrNull,
  marktwert_pricehubble: numberOrNull,
  nutzen_lasten_datum: textOrNull,
  notartermin_datum: textOrNull,
  notiz: textOrNull,
})

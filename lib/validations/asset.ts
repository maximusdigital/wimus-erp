import { z } from "zod"

import {
  ASSET_STANDORT_TYP,
  ASSET_TYPEN,
  ASSET_ZUSTAND,
} from "@/types/asset"

// ---------------------------------------------------------------------------
// Client-Form-Schema: alle Felder als String (UI-Eingaben).
// bezeichnung ist Pflicht; Rest optional.
// ---------------------------------------------------------------------------
const numericString = z
  .string()
  .optional()
  .refine((v) => !v || !Number.isNaN(Number(v)), { message: "Ungültige Zahl" })

export const assetFormSchema = z.object({
  bezeichnung: z.string().min(1, "Pflichtfeld"),
  typ: z.string().optional(),
  asset_code: z.string().optional(),
  zustand: z.string().optional(),
  standort_typ: z.string().optional(),
  objekt_id: z.string().optional(),
  einheit_id: z.string().optional(),
  anschaffung_am: z.string().optional(),
  anschaffung_wert: numericString,
})

export type AssetFormValues = z.infer<typeof assetFormSchema>

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

export const assetInsertSchema = z.object({
  bezeichnung: z.string().min(1, "Pflichtfeld").transform((v) => v.trim()),
  typ: enumOrNull(ASSET_TYPEN),
  // asset_code → trim, leer → null (UNIQUE je mandant_id, asset_code).
  asset_code: textOrNull,
  zustand: enumOrNull(ASSET_ZUSTAND),
  standort_typ: enumOrNull(ASSET_STANDORT_TYP),
  objekt_id: uuidOrNull,
  einheit_id: uuidOrNull,
  anschaffung_am: textOrNull,
  anschaffung_wert: numberOrNull,
})

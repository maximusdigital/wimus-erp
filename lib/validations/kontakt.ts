import { z } from "zod"

import { KONTAKT_TYPEN } from "@/types/kontakt"

// ---------------------------------------------------------------------------
// Client-Form-Schema: alle Felder als String (UI-Eingaben).
// dsgvo_datenweitergabe als "ja"/"nein"-Auswahl → Boolean erst im Insert.
// ---------------------------------------------------------------------------
export const kontaktFormSchema = z.object({
  typ: z.enum(KONTAKT_TYPEN),
  anrede: z.string().optional(),
  vorname: z.string().optional(),
  nachname: z.string().optional(),
  firma: z.string().optional(),
  email: z
    .string()
    .optional()
    .refine((v) => !v || z.string().email().safeParse(v).success, {
      message: "Ungültige E-Mail",
    }),
  telefon: z.string().optional(),
  strasse: z.string().optional(),
  plz: z.string().optional(),
  ort: z.string().optional(),
  ausweis_nr: z.string().optional(),
  dsgvo_datenweitergabe: z.enum(["nein", "ja"]),
  dsgvo_einwilligung_am: z.string().optional(),
  notiz: z.string().optional(),
})

export type KontaktFormValues = z.infer<typeof kontaktFormSchema>

// ---------------------------------------------------------------------------
// Server-Insert-Schema: bereinigt + typisiert die rohen Form-Werte.
// ---------------------------------------------------------------------------
const textOrNull = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== "" ? v.trim() : null))

const emailOrNull = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== "" ? v.trim() : null))
  .refine((v) => v === null || z.string().email().safeParse(v).success, {
    message: "Ungültige E-Mail",
  })

export const kontaktInsertSchema = z.object({
  typ: z.enum(KONTAKT_TYPEN),
  anrede: textOrNull,
  vorname: textOrNull,
  nachname: textOrNull,
  firma: textOrNull,
  email: emailOrNull,
  telefon: textOrNull,
  strasse: textOrNull,
  plz: textOrNull,
  ort: textOrNull,
  ausweis_nr: textOrNull,
  dsgvo_datenweitergabe: z
    .union([z.boolean(), z.enum(["nein", "ja"])])
    .transform((v) => v === true || v === "ja"),
  dsgvo_einwilligung_am: textOrNull,
  notiz: textOrNull,
})

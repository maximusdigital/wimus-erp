import { z } from "zod"

import { KONTAKT_TYP, SPRACHEN } from "@/types/kontakt"

// ---------------------------------------------------------------------------
// Client-Form-Schema: alle Felder als String/Boolean (UI-Eingaben).
// dsgvo_datenweitergabe als "ja"/"nein"-Auswahl → Boolean erst im Insert.
// Rollen (ist_*) als Checkbox-Booleans.
// ---------------------------------------------------------------------------
export const kontaktFormSchema = z.object({
  kontakt_typ: z.enum(KONTAKT_TYP),
  anrede: z.string().optional(),
  vorname: z.string().optional(),
  nachname: z.string().optional(),
  firmenname: z.string().optional(),
  rechtsform: z.string().optional(),
  email: z
    .string()
    .optional()
    .refine((v) => !v || z.string().email().safeParse(v).success, {
      message: "Ungültige E-Mail",
    }),
  telefon_mobil: z.string().optional(),
  telefon_festnetz: z.string().optional(),
  strasse: z.string().optional(),
  hausnummer: z.string().optional(),
  plz: z.string().optional(),
  stadt: z.string().optional(),
  land: z.string().optional(),
  iban: z.string().optional(),
  bic: z.string().optional(),
  debitor_nr: z.string().optional(),
  kreditor_nr: z.string().optional(),
  zahlungsziel_tage: z.string().optional(),
  sprache: z.enum(SPRACHEN).optional(),
  ist_mieter: z.boolean().optional(),
  ist_eigentuemer: z.boolean().optional(),
  ist_dienstleister: z.boolean().optional(),
  ist_makler: z.boolean().optional(),
  ist_tippgeber: z.boolean().optional(),
  ist_bank: z.boolean().optional(),
  dsgvo_datenweitergabe: z.enum(["nein", "ja"]),
  aktiv: z.enum(["nein", "ja"]),
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

const intOrNull = z
  .union([z.string(), z.number()])
  .optional()
  .transform((v) => {
    if (v === undefined || v === null || v === "") return null
    const n = typeof v === "number" ? v : parseInt(v, 10)
    return Number.isFinite(n) ? n : null
  })

const boolFlag = z
  .union([z.boolean(), z.enum(["nein", "ja"])])
  .optional()
  .transform((v) => v === true || v === "ja")

export const kontaktInsertSchema = z.object({
  kontakt_typ: z.enum(KONTAKT_TYP),
  anrede: textOrNull,
  vorname: textOrNull,
  nachname: textOrNull,
  firmenname: textOrNull,
  rechtsform: textOrNull,
  email: emailOrNull,
  telefon_mobil: textOrNull,
  telefon_festnetz: textOrNull,
  strasse: textOrNull,
  hausnummer: textOrNull,
  plz: textOrNull,
  stadt: textOrNull,
  land: textOrNull,
  iban: textOrNull,
  bic: textOrNull,
  debitor_nr: textOrNull,
  kreditor_nr: textOrNull,
  zahlungsziel_tage: intOrNull,
  sprache: z.enum(SPRACHEN).optional().nullable(),
  ist_mieter: boolFlag,
  ist_eigentuemer: boolFlag,
  ist_dienstleister: boolFlag,
  ist_makler: boolFlag,
  ist_tippgeber: boolFlag,
  ist_bank: boolFlag,
  dsgvo_datenweitergabe: z
    .union([z.boolean(), z.enum(["nein", "ja"])])
    .transform((v) => v === true || v === "ja"),
  aktiv: z
    .union([z.boolean(), z.enum(["nein", "ja"])])
    .optional()
    .transform((v) => v === undefined || v === true || v === "ja"),
})

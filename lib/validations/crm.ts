import { z } from "zod"

import {
  AKTIVITAET_TYPEN,
  CUSTOM_FIELD_ENTITAETEN,
  DEAL_STATUS,
  FELDTYPEN,
  LEAD_QUELLEN,
  MARKEN,
} from "@/lib/crm/constants"

const markeEnum = z.enum(MARKEN.map((m) => m.value) as [string, ...string[]])
const quelleEnum = z.enum(LEAD_QUELLEN.map((q) => q.value) as [string, ...string[]])
const typEnum = z.enum(AKTIVITAET_TYPEN.map((t) => t.value) as [string, ...string[]])
const feldtypEnum = z.enum(FELDTYPEN.map((f) => f.value) as [string, ...string[]])
const entitaetEnum = z.enum(CUSTOM_FIELD_ENTITAETEN as unknown as [string, ...string[]])
const statusEnum = z.enum(DEAL_STATUS as unknown as [string, ...string[]])

const optUuid = z
  .string()
  .uuid()
  .optional()
  .nullable()
  .transform((v) => (v && v.trim() !== "" ? v : null))

const optText = z
  .string()
  .optional()
  .nullable()
  .transform((v) => (v && v.trim() !== "" ? v.trim() : null))

const optNum = z
  .union([z.number(), z.string()])
  .optional()
  .nullable()
  .transform((v) => {
    if (v == null || v === "") return null
    const n = typeof v === "number" ? v : Number(v)
    return Number.isFinite(n) ? n : null
  })

// ---------- Pipeline ----------
export const pipelineInsertSchema = z.object({
  name: z.string().min(1, "Pflichtfeld"),
  beschreibung: optText,
  marke: markeEnum.default("uebergreifend"),
  sortierung: z.number().int().default(100),
  default_pipeline: z.boolean().default(false),
  aktiv: z.boolean().default(true),
})
export type PipelineInsert = z.infer<typeof pipelineInsertSchema>

// ---------- Stage ----------
export const stageInsertSchema = z.object({
  pipeline_id: z.string().uuid(),
  name: z.string().min(1, "Pflichtfeld"),
  sortierung: z.number().int().default(0),
  wahrscheinlichkeit: z.number().min(0).max(100).default(0),
  ist_gewonnen: z.boolean().default(false),
  ist_verloren: z.boolean().default(false),
  stalled_tage: z.number().int().positive().nullable().optional(),
  farbe: optText,
})

// ---------- Verloren-Grund ----------
export const verlorenGrundInsertSchema = z.object({
  bezeichnung: z.string().min(1, "Pflichtfeld"),
  sortierung: z.number().int().default(100),
  aktiv: z.boolean().default(true),
})

// ---------- Custom Field ----------
export const customFieldInsertSchema = z.object({
  entitaet: entitaetEnum,
  name: z.string().min(1, "Pflichtfeld"),
  feldtyp: feldtypEnum,
  optionen: z.array(z.string()).default([]),
  anzeige_hinzufuegen: z.boolean().default(true),
  anzeige_detail: z.boolean().default(true),
  pflicht: z.boolean().default(false),
  wichtig: z.boolean().default(false),
  pipeline_id: optUuid,
  sortierung: z.number().int().default(100),
  aktiv: z.boolean().default(true),
})

// ---------- Deal ----------
export const dealInsertSchema = z.object({
  // firma_id (Mandant/Einheit, INNEN) ist PFLICHT (Spec 0003).
  firma_id: z.string().uuid("Mandant/Einheit ist Pflicht"),
  pipeline_id: z.string().uuid(),
  stage_id: z.string().uuid(),
  titel: z.string().min(1, "Pflichtfeld"),
  kontakt_id: optUuid,
  organisation_id: optUuid,
  objekt_id: optUuid,
  einheit_immobilie_id: optUuid,
  wert: optNum,
  erwartetes_abschluss_datum: optText,
  owner_akteur_id: optUuid,
  custom_values: z.record(z.string(), z.unknown()).default({}),
})
export type DealInsert = z.infer<typeof dealInsertSchema>

export const dealPatchSchema = z.object({
  titel: z.string().min(1).optional(),
  stage_id: z.string().uuid().optional(),
  wert: optNum,
  erwartetes_abschluss_datum: optText,
  kontakt_id: optUuid,
  organisation_id: optUuid,
  objekt_id: optUuid,
  einheit_immobilie_id: optUuid,
  owner_akteur_id: optUuid,
  // Reaktivierung eines abgeschlossenen Deals (nur zurück auf offen).
  status: z.enum(["offen"]).optional(),
  verloren_grund_id: optUuid,
  abgeschlossen_am: z.null().optional(),
  custom_values: z.record(z.string(), z.unknown()).optional(),
})

export const dealAbschlussSchema = z
  .object({
    status: z.enum(["gewonnen", "verloren"]),
    verloren_grund_id: optUuid,
  })
  .refine((d) => d.status !== "verloren" || !!d.verloren_grund_id, {
    message: "Verloren erfordert einen Grund.",
    path: ["verloren_grund_id"],
  })

export const dealStageSchema = z.object({ stage_id: z.string().uuid() })

// ---------- Lead ----------
export const leadInsertSchema = z.object({
  name: z.string().min(1, "Pflichtfeld"),
  quelle: quelleEnum.default("manuell"),
  firma_id: optUuid,
  kontakt_id: optUuid,
  organisation_id: optUuid,
  objekt_bezug_id: optUuid,
  kontaktdaten: optText,
  anfrage_text: optText,
  labels: z.array(z.string()).default([]),
  custom_values: z.record(z.string(), z.unknown()).default({}),
})
export type LeadInsert = z.infer<typeof leadInsertSchema>

export const leadKonvertierenSchema = z.object({
  firma_id: z.string().uuid("Mandant/Einheit ist Pflicht"),
  pipeline_id: z.string().uuid(),
  stage_id: z.string().uuid(),
  titel: z.string().min(1, "Pflichtfeld"),
  kontakt_id: optUuid,
  organisation_id: optUuid,
  objekt_id: optUuid,
  wert: optNum,
})

export const leadVerwerfenSchema = z.object({
  verworfen_grund: z.string().min(1, "Grund ist Pflicht"),
})

// ---------- Aktivität ----------
export const aktivitaetInsertSchema = z.object({
  deal_id: z.string().uuid(),
  typ: typEnum.default("aufgabe"),
  titel: z.string().min(1, "Pflichtfeld"),
  beschreibung: optText,
  faellig_am: optText,
  sip_referenz: optText,
})

export const aktivitaetPatchSchema = z.object({
  erledigt: z.boolean().optional(),
  titel: z.string().min(1).optional(),
  beschreibung: optText,
  faellig_am: optText,
})

export const _statusEnum = statusEnum

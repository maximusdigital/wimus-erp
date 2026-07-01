import { z } from "zod"

/** Editierbare Benutzer-Stammdaten (Stufe 0): Name + Aktiv-Status. E-Mail/Rollen NICHT hier. */
export const benutzerUpdateSchema = z.object({
  vorname: z.string().trim().max(100).nullish(),
  nachname: z.string().trim().max(100).nullish(),
  aktiv: z.boolean().optional(),
})

export type BenutzerUpdate = z.infer<typeof benutzerUpdateSchema>

/**
 * Neuen Benutzer anlegen (Stufe 0): Auth-Identität + Mandant. Rollen = Stufe 1.
 * mandant_id: permissive UUID-Regex (die realen Seed-Mandant-IDs wie 1111…-1111
 * sind KEINE RFC-4122-konformen UUIDs → z.uuid() würde sie fälschlich ablehnen;
 * Postgres akzeptiert sie).
 */
const UUID_LOSE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
export const benutzerCreateSchema = z.object({
  email: z.string().trim().email("Gültige E-Mail erforderlich."),
  vorname: z.string().trim().max(100).nullish(),
  nachname: z.string().trim().max(100).nullish(),
  mandant_id: z.string().regex(UUID_LOSE, "Mandant erforderlich."),
})

export type BenutzerCreate = z.infer<typeof benutzerCreateSchema>

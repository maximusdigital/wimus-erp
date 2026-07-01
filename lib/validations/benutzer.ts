import { z } from "zod"

/** Editierbare Benutzer-Stammdaten (Stufe 0): Name + Aktiv-Status. E-Mail/Rollen NICHT hier. */
export const benutzerUpdateSchema = z.object({
  vorname: z.string().trim().max(100).nullish(),
  nachname: z.string().trim().max(100).nullish(),
  aktiv: z.boolean().optional(),
})

export type BenutzerUpdate = z.infer<typeof benutzerUpdateSchema>

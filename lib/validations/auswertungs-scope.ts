import { z } from "zod"

/** Gespeicherter Auswertungs-Scope (Preset) – Spec 0002, auswertungs_scopes. */
export const auswertungsScopeInsertSchema = z.object({
  name: z.string().min(1, "Pflichtfeld"),
  einheiten_set: z.array(z.string().uuid()).default([]),
  k1_set: z.array(z.string()).default([]),
  zeitraum_typ: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v && v.trim() !== "" ? v.trim() : null)),
  optionen: z.record(z.string(), z.unknown()).default({}),
})

export type AuswertungsScopeInsert = z.infer<typeof auswertungsScopeInsertSchema>

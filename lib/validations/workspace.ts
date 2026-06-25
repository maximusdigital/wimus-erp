import { z } from "zod"

export const workspaceFormSchema = z.object({
  name: z.string().min(1, "Pflichtfeld"),
  kuerzel: z.string().optional(),
  inhaber: z.string().optional(),
  strasse: z.string().optional(),
  hausnummer: z.string().optional(),
  plz: z.string().optional(),
  stadt: z.string().optional(),
  telefon: z.string().optional(),
  email: z.string().optional(),
  website: z.string().optional(),
  ci_farbe_primary: z.string().optional(),
  logo_url: z.string().optional(),
})

export type WorkspaceFormValues = z.infer<typeof workspaceFormSchema>

const textOrNull = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== "" ? v.trim() : null))

export const workspaceUpdateSchema = z.object({
  name: z.string().min(1, "Pflichtfeld").transform((v) => v.trim()),
  kuerzel: textOrNull,
  inhaber: textOrNull,
  strasse: textOrNull,
  hausnummer: textOrNull,
  plz: textOrNull,
  stadt: textOrNull,
  telefon: textOrNull,
  email: textOrNull,
  website: textOrNull,
  ci_farbe_primary: textOrNull,
  logo_url: textOrNull,
})

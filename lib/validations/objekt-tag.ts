import { z } from "zod"

import { TAG_DIMENSIONEN } from "@/lib/fibu/objekt-tags"

const dimEnum = z.enum(TAG_DIMENSIONEN.map((d) => d.value) as [string, ...string[]])

export const objektTagInsertSchema = z.object({
  objekt_id: z.string().uuid(),
  tag_typ: dimEnum,
  wert: z.string().min(1, "Pflichtfeld").transform((v) => v.trim()),
})

export type ObjektTagInsert = z.infer<typeof objektTagInsertSchema>

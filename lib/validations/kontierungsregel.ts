import { z } from "zod"

import { KONTIERUNG_SCOPES } from "@/types/kontierungsregel"

const textOrNull = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== "" ? v.trim() : null))

const numberOrNull = z
  .string()
  .optional()
  .transform((v) => {
    if (!v || v.trim() === "") return null
    const n = Number(v.replace(",", "."))
    return Number.isFinite(n) ? n : null
  })

export const kontierungsregelFormSchema = z.object({
  scope: z.enum(KONTIERUNG_SCOPES),
  firma_id: z.string().optional(),
  match: z.string().min(1, "Pflichtfeld"),
  soll_konto: z.string().min(1, "Pflichtfeld"),
  haben_logik: z.string().optional(),
  ust_satz: z.string().optional(),
  steuerschluessel: z.string().optional(),
  prioritaet: z.string().optional(),
})

export type KontierungsregelFormValues = z.infer<
  typeof kontierungsregelFormSchema
>

export const kontierungsregelInsertSchema = z.object({
  scope: z.enum(KONTIERUNG_SCOPES),
  firma_id: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() !== "" ? v.trim() : null)),
  match: z.string().min(1, "Pflichtfeld"),
  soll_konto: z.string().min(1, "Pflichtfeld"),
  haben_logik: textOrNull,
  ust_satz: numberOrNull,
  steuerschluessel: textOrNull,
  prioritaet: z
    .string()
    .optional()
    .transform((v) => {
      const n = Number((v ?? "").trim())
      return Number.isInteger(n) && n > 0 ? n : 100
    }),
})

import { z } from "zod"

/**
 * Schema-Validierung der Claude-Vision-Ergebnisse (Modul 004 ops).
 * Das Modell liefert JSON nach Prompt-Schema; hier wird es deterministisch
 * gegen die Erwartung geprüft, bevor etwas persistiert wird.
 */

export const zaehlerAnalyseSchema = z.object({
  zaehler: z
    .array(
      z.object({
        art: z
          .enum(["strom", "gas", "wasser_kalt", "wasser_warm", "heizung", "sonstiges"])
          .catch("sonstiges"),
        zaehlernummer: z.string().nullish().transform((v) => v ?? null),
        stand: z.number().nullish().transform((v) => v ?? null),
        einheit: z.string().nullish().transform((v) => v ?? null),
      })
    )
    .default([]),
  confidence: z.number().min(0).max(1).catch(0),
})
export type ZaehlerAnalyse = z.infer<typeof zaehlerAnalyseSchema>

export const abgleichAnalyseSchema = z.object({
  schaeden: z
    .array(
      z.object({
        ort: z.string().default(""),
        beschreibung: z.string().default(""),
        schaden_typ: z
          .enum(["boden", "wand", "sanitaer", "elektro", "moebel", "fenster", "sonstiges"])
          .nullish()
          .transform((v) => v ?? null),
        schwere: z
          .enum(["bagatell", "mittel", "gross", "grossschaden"])
          .nullish()
          .transform((v) => v ?? null),
        neu: z.boolean().catch(true),
        // Idempotenz-Markierung (gesetzt bei „Als Schaden anlegen"), optional.
        uebernommen: z.boolean().optional(),
        folge_vorgang_id: z.string().optional(),
      })
    )
    .default([]),
  confidence: z.number().min(0).max(1).catch(0),
})
export type AbgleichAnalyse = z.infer<typeof abgleichAnalyseSchema>

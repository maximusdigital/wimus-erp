import { z } from "zod"

const optNum = z
  .union([z.number(), z.string()])
  .optional()
  .nullable()
  .transform((v) => {
    if (v === null || v === undefined || v === "") return null
    const n = typeof v === "number" ? v : Number(v)
    return Number.isFinite(n) ? n : null
  })

const optText = z
  .string()
  .optional()
  .nullable()
  .transform((v) => (v && v.trim() !== "" ? v.trim() : null))

const optBool = z.boolean().optional().nullable()

/** Zusatztabelle je Vorgangstyp (Spec 0004). Tabelle = vorgang_<typ>. */
export const TYP_TABELLE: Record<string, string> = {
  reinigung: "vorgang_reinigung",
  uebergabe: "vorgang_uebergabe",
  wartung: "vorgang_wartung",
  reparatur: "vorgang_reparatur",
  schaden: "vorgang_schaden",
}

export const typSchemas: Record<string, z.ZodTypeAny> = {
  reinigung: z.object({
    turnaround: optBool,
    inventar_ok: optBool,
    naechster_checkin: optText,
    dauer_soll_min: optNum,
  }),
  uebergabe: z.object({
    richtung: z.enum(["einzug", "auszug"]).optional(),
    signatur_paperless_id: optText,
    kaution_relevant: optBool,
  }),
  wartung: z.object({
    intervall_typ: optText,
    naechste_faelligkeit: optText,
    pruefprotokoll_paperless_id: optText,
  }),
  reparatur: z.object({
    angebot_betrag: optNum,
    abgenommen: optBool,
    gewaehrleistung_bis: optText,
  }),
  schaden: z.object({
    schaden_typ: z
      .enum(["boden", "wand", "sanitaer", "elektro", "moebel", "fenster", "sonstiges"])
      .optional()
      .nullable(),
    schwere: z.enum(["bagatell", "mittel", "gross", "grossschaden"]).optional().nullable(),
    schaden_betrag: optNum,
    abwicklungsstufe: z
      .enum(["kaution", "plattform", "manuell", "mahnbescheid", "anwalt"])
      .optional()
      .nullable(),
    versicherungsfall: optBool,
    festgestellt_am: optText,
  }),
}

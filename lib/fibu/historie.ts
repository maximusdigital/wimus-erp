/**
 * FiBu als Historie-Lieferant (Modul 009, Backlog #14). Drei dünne Emitter über die
 * EINE protokolliere()-API — KEINE zweite Historie-Logik. Jeder Emitter ist
 * NICHT-BLOCKIEREND: ein Fehler darf den auslösenden FiBu-Vorgang (Zahlung/Mahnung/
 * Beleg) nie abbrechen. protokolliere() schluckt Fehler bereits; der zusätzliche
 * try/catch ist Gürtel-und-Hosenträger (z. B. falls der Aufruf selbst wirft).
 */
import { protokolliere } from "@/lib/historie/protokolliere"
import type { EntityRef, ProtokolliereInput } from "@/lib/historie/types"
import { formatEUR } from "@/lib/utils/format"
import { resolveK1Bezug } from "./k1-bezug"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbClient = any

/** Schreibt eine Aktivität, ohne jemals zu werfen (Historie blockiert nie). */
async function safe(client: DbClient, mandantId: string, input: ProtokolliereInput): Promise<void> {
  try {
    await protokolliere(client, mandantId, input)
  } catch {
    /* Historie ist best-effort – der FiBu-Vorgang läuft unabhängig weiter. */
  }
}

/**
 * `zahlung_eingegangen` — eine Einnahme wurde einem Mietvertrag/einer Forderung
 * zugeordnet (Bank-Auto-Import oder manuelle Zuordnung).
 */
export async function protokolliereZahlungEingegangen(
  client: DbClient,
  mandantId: string,
  p: {
    mietvertragId?: string | null
    einheitId?: string | null
    objektId?: string | null
    betrag: number
    datum?: string | null
    forderungId?: string | null
    quelle: "bank" | "manuell"
    akteurId?: string | null
  },
): Promise<void> {
  const primaer: EntityRef | undefined = p.mietvertragId
    ? { typ: "mietvertrag", id: p.mietvertragId }
    : undefined
  await safe(client, mandantId, {
    typ: "zahlung_eingegangen",
    modul: "fibu",
    titel: `Zahlung eingegangen: ${formatEUR(Math.abs(p.betrag))}`,
    payload: {
      betrag: p.betrag,
      datum: p.datum ?? null,
      forderung_id: p.forderungId ?? null,
      quelle: p.quelle,
    },
    akteurId: p.akteurId ?? null,
    primaerBezug: primaer,
    hierarchie:
      p.einheitId || p.objektId ? { einheit_id: p.einheitId ?? null, objekt_id: p.objektId ?? null } : undefined,
  })
}

/**
 * `mahnung_versandt` — eine Mahnung wurde ausgelöst/erstellt (Mahnlauf oder manuell).
 */
export async function protokolliereMahnungVersandt(
  client: DbClient,
  mandantId: string,
  p: {
    mietvertragId?: string | null
    mahnstufe: number
    betrag: number
    forderungId?: string | null
    akteurId?: string | null
  },
): Promise<void> {
  const primaer: EntityRef | undefined = p.mietvertragId
    ? { typ: "mietvertrag", id: p.mietvertragId }
    : undefined
  await safe(client, mandantId, {
    typ: "mahnung_versandt",
    modul: "fibu",
    titel: `Mahnung Stufe ${p.mahnstufe}: ${formatEUR(p.betrag)}`,
    payload: { mahnstufe: p.mahnstufe, betrag: p.betrag, forderung_id: p.forderungId ?? null },
    akteurId: p.akteurId ?? null,
    primaerBezug: primaer,
  })
}

/**
 * `beleg_verbucht` — ein Beleg wurde verbucht/kontiert (KI-Auto oder Freigabe Mensch).
 * Primär-Bezug = Objekt/Einheit aus dem K1 (falls auflösbar), sonst nur Mandant.
 */
export async function protokolliereBelegVerbucht(
  client: DbClient,
  mandantId: string,
  p: {
    belegId: string
    betrag?: number | null
    konto?: string | null
    art: "ki" | "mensch"
    k1?: string | null
    akteurId?: string | null
  },
): Promise<void> {
  // K1-Auflösung defensiv (DB-Lookup) – darf den Verbuchungs-Vorgang nie abbrechen.
  let bezug: Awaited<ReturnType<typeof resolveK1Bezug>> = {}
  try {
    bezug = await resolveK1Bezug(client, mandantId, p.k1)
  } catch {
    /* kein Bezug → nur Mandant */
  }
  await safe(client, mandantId, {
    typ: "beleg_verbucht",
    modul: "fibu",
    titel: p.betrag != null ? `Beleg verbucht: ${formatEUR(p.betrag)}` : "Beleg verbucht",
    payload: { beleg_id: p.belegId, betrag: p.betrag ?? null, konto: p.konto ?? null, art: p.art },
    akteurId: p.akteurId ?? null,
    primaerBezug: bezug.primaer,
    hierarchie: bezug.hierarchie,
  })
}

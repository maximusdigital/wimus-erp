/**
 * protokolliere() – die EINE API, die Module rufen, um eine fachliche Aktivität
 * in die Historie zu schreiben. Server-only. Schreibt `aktivitaeten` + leitet die
 * n:m-Bezüge über die Hierarchie ab (`aktivitaet_bezug`). Blockiert NIE den
 * auslösenden Vorgang: Fehler werden geschluckt + als {ok:false} gemeldet.
 */
import { bezuegeAusHierarchie, leiteBezuege } from "./bezug"
import type { Bezug, EntityRef, Hierarchie, ProtokolliereInput } from "./types"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbClient = any

export type ProtokollErgebnis = { ok: true; id: string } | { ok: false; error: string }

/**
 * Löst die Hierarchie-Eltern eines Primär-Bezugs auf (für abgeleitete Bezüge).
 * Defensiv: jede Lookup-Fehlerquelle wird geschluckt (Logging blockiert nie).
 */
export async function resolveHierarchie(client: DbClient, primaer: EntityRef): Promise<Hierarchie> {
  const h: Hierarchie = {}
  try {
    const einheitZuObjekt = async (einheitId?: string | null) => {
      if (!einheitId) return
      h.einheit_id = einheitId
      const { data } = await client.from("einheiten").select("objekt_id").eq("id", einheitId).maybeSingle()
      if (data?.objekt_id) h.objekt_id = data.objekt_id
    }

    switch (primaer.typ) {
      case "mietvertrag": {
        h.mietvertrag_id = primaer.id
        const { data } = await client.from("mietvertraege").select("mieter_id, einheit_id").eq("id", primaer.id).maybeSingle()
        if (data?.mieter_id) h.mieter_id = data.mieter_id
        await einheitZuObjekt(data?.einheit_id)
        break
      }
      case "buchung": {
        h.buchung_id = primaer.id
        const { data } = await client.from("buchungen").select("einheit_id, gast_id, mietvertrag_id").eq("id", primaer.id).maybeSingle()
        if (data?.gast_id) h.kontakt_id = data.gast_id
        if (data?.mietvertrag_id) h.mietvertrag_id = data.mietvertrag_id
        await einheitZuObjekt(data?.einheit_id)
        break
      }
      case "einheit": {
        await einheitZuObjekt(primaer.id)
        break
      }
      case "objekt":
        h.objekt_id = primaer.id
        break
      case "mieter":
        h.mieter_id = primaer.id
        break
      case "kontakt":
        h.kontakt_id = primaer.id
        break
      case "organisation":
        h.organisation_id = primaer.id
        break
      case "vorgang":
        h.vorgang_id = primaer.id
        break
    }
  } catch {
    /* Hierarchie best-effort – fehlende Eltern sind kein Fehler */
  }
  return h
}

export async function protokolliere(
  client: DbClient,
  mandantId: string,
  input: ProtokolliereInput,
): Promise<ProtokollErgebnis> {
  try {
    const { data: akt, error } = await client
      .from("aktivitaeten")
      .insert({
        mandant_id: mandantId,
        typ: input.typ,
        modul: input.modul,
        titel: input.titel,
        beschreibung: input.beschreibung ?? null,
        akteur_id: input.akteurId ?? null,
        payload: input.payload ?? null,
      })
      .select("id")
      .single()
    if (error || !akt) return { ok: false, error: error?.message ?? "Aktivität-Insert fehlgeschlagen." }

    // Primär-Bezug optional: fehlt er, ist die Aktivität „nur Mandant" (nur zentraler
    // Feed) — etwaige Hierarchie-IDs werden trotzdem als abgeleitete Bezüge gespeichert.
    let bezuege: Bezug[] = []
    if (input.primaerBezug) {
      const hierarchie: Hierarchie = {
        ...(await resolveHierarchie(client, input.primaerBezug)),
        ...(input.hierarchie ?? {}),
      }
      bezuege = leiteBezuege(input.primaerBezug, hierarchie)
    } else if (input.hierarchie) {
      bezuege = bezuegeAusHierarchie(input.hierarchie)
    }
    if (bezuege.length > 0) {
      const rows = bezuege.map((b) => ({
        aktivitaet_id: akt.id,
        bezug_typ: b.typ,
        bezug_id: b.id,
        quelle: b.quelle,
      }))
      // Bezug-Fehler darf die Aktivität nicht entwerten → nur best-effort.
      await client.from("aktivitaet_bezug").insert(rows)
    }
    return { ok: true, id: akt.id }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "protokolliere fehlgeschlagen." }
  }
}

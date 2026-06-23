/**
 * Paperless-ngx Anbindung (Phase 5, DMS) – NUR serverseitig.
 *
 * Schaltzentrale-Prinzip: Wir bauen kein DMS nach, sondern binden Paperless-ngx
 * per REST API an. Der API-Token ist ein Secret → ausschließlich serverseitig
 * (Server Components, Route Handler, n8n). Niemals an den Client geben.
 *
 * Konfiguration über Umgebungsvariablen:
 *   PAPERLESS_URL    z.B. https://dms.m81s.de
 *   PAPERLESS_TOKEN  API-Token aus Paperless (Einstellungen → API-Token)
 */

const BASE = process.env.PAPERLESS_URL?.replace(/\/$/, "")
const TOKEN = process.env.PAPERLESS_TOKEN

/** Ist die Paperless-Anbindung konfiguriert? */
export function paperlessConfigured(): boolean {
  return Boolean(BASE && TOKEN)
}

/** Öffentliche (Browser-)URL zur Detailansicht eines Dokuments in Paperless. */
export function paperlessDokumentUrl(id: number): string | null {
  return BASE ? `${BASE}/documents/${id}/details` : null
}

export type PaperlessDokument = {
  id: number
  title: string
  created: string | null
  added: string | null
  correspondentName: string | null
  documentTypeName: string | null
  tagIds: number[]
}

export type PaperlessListe =
  | { ok: true; count: number; results: PaperlessDokument[] }
  | { ok: false; reason: "not_configured" | "error"; message?: string }

type RawDoc = {
  id: number
  title: string | null
  created: string | null
  added: string | null
  correspondent: number | null
  document_type: number | null
  tags: number[] | null
  // Paperless kann mit ?full_perms o. ä. zusätzliche Felder liefern – ignoriert.
}

async function paperlessFetch(path: string): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      Authorization: `Token ${TOKEN}`,
      Accept: "application/json",
    },
    // DMS-Inhalte sind dynamisch – nicht cachen.
    cache: "no-store",
  })
  if (!res.ok) {
    throw new Error(`Paperless ${res.status} ${res.statusText}`)
  }
  return res.json()
}

/**
 * Dokumente auflisten (optional Volltextsuche).
 * Löst Korrespondent/Dokumenttyp-IDs in lesbare Namen auf (best effort).
 */
export async function paperlessListe(params?: {
  query?: string
  page?: number
}): Promise<PaperlessListe> {
  if (!paperlessConfigured()) return { ok: false, reason: "not_configured" }

  try {
    const search = new URLSearchParams({
      ordering: "-created",
      page: String(params?.page ?? 1),
      page_size: "25",
    })
    if (params?.query) search.set("query", params.query)

    const data = (await paperlessFetch(
      `/api/documents/?${search.toString()}`
    )) as { count: number; results: RawDoc[] }

    // Namens-Lookups (korrespondenten/typen) einmalig laden – tolerant bei Fehlern.
    const [korr, typen] = await Promise.all([
      loadLookup("/api/correspondents/"),
      loadLookup("/api/document_types/"),
    ])

    const results: PaperlessDokument[] = (data.results ?? []).map((d) => ({
      id: d.id,
      title: d.title ?? `Dokument #${d.id}`,
      created: d.created,
      added: d.added,
      correspondentName: d.correspondent != null ? (korr.get(d.correspondent) ?? null) : null,
      documentTypeName: d.document_type != null ? (typen.get(d.document_type) ?? null) : null,
      tagIds: d.tags ?? [],
    }))

    return { ok: true, count: data.count ?? results.length, results }
  } catch (err) {
    return {
      ok: false,
      reason: "error",
      message: err instanceof Error ? err.message : "Unbekannter Fehler",
    }
  }
}

/** id→name Lookup für eine Paperless-Ressource; leere Map bei Fehler. */
async function loadLookup(path: string): Promise<Map<number, string>> {
  try {
    const data = (await paperlessFetch(`${path}?page_size=250`)) as {
      results: { id: number; name: string }[]
    }
    return new Map((data.results ?? []).map((r) => [r.id, r.name]))
  } catch {
    return new Map()
  }
}

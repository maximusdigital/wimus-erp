/**
 * DocuSeal Anbindung (Phase 5, Unterschriften) – NUR serverseitig. STUB.
 *
 * Schaltzentrale-Prinzip: Signaturen werden über DocuSeal abgewickelt, nicht
 * nachgebaut. Dieser Client kapselt die REST-Anbindung; die Felder werden
 * ausgebaut, sobald eine DocuSeal-Instanz + Vorlagen bereitstehen.
 *
 * Konfiguration:
 *   DOCUSEAL_URL    z.B. https://sign.m81s.de
 *   DOCUSEAL_TOKEN  X-Auth-Token aus DocuSeal
 */

const BASE = process.env.DOCUSEAL_URL?.replace(/\/$/, "")
const TOKEN = process.env.DOCUSEAL_TOKEN

export function docusealConfigured(): boolean {
  return Boolean(BASE && TOKEN)
}

export type DocusealSubmission = {
  id: number
  status: string
  templateName: string | null
  createdAt: string | null
}

/**
 * Eine Signatur-Anforderung anstoßen (Submission aus Template + Empfänger).
 * Noch nicht implementiert – wirft bewusst, bis Instanz/Vorlagen stehen.
 */
export async function docusealCreateSubmission(_params: {
  templateId: number
  empfaenger: { email: string; name?: string }[]
}): Promise<DocusealSubmission> {
  if (!docusealConfigured()) {
    throw new Error("DocuSeal nicht konfiguriert (DOCUSEAL_URL/DOCUSEAL_TOKEN).")
  }
  throw new Error("DocuSeal-Anbindung noch nicht implementiert (Phase 5, geplant).")
}

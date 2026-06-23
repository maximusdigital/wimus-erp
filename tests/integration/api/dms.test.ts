import { afterEach, describe, expect, it, vi } from "vitest"

// Phase 5 – DMS: Paperless-Client + DocuSeal-Stub
// BASE/TOKEN werden beim Import gelesen -> stubEnv + resetModules + dynamic import.

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.resetModules()
})

async function loadPaperless(url?: string, token?: string) {
  vi.stubEnv("PAPERLESS_URL", url ?? "")
  vi.stubEnv("PAPERLESS_TOKEN", token ?? "")
  vi.resetModules()
  return import("@/lib/integrations/paperless")
}

describe("Paperless – nicht konfiguriert", () => {
  it("paperlessConfigured() = false ohne Env", async () => {
    const p = await loadPaperless()
    expect(p.paperlessConfigured()).toBe(false)
  })

  it("paperlessDokumentUrl -> null ohne BASE", async () => {
    const p = await loadPaperless()
    expect(p.paperlessDokumentUrl(5)).toBeNull()
  })

  it("paperlessListe -> not_configured", async () => {
    const p = await loadPaperless()
    const res = await p.paperlessListe()
    expect(res).toEqual({ ok: false, reason: "not_configured" })
  })
})

describe("Paperless – konfiguriert", () => {
  function mockFetch() {
    return vi.fn(async (input: string) => {
      const url = String(input)
      const json = (data: unknown) => ({
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => data,
      })
      if (url.includes("/api/documents/"))
        return json({
          count: 1,
          results: [
            {
              id: 5,
              title: "Stromrechnung 2026",
              created: "2026-01-10",
              added: "2026-01-11",
              correspondent: 1,
              document_type: 2,
              tags: [3, 4],
            },
          ],
        })
      if (url.includes("/api/correspondents/"))
        return json({ results: [{ id: 1, name: "Stadtwerke" }] })
      if (url.includes("/api/document_types/"))
        return json({ results: [{ id: 2, name: "Rechnung" }] })
      return json({})
    })
  }

  it("paperlessConfigured() = true + Detail-URL", async () => {
    const p = await loadPaperless("https://dms.example.com/", "tok")
    expect(p.paperlessConfigured()).toBe(true)
    // trailing slash wird entfernt
    expect(p.paperlessDokumentUrl(5)).toBe("https://dms.example.com/documents/5/details")
  })

  it("paperlessListe löst Korrespondent/Typ-Namen auf", async () => {
    vi.stubGlobal("fetch", mockFetch())
    const p = await loadPaperless("https://dms.example.com", "tok")
    const res = await p.paperlessListe({ query: "strom" })
    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(res.count).toBe(1)
    expect(res.results[0]).toMatchObject({
      id: 5,
      title: "Stromrechnung 2026",
      correspondentName: "Stadtwerke",
      documentTypeName: "Rechnung",
      tagIds: [3, 4],
    })
  })

  it("Fehlerhafte Antwort -> ok:false, reason error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 500,
        statusText: "Server Error",
        json: async () => ({}),
      }))
    )
    const p = await loadPaperless("https://dms.example.com", "tok")
    const res = await p.paperlessListe()
    expect(res.ok).toBe(false)
    if (res.ok) return
    expect(res.reason).toBe("error")
  })
})

describe("DocuSeal – Stub (Phase 5, geplant)", () => {
  async function loadDocuseal(url?: string, token?: string) {
    vi.stubEnv("DOCUSEAL_URL", url ?? "")
    vi.stubEnv("DOCUSEAL_TOKEN", token ?? "")
    vi.resetModules()
    return import("@/lib/integrations/docuseal")
  }

  it("nicht konfiguriert -> configured false + wirft", async () => {
    const d = await loadDocuseal()
    expect(d.docusealConfigured()).toBe(false)
    await expect(
      d.docusealCreateSubmission({ templateId: 1, empfaenger: [{ email: "a@b.de" }] })
    ).rejects.toThrow(/nicht konfiguriert/i)
  })

  it("konfiguriert -> wirft 'noch nicht implementiert'", async () => {
    const d = await loadDocuseal("https://sign.example.com", "tok")
    expect(d.docusealConfigured()).toBe(true)
    await expect(
      d.docusealCreateSubmission({ templateId: 1, empfaenger: [{ email: "a@b.de" }] })
    ).rejects.toThrow(/noch nicht implementiert/i)
  })
})

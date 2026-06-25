import { NextRequest } from "next/server"
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

// Phase 3 – KZV: Beds24-Webhook (Testing 50, Kap. 5.1)
// Admin-Client wird gemockt; secretOk/mandant lesen process.env zur Laufzeit.

const state = vi.hoisted(() => ({
  client: null as unknown,
  lastUpsert: null as Record<string, unknown> | null,
}))

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => state.client,
}))

import { POST } from "@/app/api/webhooks/beds24/route"

const SECRET = "test-secret-123"
const UUID = "11111111-1111-4111-8111-111111111111"

/** Minimaler chainbarer Supabase-Mock, der je Tabelle Daten liefert. */
function makeClient(opts: {
  einheit?: Record<string, unknown> | null
  objektMandantId?: string | null
  stadt?: string | null
  upsertError?: string
}) {
  const client = {
    // wimus-Schema: .schema("wimus") gibt denselben chainbaren Client zurück.
    schema: () => client,
    from(table: string) {
      const chain: Record<string, unknown> = {}
      const ret = () => chain
      chain.select = ret
      chain.eq = ret
      chain.limit = ret
      chain.upsert = (row: Record<string, unknown>) => {
        state.lastUpsert = row
        return chain
      }
      chain.maybeSingle = async () => {
        if (table === "einheiten") return { data: opts.einheit ?? null }
        if (table === "objekte")
          return {
            data: {
              mandant_id: opts.objektMandantId ?? null,
              stadt: opts.stadt ?? null,
            },
          }
        return { data: null }
      }
      chain.single = async () =>
        opts.upsertError
          ? { data: null, error: { message: opts.upsertError } }
          : { data: { id: "buchung-1" }, error: null }
      return chain
    },
  }
  return client
}

function req(
  body: unknown,
  { token = SECRET, raw }: { token?: string | null; raw?: string } = {}
) {
  const headers: Record<string, string> = { "content-type": "application/json" }
  if (token) headers["x-beds24-token"] = token
  return new NextRequest("http://localhost/api/webhooks/beds24", {
    method: "POST",
    headers,
    body: raw ?? JSON.stringify(body),
  })
}

beforeAll(() => {
  process.env.BEDS24_WEBHOOK_SECRET = SECRET
})

beforeEach(() => {
  state.client = makeClient({})
  state.lastUpsert = null
  delete process.env.BEDS24_DEFAULT_MANDANT_ID
})

afterEach(() => {
  vi.clearAllMocks()
})

describe("Beds24-Webhook POST", () => {
  it("ungültiges Secret -> 401", async () => {
    const res = await POST(req({ bookId: "1" }, { token: "falsch" }))
    expect(res.status).toBe(401)
  })

  it("fehlendes Secret -> 401", async () => {
    const res = await POST(req({ bookId: "1" }, { token: null }))
    expect(res.status).toBe(401)
  })

  it("ungültiger Payload (kein JSON-Objekt) -> 400", async () => {
    const res = await POST(req(null, { raw: "kein-json" }))
    expect(res.status).toBe(400)
  })

  it("fehlende beds24_id -> 400", async () => {
    const res = await POST(req({ checkin: "2026-06-01" }))
    expect(res.status).toBe(400)
  })

  it("Mandant nicht auflösbar (keine Einheit, kein Default) -> 422", async () => {
    const res = await POST(req({ bookId: "B1", checkin: "2026-06-01" }))
    expect(res.status).toBe(422)
  })

  it("neue Buchung -> 200, Keybox-PIN + CityTax übernommen", async () => {
    state.client = makeClient({
      einheit: {
        id: "e1",
        objekt_id: "o1",
        keybox_pin_statisch: "9999",
      },
      objektMandantId: "m1",
      stadt: "Stuttgart",
    })
    const res = await POST(
      req({
        bookId: "B100",
        einheit_id: UUID,
        checkin: "2026-06-01",
        checkout: "2026-06-04",
        personen: 2,
        status: "confirmed",
      })
    )
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toMatchObject({ ok: true, id: "buchung-1" })

    expect(state.lastUpsert).toMatchObject({
      mandant_id: "m1",
      einheit_id: "e1",
      beds24_id: "B100",
      keybox_pin: "9999",
      citytax_betrag: 18, // 3 € × 2 Pers. × 3 Nächte (Stuttgart)
      status: "bestaetigt",
    })
    // wimus.buchungen führt keine objekt_id mehr
    expect(state.lastUpsert?.objekt_id).toBeUndefined()
    // apartment_pin bleibt offen (TTLock via n8n)
    expect(state.lastUpsert?.apartment_pin).toBeUndefined()
  })

  it("Stornierung -> status 'storniert'", async () => {
    state.client = makeClient({
      einheit: { id: "e1", objekt_id: "o1", keybox_pin_statisch: null },
      objektMandantId: "m1",
    })
    const res = await POST(
      req({ bookId: "B100", einheit_id: UUID, status: "cancelled" })
    )
    expect(res.status).toBe(200)
    expect(state.lastUpsert?.status).toBe("storniert")
  })

  it("DB-Fehler beim Upsert -> 500", async () => {
    state.client = makeClient({
      einheit: { id: "e1", objekt_id: "o1", keybox_pin_statisch: null },
      objektMandantId: "m1",
      upsertError: "duplicate key",
    })
    const res = await POST(req({ bookId: "B100", einheit_id: UUID }))
    expect(res.status).toBe(500)
  })

  it("Default-Mandant greift, wenn Einheit fehlt", async () => {
    process.env.BEDS24_DEFAULT_MANDANT_ID = "m-default"
    state.client = makeClient({ einheit: null })
    const res = await POST(req({ bookId: "B200" }))
    expect(res.status).toBe(200)
    expect(state.lastUpsert?.mandant_id).toBe("m-default")
  })
})

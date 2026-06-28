import { NextRequest } from "next/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// Modul 007 – GreenAPI-Eingangs-Webhook. Admin-Client + persistiereEingehend gemockt,
// parseGreenApiWebhook läuft real.

const state = vi.hoisted(() => ({
  client: null as unknown,
  instanz: null as Record<string, unknown> | null,
  persistCalls: [] as unknown[][],
  persistResult: { nachricht_id: "n1", kontakt_id: "k1", neu: true } as Record<string, unknown>,
}))

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => state.client }))
vi.mock("@/lib/kommunikation/inbox", () => ({
  persistiereEingehend: (...args: unknown[]) => {
    state.persistCalls.push(args)
    return Promise.resolve(state.persistResult)
  },
}))

import { POST } from "@/app/api/webhooks/greenapi/route"

const TOKEN = "wh-token-xyz"
const ID_INSTANCE = "7103000000"

function makeClient(instanz: Record<string, unknown> | null) {
  const client = {
    from() {
      const chain: Record<string, unknown> = {}
      const ret = () => chain
      chain.select = ret
      chain.eq = ret
      chain.maybeSingle = async () => ({ data: instanz })
      return chain
    },
  }
  return client
}

function incomingPayload(over: Record<string, unknown> = {}) {
  return {
    typeWebhook: "incomingMessageReceived",
    instanceData: { idInstance: Number(ID_INSTANCE) },
    timestamp: 1750000000,
    idMessage: "MSG123",
    senderData: { chatId: "4915150000000@c.us", sender: "4915150000000@c.us" },
    messageData: { typeMessage: "textMessage", textMessageData: { textMessage: "Hallo" } },
    ...over,
  }
}

function req(body: unknown, { token = TOKEN, raw }: { token?: string | null; raw?: string } = {}) {
  const headers: Record<string, string> = { "content-type": "application/json" }
  if (token) headers["authorization"] = `Bearer ${token}`
  return new NextRequest("http://localhost/api/webhooks/greenapi", {
    method: "POST",
    headers,
    body: raw ?? JSON.stringify(body),
  })
}

beforeEach(() => {
  state.instanz = { id: "wa1", mandant_id: "m1", webhook_token: TOKEN, aktiv: true }
  state.client = makeClient(state.instanz)
  state.persistCalls = []
})
afterEach(() => vi.clearAllMocks())

describe("GreenAPI-Webhook POST", () => {
  it("ungültiger Payload -> 400", async () => {
    expect((await POST(req(null, { raw: "kein-json" }))).status).toBe(400)
  })

  it("fehlende idInstance -> 400", async () => {
    const res = await POST(req({ typeWebhook: "incomingMessageReceived" }))
    expect(res.status).toBe(400)
  })

  it("unbekannte/inaktive Instanz -> 404", async () => {
    state.client = makeClient(null)
    expect((await POST(req(incomingPayload()))).status).toBe(404)

    state.client = makeClient({ ...state.instanz, aktiv: false })
    expect((await POST(req(incomingPayload()))).status).toBe(404)
  })

  it("falscher/fehlender Token -> 401, kein Persist", async () => {
    expect((await POST(req(incomingPayload(), { token: "falsch" }))).status).toBe(401)
    expect((await POST(req(incomingPayload(), { token: null }))).status).toBe(401)
    expect(state.persistCalls).toHaveLength(0)
  })

  it("Status-Callback (keine Nachricht) -> 200 ignored, kein Persist", async () => {
    const res = await POST(req(incomingPayload({ typeWebhook: "outgoingMessageStatus" })))
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ ignored: true })
    expect(state.persistCalls).toHaveLength(0)
  })

  it("eingehende Nachricht -> 200, persistiereEingehend mit Mandant + Instanz", async () => {
    const res = await POST(req(incomingPayload()))
    expect(res.status).toBe(200)
    expect(state.persistCalls).toHaveLength(1)
    const [, ctx, nachricht] = state.persistCalls[0] as [unknown, Record<string, unknown>, Record<string, unknown>]
    expect(ctx).toMatchObject({ mandant_id: "m1", kanal: "whatsapp", wa_instanz_id: "wa1" })
    expect(nachricht).toMatchObject({ extern_id: "MSG123", text: "Hallo", kanal: "whatsapp" })
  })

  it("Token auch via ?token= akzeptiert", async () => {
    const r = new NextRequest(`http://localhost/api/webhooks/greenapi?token=${TOKEN}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(incomingPayload()),
    })
    expect((await POST(r)).status).toBe(200)
  })
})

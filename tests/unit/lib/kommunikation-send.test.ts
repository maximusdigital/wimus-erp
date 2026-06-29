import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// Modul 007 – Sende-Orchestrator. crypto/adapter/inbox gemockt; Client als Stub.

const state = vi.hoisted(() => ({
  instanz: null as Record<string, unknown> | null,
  token: "decrypted-token" as string | null,
  sendResult: { erfolg: true, extern_id: "WAMID1", status: "gesendet" } as Record<string, unknown>,
  persistCalls: [] as unknown[][],
  sendCalls: [] as unknown[][],
}))

vi.mock("@/lib/kommunikation/crypto", () => ({
  entschluessele: () => state.token,
}))
vi.mock("@/lib/kommunikation/adapters/whatsapp", () => ({
  erstelleWhatsappAdapter: () => ({
    kanal: "whatsapp",
    sendeNachricht: (input: unknown) => {
      state.sendCalls.push([input])
      return Promise.resolve(state.sendResult)
    },
  }),
}))
vi.mock("@/lib/kommunikation/inbox", () => ({
  persistiereAusgehend: (...args: unknown[]) => {
    state.persistCalls.push(args)
    return Promise.resolve({ nachricht_id: "n-out-1" })
  },
}))

import { sendeWhatsapp } from "@/lib/kommunikation/send"

function client() {
  return {
    from() {
      const chain: Record<string, unknown> = {}
      const ret = () => chain
      chain.select = ret
      chain.eq = ret
      chain.not = ret
      chain.order = ret
      chain.limit = ret
      chain.maybeSingle = async () => ({ data: state.instanz })
      return chain
    },
  }
}

beforeEach(() => {
  state.instanz = {
    id: "wa1", mandant_id: "m1", green_id_instance: "7105189176",
    green_api_host: "https://7105.api.greenapi.com", green_api_token_verschluesselt: "v1:…", aktiv: true,
  }
  state.token = "decrypted-token"
  state.sendResult = { erfolg: true, extern_id: "WAMID1", status: "gesendet" }
  state.persistCalls = []
  state.sendCalls = []
})
afterEach(() => vi.clearAllMocks())

describe("sendeWhatsapp", () => {
  it("unbekannte/inaktive Instanz → fehler, kein Senden", async () => {
    state.instanz = null
    const r1 = await sendeWhatsapp(client() as never, { wa_instanz_id: "x", an: "49…", text: "hi" })
    expect(r1).toMatchObject({ erfolg: false, status: "fehler", nachricht_id: null })

    state.instanz = { id: "wa1", aktiv: false }
    const r2 = await sendeWhatsapp(client() as never, { wa_instanz_id: "wa1", an: "49…", text: "hi" })
    expect(r2.status).toBe("fehler")
    expect(state.sendCalls).toHaveLength(0)
  })

  it("kein Token (entschlüsseln scheitert) → fehler", async () => {
    state.token = null
    const r = await sendeWhatsapp(client() as never, { wa_instanz_id: "wa1", an: "49…", text: "hi" })
    expect(r).toMatchObject({ erfolg: false, status: "fehler", nachricht_id: null })
    expect(state.sendCalls).toHaveLength(0)
  })

  it("Erfolg → Adapter gesendet + persistiert mit Mandant/Instanz", async () => {
    const r = await sendeWhatsapp(client() as never, {
      wa_instanz_id: "wa1", an: "4915150000000", text: "Hallo", kontakt_id: "k1",
    })
    expect(r).toMatchObject({ erfolg: true, status: "gesendet", extern_id: "WAMID1", nachricht_id: "n-out-1" })
    expect(state.sendCalls[0][0]).toMatchObject({ kanal: "whatsapp", an: ["4915150000000"], text: "Hallo" })
    const [, ctx, msg] = state.persistCalls[0] as [unknown, Record<string, unknown>, Record<string, unknown>]
    expect(ctx).toMatchObject({ mandant_id: "m1", kanal: "whatsapp", wa_instanz_id: "wa1" })
    expect(msg).toMatchObject({ an_adresse: "4915150000000", text: "Hallo", kontakt_id: "k1", status: "gesendet", extern_id: "WAMID1" })
  })

  it("Sende-Fehler → trotzdem persistiert (Status fehler), Ergebnis durchgereicht", async () => {
    state.sendResult = { erfolg: false, extern_id: null, status: "fehler", fehler_text: "GreenAPI HTTP 466" }
    const r = await sendeWhatsapp(client() as never, { wa_instanz_id: "wa1", an: "49…", text: "x", kontakt_id: "k1" })
    expect(r).toMatchObject({ erfolg: false, status: "fehler", fehler_text: "GreenAPI HTTP 466", nachricht_id: "n-out-1" })
    expect(state.persistCalls).toHaveLength(1)
    const [, , msg] = state.persistCalls[0] as [unknown, unknown, Record<string, unknown>]
    expect(msg).toMatchObject({ status: "fehler", fehler_text: "GreenAPI HTTP 466" })
  })
})

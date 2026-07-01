import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextResponse } from "next/server"

const MID = "11111111-1111-1111-1111-111111111111"
const OTHER = "22222222-2222-2222-2222-222222222222"

// --- Mocks der Route-Abhängigkeiten ---
const requireAdminApiMock = vi.fn<[], Promise<NextResponse | null>>(async () => null)
vi.mock("@/lib/berechtigungen/istAdmin", () => ({
  requireAdminApi: () => requireAdminApiMock(),
}))

const getUserMandantenMock = vi.fn(async () => [{ id: MID, name: "M1" }])
vi.mock("@/lib/mandanten", () => ({ getUserMandanten: () => getUserMandantenMock() }))

const createUser = vi.fn()
const deleteUser = vi.fn(async () => ({ error: null }))
const generateLink = vi.fn(async () => ({ error: null }))
const insert = vi.fn(async () => ({ error: null }))
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    auth: { admin: { createUser, deleteUser, generateLink } },
    schema: () => ({ from: () => ({ insert }) }),
  }),
}))

import { POST } from "@/app/api/benutzer/route"

function req(body: unknown) {
  return { json: async () => body } as unknown as Parameters<typeof POST>[0]
}
const valid = { email: "neu@firma.de", vorname: "Anna", nachname: "Müller", mandant_id: MID }

beforeEach(() => {
  vi.clearAllMocks()
  requireAdminApiMock.mockResolvedValue(null)
  getUserMandantenMock.mockResolvedValue([{ id: MID, name: "M1" }])
  createUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null })
  insert.mockResolvedValue({ error: null })
  generateLink.mockResolvedValue({ error: null })
})

describe("POST /api/benutzer (anlegen)", () => {
  it("Nicht-Admin → 403, kein createUser", async () => {
    requireAdminApiMock.mockResolvedValueOnce(NextResponse.json({ error: "x" }, { status: 403 }))
    const res = await POST(req(valid))
    expect(res.status).toBe(403)
    expect(createUser).not.toHaveBeenCalled()
  })

  it("ungültige E-Mail → 422, kein createUser", async () => {
    const res = await POST(req({ ...valid, email: "keine-mail" }))
    expect(res.status).toBe(422)
    expect(createUser).not.toHaveBeenCalled()
  })

  it("nicht erlaubter Mandant → 403", async () => {
    const res = await POST(req({ ...valid, mandant_id: OTHER }))
    expect(res.status).toBe(403)
    expect(createUser).not.toHaveBeenCalled()
  })

  it("Duplikat-E-Mail → 409, kein benutzer-Insert", async () => {
    createUser.mockResolvedValueOnce({ data: null, error: { message: "already registered" } })
    const res = await POST(req(valid))
    expect(res.status).toBe(409)
    expect(insert).not.toHaveBeenCalled()
  })

  it("Erfolg → 201, createUser+insert+generateLink, einladung_versendet true", async () => {
    const res = await POST(req(valid))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body).toMatchObject({ id: "u1", einladung_versendet: true })
    expect(createUser).toHaveBeenCalledOnce()
    expect(insert).toHaveBeenCalledOnce()
    expect(generateLink).toHaveBeenCalledWith({ type: "recovery", email: valid.email })
    expect(deleteUser).not.toHaveBeenCalled()
  })

  it("Rollback: benutzer-Insert scheitert → auth-User wird geloescht", async () => {
    insert.mockResolvedValueOnce({ error: { message: "boom", code: "500" } })
    const res = await POST(req(valid))
    expect(res.status).toBe(500)
    expect(deleteUser).toHaveBeenCalledWith("u1")
  })

  it("Mail nicht ausgeloest → 201 mit einladung_versendet false (Anlegen bleibt erfolgreich)", async () => {
    generateLink.mockResolvedValueOnce({ error: { message: "smtp" } })
    const res = await POST(req(valid))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.einladung_versendet).toBe(false)
    expect(deleteUser).not.toHaveBeenCalled()
  })
})

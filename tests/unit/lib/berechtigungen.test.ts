import { describe, it, expect, vi, beforeEach } from "vitest"

// Preview + Supabase-Server-Client + next/navigation mocken,
// damit der Wrapper in jsdom/node testbar ist.
const previewMock = vi.fn(() => false)
vi.mock("@/lib/dev/preview", () => ({ isPreviewNoAuth: () => previewMock() }))

const rpcMock = vi.fn()
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: async () => ({ rpc: rpcMock }),
}))

const redirectMock = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`)
})
vi.mock("next/navigation", () => ({ redirect: (url: string) => redirectMock(url) }))

import {
  istAdmin,
  requireAdmin,
  requireAdminApi,
  istSelbstDeaktivierung,
} from "@/lib/berechtigungen/istAdmin"

beforeEach(() => {
  vi.clearAllMocks()
  previewMock.mockReturnValue(false)
})

describe("istAdmin", () => {
  it("true, wenn wimus.ist_admin() true liefert", async () => {
    rpcMock.mockResolvedValueOnce({ data: true, error: null })
    expect(await istAdmin()).toBe(true)
    expect(rpcMock).toHaveBeenCalledWith("ist_admin")
  })

  it("false, wenn ist_admin() false liefert", async () => {
    rpcMock.mockResolvedValueOnce({ data: false, error: null })
    expect(await istAdmin()).toBe(false)
  })

  it("false bei RPC-Fehler (fail-closed)", async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: { message: "boom" } })
    expect(await istAdmin()).toBe(false)
  })

  it("Preview-Modus → true ohne DB-Aufruf", async () => {
    previewMock.mockReturnValue(true)
    expect(await istAdmin()).toBe(true)
    expect(rpcMock).not.toHaveBeenCalled()
  })
})

describe("requireAdminApi", () => {
  it("Nicht-Admin → 403-Response", async () => {
    rpcMock.mockResolvedValueOnce({ data: false, error: null })
    const res = await requireAdminApi()
    expect(res).not.toBeNull()
    expect(res!.status).toBe(403)
  })

  it("Admin → null (kein Block)", async () => {
    rpcMock.mockResolvedValueOnce({ data: true, error: null })
    expect(await requireAdminApi()).toBeNull()
  })
})

describe("requireAdmin (Seiten)", () => {
  it("Nicht-Admin → redirect('/')", async () => {
    rpcMock.mockResolvedValueOnce({ data: false, error: null })
    await expect(requireAdmin()).rejects.toThrow("REDIRECT:/")
    expect(redirectMock).toHaveBeenCalledWith("/")
  })

  it("Admin → kein Redirect", async () => {
    rpcMock.mockResolvedValueOnce({ data: true, error: null })
    await expect(requireAdmin()).resolves.toBeUndefined()
    expect(redirectMock).not.toHaveBeenCalled()
  })
})

describe("istSelbstDeaktivierung (Anti-Lockout)", () => {
  it("blockt: eigener Benutzer wird deaktiviert", () => {
    expect(istSelbstDeaktivierung("u1", "u1", false)).toBe(true)
  })
  it("erlaubt: fremder Benutzer wird deaktiviert", () => {
    expect(istSelbstDeaktivierung("u2", "u1", false)).toBe(false)
  })
  it("erlaubt: eigener Benutzer wird AKTIVIERT", () => {
    expect(istSelbstDeaktivierung("u1", "u1", true)).toBe(false)
  })
  it("erlaubt: aktiv unverändert (undefined)", () => {
    expect(istSelbstDeaktivierung("u1", "u1", undefined)).toBe(false)
  })
  it("erlaubt: kein Auth-Kontext (null)", () => {
    expect(istSelbstDeaktivierung("u1", null, false)).toBe(false)
  })
})

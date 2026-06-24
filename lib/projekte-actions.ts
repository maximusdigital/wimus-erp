"use server"

import { cookies } from "next/headers"

import { PROJEKT_COOKIE } from "@/lib/projekte"

/** Aktives Projekt setzen (Cookie). Wird vom Projekt-Switcher aufgerufen. */
export async function setActiveProjekt(projektId: string) {
  const cookieStore = await cookies()
  cookieStore.set(PROJEKT_COOKIE, projektId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 Jahr
  })
}

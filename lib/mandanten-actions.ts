"use server"

import { cookies } from "next/headers"

import { MANDANT_COOKIE } from "@/lib/mandanten"

/** Aktiven Mandanten setzen (Cookie). Wird vom Mandanten-Switcher aufgerufen. */
export async function setActiveMandant(mandantId: string) {
  const cookieStore = await cookies()
  cookieStore.set(MANDANT_COOKIE, mandantId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 Jahr
  })
}

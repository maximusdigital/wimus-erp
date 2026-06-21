"use client"

import { createContext, useContext } from "react"

import type { Mandant } from "@/types/mandant"

type MandantContextValue = {
  mandant: Mandant | null
  mandanten: Mandant[]
}

const MandantContext = createContext<MandantContextValue | null>(null)

export function MandantProvider({
  mandant,
  mandanten,
  children,
}: {
  mandant: Mandant | null
  mandanten: Mandant[]
  children: React.ReactNode
}) {
  return (
    <MandantContext.Provider value={{ mandant, mandanten }}>
      {children}
    </MandantContext.Provider>
  )
}

/**
 * Zugriff auf den aktiven Mandanten + Liste der verfügbaren Mandanten.
 * NIEMALS den Mandanten hardcoden – immer über diesen Hook.
 */
export function useMandant() {
  const ctx = useContext(MandantContext)
  if (!ctx) {
    throw new Error("useMandant muss innerhalb von <MandantProvider> genutzt werden")
  }
  return ctx
}

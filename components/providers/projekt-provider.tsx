"use client"

import { createContext, useContext } from "react"

import type { Projekt } from "@/types/projekt"

type ProjektContextValue = {
  projekt: Projekt | null
  projekte: Projekt[]
}

const ProjektContext = createContext<ProjektContextValue | null>(null)

export function ProjektProvider({
  projekt,
  projekte,
  children,
}: {
  projekt: Projekt | null
  projekte: Projekt[]
  children: React.ReactNode
}) {
  return (
    <ProjektContext.Provider value={{ projekt, projekte }}>
      {children}
    </ProjektContext.Provider>
  )
}

/**
 * Zugriff auf das aktive Projekt + verfügbare Projekte (Org-Ebene 3).
 * NIE ein Projekt hardcoden – immer über diesen Hook.
 */
export function useProjekt() {
  const ctx = useContext(ProjektContext)
  if (!ctx) {
    throw new Error("useProjekt muss innerhalb von <ProjektProvider> genutzt werden")
  }
  return ctx
}

/**
 * Vorgangs-Status-Flow (Spec 0004, Engine). Rein/testbar (DB-frei).
 * Kanonisch: offen → zugewiesen → in_arbeit → (wartet_extern) → erledigt → abgenommen;
 * abgebrochen aus jedem offenen Status. Terminal: erledigt/abgenommen/abgebrochen.
 */

export const VORGANG_TERMINAL = ["erledigt", "abgenommen", "abgebrochen"] as const

const UEBERGAENGE: Record<string, string[]> = {
  offen: ["zugewiesen", "in_arbeit", "abgebrochen"],
  zugewiesen: ["in_arbeit", "offen", "abgebrochen"],
  in_arbeit: ["wartet_extern", "erledigt", "abgebrochen"],
  wartet_extern: ["in_arbeit", "erledigt", "abgebrochen"],
  erledigt: ["abgenommen", "abgebrochen"],
  abgenommen: [],
  abgebrochen: [],
}

export function istAbgeschlossen(status: string): boolean {
  return (VORGANG_TERMINAL as readonly string[]).includes(status)
}

/** Ist der direkte Übergang erlaubt (ohne Reaktivierung)? */
export function uebergangErlaubt(von: string, nach: string): boolean {
  if (von === nach) return false
  return (UEBERGAENGE[von] ?? []).includes(nach)
}

export type StatusUebergang = {
  /** Eintrag für vorgang_verlauf. */
  verlauf: { art: "status"; von_status: string; nach_status: string; am: string }
  /** Patch für vorgaenge. */
  patch: { status: string }
}

/**
 * Berechnet einen Statuswechsel. Wirft bei unerlaubtem Übergang.
 * `reaktivieren=true` erlaubt den Sprung von einem Terminal-Status zurück nach
 * `offen`/`in_arbeit` (mit Audit-Eintrag).
 */
export function statusUebergang(
  vonStatus: string,
  nachStatus: string,
  opts: { reaktivieren?: boolean; jetzt?: Date | string } = {}
): StatusUebergang {
  const amISO = new Date(opts.jetzt ?? new Date()).toISOString()

  if (istAbgeschlossen(vonStatus)) {
    if (!(opts.reaktivieren && (nachStatus === "offen" || nachStatus === "in_arbeit"))) {
      throw new Error(
        `Abgeschlossener Vorgang (${vonStatus}): Statuswechsel nur per Reaktivierung nach offen/in_arbeit.`
      )
    }
  } else if (!uebergangErlaubt(vonStatus, nachStatus)) {
    throw new Error(`Statuswechsel ${vonStatus} → ${nachStatus} ist nicht erlaubt.`)
  }

  return {
    verlauf: { art: "status", von_status: vonStatus, nach_status: nachStatus, am: amISO },
    patch: { status: nachStatus },
  }
}

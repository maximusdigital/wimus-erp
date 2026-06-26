/**
 * Buchungssatz aus einem Beleg ableiten (Spec 0002). Standard-Gegenkonto
 * Kreditoren (1600 / SKR03) – überschreibbar, sobald Lieferanten-/Bankkonto
 * je Firma gepflegt ist.
 */
import { buchungsIdExtern } from "@/lib/utils/fibu"
import type { Beleg } from "@/types/beleg"

const DEFAULT_GEGENKONTO = "1600" // Verbindlichkeiten aLuL (SKR03)

export function buchungAusBeleg(
  beleg: Beleg,
  opts: { akteur_typ: "mensch" | "ki"; akteur_id?: string | null; haben_konto?: string }
) {
  const bezug = beleg.firma_id ?? beleg.mandant_id
  const text = [beleg.lieferant_name, beleg.belegnummer]
    .filter(Boolean)
    .join(" ")
    .slice(0, 60)

  return {
    mandant_id: beleg.mandant_id,
    firma_id: beleg.firma_id,
    beleg_id: beleg.id,
    datum: beleg.belegdatum,
    soll_konto: beleg.soll_konto,
    haben_konto: opts.haben_konto ?? DEFAULT_GEGENKONTO,
    betrag_brutto: beleg.brutto,
    ust_schluessel: beleg.steuerschluessel,
    k1: beleg.k1,
    k2: beleg.k2,
    buchungstext: text || null,
    buchungs_id_extern: buchungsIdExtern({
      einheit_id: bezug,
      belegnummer: beleg.belegnummer,
      belegdatum: beleg.belegdatum,
      betrag_brutto: beleg.brutto,
    }),
    akteur_id: opts.akteur_id ?? null,
    akteur_typ: opts.akteur_typ,
    gebucht_am: new Date().toISOString(),
  }
}

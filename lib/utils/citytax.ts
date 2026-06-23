/**
 * CityTax / Beherbergungssteuer – Berechnung je Buchung.
 *
 * Sätze gem. Spec v5 (Person · Nacht):
 *   Stuttgart    3,00 €
 *   Ludwigsburg  2,00 €
 * Andere Gemeinden: kein Satz hinterlegt → 0 (manuell prüfen).
 * Quartalsexport an die Gemeinde erfolgt separat.
 */

/** Satz je Person und Nacht nach Stadt (lower-case Teilstring-Match). */
const CITYTAX_SAETZE: { match: string; satz: number }[] = [
  { match: "stuttgart", satz: 3.0 },
  { match: "ludwigsburg", satz: 2.0 },
]

/** CityTax-Satz (€/Person·Nacht) für eine Stadt – 0, wenn nicht hinterlegt. */
export function citytaxSatz(stadt: string | null | undefined): number {
  if (!stadt) return 0
  const s = stadt.toLowerCase()
  return CITYTAX_SAETZE.find((e) => s.includes(e.match))?.satz ?? 0
}

/** Anzahl Nächte zwischen Check-in und Check-out (mind. 0). */
export function naechte(
  checkin: string | null | undefined,
  checkout: string | null | undefined
): number {
  if (!checkin || !checkout) return 0
  const a = new Date(checkin)
  const b = new Date(checkout)
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0
  const ms = b.getTime() - a.getTime()
  if (ms <= 0) return 0
  return Math.ceil(ms / (1000 * 60 * 60 * 24))
}

/**
 * CityTax-Betrag = Satz × Personen × Nächte.
 * Gibt null zurück, wenn kein Satz für die Stadt hinterlegt ist (manuell prüfen).
 */
export function citytaxBetrag(params: {
  stadt: string | null | undefined
  personen: number | null | undefined
  checkin: string | null | undefined
  checkout: string | null | undefined
}): number | null {
  const satz = citytaxSatz(params.stadt)
  if (satz === 0) return null
  const personen = params.personen ?? 0
  const n = naechte(params.checkin, params.checkout)
  return Math.round(satz * personen * n * 100) / 100
}

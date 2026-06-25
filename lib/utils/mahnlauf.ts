/**
 * Mahnlauf – verzahnt Forderungen mit dem 5-stufigen Mahnwesen
 * (Spec 0001 / 30_prozesse Kap. 3). Reine Funktionen, testbar.
 */
import { offenerBetrag } from "@/lib/utils/forderungen"
import {
  mahngebuehr,
  mahnGesamt,
  mahnzinsen,
  naechsteStufe,
} from "@/lib/utils/mahnwesen"

export type MahnForderung = {
  id: string
  betrag: number | null
  bezahlt_betrag?: number | null
  faellig_am: string | null
  status: string
  mahnstufe?: number | null
}

/** Tage zwischen Fälligkeit und heute (positiv = überfällig). */
export function tageUeberfaellig(
  faellig_am: string | null | undefined,
  heute: string
): number {
  if (!faellig_am) return 0
  const a = new Date(faellig_am)
  const b = new Date(heute)
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * Ist die Forderung mahnfähig? Offener Restbetrag > 0, fällig + Karenz (Default
 * 3 Tage) überschritten, Status nicht bezahlt/abgeschrieben, Stufe < 5.
 */
export function istMahnfaehig(
  f: MahnForderung,
  heute: string,
  karenzTage = 3
): boolean {
  if (offenerBetrag(f) <= 0) return false
  if (["bezahlt", "abgeschrieben"].includes(f.status)) return false
  if ((f.mahnstufe ?? 0) >= 5) return false
  return tageUeberfaellig(f.faellig_am, heute) > karenzTage
}

export type MahnVorschlag = {
  forderung_id: string
  stufe: number
  hauptforderung: number
  zinsen: number
  gebuehren: number
  gesamt: number
}

/**
 * Nächste Mahnung für eine fällige Forderung berechnen.
 * Zinsen taggenau auf den offenen Betrag ab Fälligkeit.
 */
export function naechsteMahnung(
  f: MahnForderung,
  heute: string,
  zinssatzProJahr = 5
): MahnVorschlag {
  const stufe = naechsteStufe(f.mahnstufe ?? 0)
  const haupt = offenerBetrag(f)
  const tage = Math.max(0, tageUeberfaellig(f.faellig_am, heute))
  const zinsen = mahnzinsen(haupt, zinssatzProJahr, tage)
  const gebuehren = mahngebuehr(stufe)
  return {
    forderung_id: f.id,
    stufe,
    hauptforderung: haupt,
    zinsen,
    gebuehren,
    gesamt: mahnGesamt(haupt, zinsen, gebuehren),
  }
}

/** Alle mahnfähigen Forderungen mit ihrem Mahnvorschlag. */
export function mahnlauf(
  forderungen: MahnForderung[],
  heute: string,
  opts?: { karenzTage?: number; zinssatzProJahr?: number }
): MahnVorschlag[] {
  return forderungen
    .filter((f) => istMahnfaehig(f, heute, opts?.karenzTage ?? 3))
    .map((f) => naechsteMahnung(f, heute, opts?.zinssatzProJahr ?? 5))
}

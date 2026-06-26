/**
 * Mapping echter FiBu-Buchungen → DATEV-EXTF (Spec 0002, Export → TaxPool).
 * Setzt auf lib/utils/extf.ts auf. Rein/testbar.
 */
import { extfBuchungsstapel, type ExtfBuchung, type ExtfMeta } from "@/lib/utils/extf"

export type ExportBuchung = {
  datum: string | null
  soll_konto: string | null
  haben_konto: string | null
  betrag_brutto: number | null
  ust_schluessel: string | null
  k1: string | null
  k2: string | null
  buchungstext: string | null
  buchungs_id_extern: string | null
  beleg?: { belegnummer: string | null; belegdatum: string | null } | null
}

export type ExportFirma = {
  name?: string | null
  datev_berater_nr?: string | number | null
  datev_mandant_nr?: string | number | null
}

/** Eine FiBu-Buchung auf eine EXTF-Buchungszeile abbilden (Eingangsrechnung: Soll). */
export function mapBuchungZuExtf(b: ExportBuchung): ExtfBuchung {
  return {
    umsatz: b.betrag_brutto ?? 0,
    soll_haben: "S",
    konto: b.soll_konto ?? "",
    gegenkonto: b.haben_konto ?? "",
    bu_schluessel: b.ust_schluessel,
    belegdatum: b.datum ?? b.beleg?.belegdatum ?? "",
    belegfeld1: b.beleg?.belegnummer ?? null,
    buchungstext: b.buchungstext,
    kost1: b.k1,
    kost2: b.k2,
    buchungs_id: b.buchungs_id_extern,
  }
}

/** EXTF-Buchungsstapel aus echten Buchungen erzeugen. */
export function baueExtfExport(
  buchungen: ExportBuchung[],
  zeitraum: { von: string; bis: string },
  firma?: ExportFirma,
  erzeugtAm?: string
): string {
  const meta: ExtfMeta = {
    berater_nr: firma?.datev_berater_nr ?? "",
    mandant_nr: firma?.datev_mandant_nr ?? "",
    wj_beginn: `${zeitraum.von.slice(0, 4)}-01-01`,
    datum_von: zeitraum.von,
    datum_bis: zeitraum.bis,
    bezeichnung: firma?.name ?? "WIMUS Export",
    erzeugt_am: erzeugtAm,
  }
  return extfBuchungsstapel(buchungen.map(mapBuchungZuExtf), meta)
}

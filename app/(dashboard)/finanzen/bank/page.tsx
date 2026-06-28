import { createServerClient } from "@/lib/supabase/server"
import { BankCockpit } from "@/components/fibu/bank-cockpit"
import type {
  BankEinstellungen,
  BankKonto,
  BankUmsatzRow,
  IgnorierMuster,
  VertragOption,
} from "@/types/bank"

export const metadata = { title: "Bank-Abgleich – FiBu" }

type KontaktRef = { vorname: string | null; nachname: string | null; firmenname: string | null }

/** Supabase typt To-One-Embeds teils als Array → auf Objekt normalisieren. */
function one<T>(x: T | T[] | null | undefined): T | null {
  return Array.isArray(x) ? (x[0] ?? null) : (x ?? null)
}

function kontaktName(k: KontaktRef | null): string {
  if (!k) return "—"
  return k.firmenname || [k.vorname, k.nachname].filter(Boolean).join(" ") || "—"
}

export default async function BankAbgleichPage() {
  const supabase = await createServerClient()

  const [{ data: umsaetzeRaw }, { data: kontenRaw }, { data: vertraegeRaw }, { data: einstRaw }, { data: ignorierRaw }] = await Promise.all([
    supabase
      .schema("wimus")
      .from("bank_umsaetze")
      .select(
        "id, wertstellung, empfaenger, verwendungszweck, kategorie_wiso, betrag, richtung, erkanntes_k1, mietvertrag_id, match_methode, match_confidence, zuordnung_status, forderung_id, objekt:objekte(kuerzel), einheit:einheiten(verwendungszweck_code)"
      )
      .order("wertstellung", { ascending: false })
      .limit(500),
    supabase.schema("wimus").from("bank_konten").select("*").order("bezeichnung"),
    supabase
      .schema("wimus")
      .from("mietvertraege")
      .select("id, einheit:einheiten!einheit_id(verwendungszweck_code), mieter:kontakte!mieter_id(vorname, nachname, firmenname)")
      .order("created_at", { ascending: false })
      .limit(500),
    supabase.schema("wimus").from("bank_einstellungen").select("auto_schwelle, pruefen_schwelle, name_min").maybeSingle(),
    supabase.schema("wimus").from("bank_ignorier_muster").select("id, muster, aktiv").order("created_at", { ascending: true }),
  ])

  const umsaetze = (umsaetzeRaw ?? []) as unknown as BankUmsatzRow[]
  const konten = (kontenRaw ?? []) as BankKonto[]
  const vertraege: VertragOption[] = ((vertraegeRaw ?? []) as unknown as Array<{
    id: string
    einheit: { verwendungszweck_code: string | null } | { verwendungszweck_code: string | null }[] | null
    mieter: KontaktRef | KontaktRef[] | null
  }>).map((v) => {
    const code = one(v.einheit)?.verwendungszweck_code
    const name = kontaktName(one(v.mieter))
    return { id: v.id, label: code ? `${name} · ${code}` : name }
  })

  const einstellungen: BankEinstellungen = einstRaw
    ? {
        auto_schwelle: Number(einstRaw.auto_schwelle),
        pruefen_schwelle: Number(einstRaw.pruefen_schwelle),
        name_min: Number(einstRaw.name_min),
      }
    : { auto_schwelle: 0.9, pruefen_schwelle: 0.75, name_min: 0.82 }
  const ignorier = (ignorierRaw ?? []) as IgnorierMuster[]

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Bank-Abgleich</h1>
        <p className="text-muted-foreground text-sm">
          KSK/WISO-CSV importieren · automatischer Match (K1/Name/Betrag) · OP-Abgleich gegen offene Mietforderungen
        </p>
      </div>
      <BankCockpit
        umsaetze={umsaetze}
        konten={konten}
        vertraege={vertraege}
        einstellungen={einstellungen}
        ignorier={ignorier}
      />
    </div>
  )
}

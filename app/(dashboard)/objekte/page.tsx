import Link from "next/link"
import { Building2, Plus } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { ObjektKarte } from "@/components/objekte/objekt-karte"
import { ObjektTabelle } from "@/components/objekte/objekt-tabelle"
import type { ObjektMitEinheiten } from "@/types/objekt"

export const metadata = {
  title: "Objekte",
}

// Nur für die Dev-Vorschau (NEXT_PUBLIC_PREVIEW_NO_AUTH=1) – keine echten Daten.
const DEMO_OBJEKTE: ObjektMitEinheiten[] = [
  {
    id: "demo-1",
    kuerzel: "BHS16",
    bezeichnung: "Bauhofstr. 16 – MFH 4WE 14Z",
    strasse: "Bauhofstraße",
    hausnummer: "16",
    plz: "71640",
    ort: "Ludwigsburg",
    objekttyp: "MFH",
    haltestrategie: "bestand",
    status: "ist",
    marktwert_sprengnetter: 1850000,
    marktwert_pricehubble: null,
    einheiten: [{ count: 4 }],
  },
  {
    id: "demo-2",
    kuerzel: "AS125",
    bezeichnung: "Austraße 125 – MFH 4WE+2G",
    strasse: "Austraße",
    hausnummer: "125",
    plz: "70599",
    ort: "Stuttgart-Münster",
    objekttyp: "MFH",
    haltestrategie: "bestand",
    status: "ist",
    marktwert_sprengnetter: 1420000,
    marktwert_pricehubble: null,
    einheiten: [{ count: 6 }],
  },
  {
    id: "demo-3",
    kuerzel: "BS18A1",
    bezeichnung: "Beilsteiner Str. 18A – R2R KZV",
    strasse: "Beilsteiner Straße",
    hausnummer: "18A",
    plz: "70372",
    ort: "Stuttgart",
    objekttyp: "R2R-KZV",
    haltestrategie: "r2r",
    status: "akquise",
    marktwert_sprengnetter: null,
    marktwert_pricehubble: 540000,
    einheiten: [{ count: 1 }],
  },
] as ObjektMitEinheiten[]

export default async function ObjektePage() {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from("objekte")
    .select("*, einheiten(count)")
    .order("kuerzel")

  let objekte = (data ?? []) as ObjektMitEinheiten[]

  // Dev-Vorschau: Demo-Daten, damit die Liste ohne DB befüllt ist.
  const previewNoAuth =
    process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_PREVIEW_NO_AUTH === "1"
  if (previewNoAuth && objekte.length === 0) {
    objekte = DEMO_OBJEKTE
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Objekte</h1>
          <p className="text-muted-foreground text-sm">
            {objekte.length} {objekte.length === 1 ? "Objekt" : "Objekte"}
          </p>
        </div>
        <Button render={<Link href="/objekte/neu" />}>
          <Plus />
          <span>Neues Objekt</span>
        </Button>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Fehler beim Laden: {error.message}
        </div>
      ) : objekte.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-12 text-center">
          <div className="flex aspect-square size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Building2 className="size-6" />
          </div>
          <div>
            <p className="font-medium">Noch keine Objekte</p>
            <p className="text-muted-foreground text-sm">
              Lege dein erstes Objekt an, um loszulegen.
            </p>
          </div>
          <Button render={<Link href="/objekte/neu" />} variant="outline">
            <Plus />
            <span>Objekt anlegen</span>
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop: Tabelle */}
          <div className="hidden md:block">
            <ObjektTabelle objekte={objekte} />
          </div>
          {/* Mobile: Karten-Liste */}
          <div className="space-y-2 md:hidden">
            {objekte.map((o) => (
              <ObjektKarte key={o.id} objekt={o} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

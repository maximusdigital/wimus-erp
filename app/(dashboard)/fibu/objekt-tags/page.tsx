import Link from "next/link"
import { Tag } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ObjektTagEditor, type ObjektTagRow } from "@/components/fibu/objekt-tag-editor"
import {
  gruppiereNachTag,
  TAG_DIMENSIONEN,
  type TagDimension,
} from "@/lib/fibu/objekt-tags"
import { cn } from "@/lib/utils"

export const metadata = { title: "Objekt-Tags" }

type ObjektRow = {
  id: string
  kuerzel: string | null
  strasse: string | null
  hausnummer: string | null
  stadt: string | null
  typ: string | null
}
type ObjektMitTags = ObjektRow & { tags: ObjektTagRow[] }

function istDimension(v: string | undefined): v is TagDimension {
  return !!v && TAG_DIMENSIONEN.some((d) => d.value === v)
}

export default async function ObjektTagsPage({
  searchParams,
}: {
  searchParams: Promise<{ dim?: string }>
}) {
  const { dim } = await searchParams
  const supabase = await createServerClient()

  const [{ data: objekteRaw }, { data: tagsRaw }] = await Promise.all([
    supabase.from("objekte").select("id, kuerzel, strasse, hausnummer, stadt, typ").order("kuerzel"),
    supabase.from("objekt_tags").select("id, objekt_id, tag_typ, wert"),
  ])

  const tags = (tagsRaw ?? []) as (ObjektTagRow & { objekt_id: string })[]
  const objekte: ObjektMitTags[] = ((objekteRaw ?? []) as ObjektRow[]).map((o) => ({
    ...o,
    tags: tags.filter((t) => t.objekt_id === o.id).map(({ id, tag_typ, wert }) => ({ id, tag_typ, wert })),
  }))

  const aktiveDim = istDimension(dim) ? dim : null
  const gruppen = aktiveDim ? gruppiereNachTag(objekte, aktiveDim) : []

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Objekt-Tags</h1>
        <p className="text-muted-foreground text-sm">
          Objekte nach Nutzungsart / Marke / Region klassifizieren — Basis für die
          horizontale Achse konsolidierter Auswertungen.
        </p>
      </div>

      {/* Gruppierungs-Vorschau */}
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">Gruppierung</CardTitle>
          <div className="flex gap-1">
            {TAG_DIMENSIONEN.map((d) => (
              <Link
                key={d.value}
                href={`/fibu/objekt-tags?dim=${d.value}`}
                className={cn(
                  "rounded-md border px-2.5 py-1 text-sm",
                  aktiveDim === d.value
                    ? "border-secondary bg-secondary/10 text-secondary"
                    : "text-muted-foreground"
                )}
              >
                {d.label}
              </Link>
            ))}
            {aktiveDim ? (
              <Link href="/fibu/objekt-tags" className="rounded-md border px-2.5 py-1 text-sm text-muted-foreground">
                ✕
              </Link>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          {!aktiveDim ? (
            <p className="text-sm text-muted-foreground">
              Dimension wählen, um Objekte gebündelt zu sehen.
            </p>
          ) : gruppen.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine Objekte.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {gruppen.map((g) => (
                <div key={g.wert} className="rounded-lg border px-3 py-2">
                  <div className="text-sm font-medium">{g.wert}</div>
                  <div className="text-xs text-muted-foreground">
                    {g.objekte.length} {g.objekte.length === 1 ? "Objekt" : "Objekte"} ·{" "}
                    {g.objekte.map((o) => o.kuerzel || o.id.slice(0, 4)).join(", ")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Objekt-Liste mit Tag-Editor */}
      {objekte.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-10 text-center">
          <Tag className="size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Keine Objekte vorhanden.</p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-40">Objekt</TableHead>
                <TableHead className="w-24">Typ</TableHead>
                <TableHead>Tags</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {objekte.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>
                    <div className="font-medium">{o.kuerzel || "—"}</div>
                    <div className="text-xs text-muted-foreground">
                      {[o.strasse, o.hausnummer].filter(Boolean).join(" ")}
                      {o.stadt ? `, ${o.stadt}` : ""}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{o.typ || "—"}</TableCell>
                  <TableCell>
                    <ObjektTagEditor objektId={o.id} tags={o.tags} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

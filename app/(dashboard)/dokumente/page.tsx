import { ExternalLink, FileText, Search, Settings2 } from "lucide-react"

import {
  paperlessListe,
  paperlessDokumentUrl,
} from "@/lib/integrations/paperless"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatDate } from "@/lib/utils/format"

export const metadata = { title: "Dokumente" }

export default async function DokumentePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const liste = await paperlessListe({ query: q })

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Dokumente</h1>
        <p className="text-muted-foreground text-sm">
          DMS-Anbindung an Paperless-ngx – Belege, Verträge &amp; Schriftverkehr.
        </p>
      </div>

      {!liste.ok && liste.reason === "not_configured" ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings2 className="size-4" />
              <CardTitle className="text-base">
                Paperless ist noch nicht verbunden
              </CardTitle>
            </div>
            <CardDescription>
              WIMUS ERP baut kein eigenes DMS – es bindet Paperless-ngx an. Zum
              Aktivieren diese Umgebungsvariablen setzen (z. B. in Coolify):
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <pre className="bg-muted rounded-md p-3 text-xs">
{`PAPERLESS_URL=https://dms.m81s.de
PAPERLESS_TOKEN=<API-Token aus Paperless → Einstellungen → API-Token>`}
            </pre>
            <p className="text-muted-foreground text-xs">
              Danach den Server neu starten. Der Token bleibt serverseitig und
              wird nie an den Browser ausgeliefert.
            </p>
          </CardContent>
        </Card>
      ) : !liste.ok ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-destructive">
              Paperless nicht erreichbar
            </CardTitle>
            <CardDescription>
              Verbindung fehlgeschlagen: {liste.message ?? "unbekannter Fehler"}.
              URL/Token prüfen.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <form action="/dokumente" method="get" className="flex gap-2">
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                name="q"
                defaultValue={q ?? ""}
                placeholder="Volltextsuche in Paperless…"
                className="pl-9"
              />
            </div>
            <Button type="submit">Suchen</Button>
          </form>

          <p className="text-muted-foreground text-sm">
            {liste.count} Dokument{liste.count === 1 ? "" : "e"}
            {q ? ` für „${q}"` : ""}
          </p>

          {liste.results.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
                <div className="bg-muted text-muted-foreground flex size-10 items-center justify-center rounded-full">
                  <FileText className="size-5" />
                </div>
                <p className="text-muted-foreground text-sm">
                  Keine Dokumente gefunden.
                </p>
              </CardContent>
            </Card>
          ) : (
            <ul className="divide-y rounded-lg border">
              {liste.results.map((d) => {
                const url = paperlessDokumentUrl(d.id)
                return (
                  <li key={d.id}>
                    <a
                      href={url ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:bg-muted/40 flex items-center gap-3 px-3 py-3 transition-colors"
                    >
                      <div className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-md">
                        <FileText className="size-4.5" />
                      </div>
                      <div className="grid flex-1 gap-0.5">
                        <span className="text-sm font-medium leading-tight">
                          {d.title}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {[
                            d.correspondentName,
                            d.documentTypeName,
                            d.created ? formatDate(d.created) : null,
                          ]
                            .filter(Boolean)
                            .join(" · ") || "–"}
                        </span>
                      </div>
                      {d.documentTypeName ? (
                        <Badge variant="secondary" className="hidden sm:inline-flex">
                          {d.documentTypeName}
                        </Badge>
                      ) : null}
                      <ExternalLink className="text-muted-foreground size-4 shrink-0" />
                    </a>
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}
    </div>
  )
}

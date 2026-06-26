/**
 * Gebrandeter Report-Kopf/-Fuß für A4-Druck (Design 0001 40_design, WIMUS-Marke).
 * Reines Server-/Markup-Fragment, nutzt Token-Farben (primary/teal).
 */

export function ReportKopf({
  titel,
  untertitel,
  mandant,
}: {
  titel: string
  untertitel?: string
  mandant?: string
}) {
  return (
    <header className="mb-6 border-b-2 border-primary pb-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-2xl font-bold tracking-tight text-primary">WIMUS</div>
          <div className="text-xs text-teal">
            {mandant ?? "Württembergische Immobilien Management und Service GmbH"}
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold">{titel}</div>
          {untertitel ? <div className="text-xs text-[#555]">{untertitel}</div> : null}
        </div>
      </div>
      <div className="mt-3 h-1 w-full bg-primary/15" />
    </header>
  )
}

export function ReportFuss({ hinweis }: { hinweis?: string }) {
  return (
    <footer className="mt-8 border-t pt-3 text-[0.7rem] text-[#666]">
      {hinweis ? <p className="mb-1">{hinweis}</p> : null}
      <p>
        WIMUS ERP · Auswertung erzeugt am {new Date().toLocaleDateString("de-DE")} · interne
        Controlling-Sicht, kein testierter Jahresabschluss.
      </p>
    </footer>
  )
}

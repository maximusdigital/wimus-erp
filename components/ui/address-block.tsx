import { cn } from "@/lib/utils"

/**
 * AddressBlock (Design System 40, Kap. 6.2)
 *
 * Stellt eine Adresse IMMER als getrennten Block dar – nie als ein Feld:
 *   strasse hausnummer
 *   plz stadt (stadtteil)
 *   land
 *
 * Konvention v5: Adresse immer getrennt gespeichert
 * (strasse, hausnummer, plz, stadt, stadtteil, land).
 */
export interface Adresse {
  strasse?: string | null
  hausnummer?: string | null
  plz?: string | null
  stadt?: string | null
  stadtteil?: string | null
  land?: string | null
}

function joinTruthy(parts: Array<string | null | undefined>, sep = " ") {
  return parts.filter((p) => p != null && String(p).trim() !== "").join(sep)
}

function AddressBlock({
  adresse,
  className,
  ...props
}: React.ComponentProps<"address"> & { adresse: Adresse }) {
  const zeile1 = joinTruthy([adresse.strasse, adresse.hausnummer])
  const ort = joinTruthy([adresse.plz, adresse.stadt])
  const zeile2 = adresse.stadtteil
    ? joinTruthy([ort, `(${adresse.stadtteil})`])
    : ort
  const zeile3 =
    adresse.land && adresse.land.trim().toLowerCase() !== "deutschland"
      ? adresse.land
      : null

  if (!zeile1 && !zeile2 && !zeile3) {
    return (
      <span className={cn("text-sm text-muted-foreground", className)}>
        Keine Adresse hinterlegt
      </span>
    )
  }

  return (
    <address
      data-slot="address-block"
      className={cn("text-sm text-foreground not-italic leading-relaxed", className)}
      {...props}
    >
      {zeile1 ? <div>{zeile1}</div> : null}
      {zeile2 ? <div>{zeile2}</div> : null}
      {zeile3 ? <div className="text-muted-foreground">{zeile3}</div> : null}
    </address>
  )
}

export { AddressBlock }

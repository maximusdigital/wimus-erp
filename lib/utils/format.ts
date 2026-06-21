const eurFormatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
})

export function formatEUR(value: number | null | undefined): string {
  if (value == null) return "–"
  return eurFormatter.format(value)
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "–"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return "–"
  return dateFormatter.format(d)
}

/** Adresse aus Einzelteilen zusammensetzen. */
export function formatAdresse(parts: {
  strasse?: string | null
  hausnummer?: string | null
  plz?: string | null
  ort?: string | null
}): string {
  const linie1 = [parts.strasse, parts.hausnummer].filter(Boolean).join(" ")
  const linie2 = [parts.plz, parts.ort].filter(Boolean).join(" ")
  return [linie1, linie2].filter(Boolean).join(", ") || "–"
}

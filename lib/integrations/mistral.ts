/**
 * Mistral-Anbindung für die Belegerkennung (Spec 0002, 30_prozesse Kap. 1).
 * NUR serverseitig verwenden (liest MISTRAL_TOKEN).
 *
 *  - mistralOcr: gescanntes PDF/Bild → Text (Markdown) via mistral-ocr-latest.
 *  - mistralExtrahiere: OCR-Text → strukturierte Belegfakten (JSON-Mode).
 *
 * Die KI extrahiert nur Fakten; Kontierung/Validierung passieren deterministisch
 * (siehe lib/fibu/beleg-pipeline.ts).
 */

const BASE = "https://api.mistral.ai/v1"
const OCR_MODEL = "mistral-ocr-latest"
const CHAT_MODEL = "mistral-small-latest"

function token(): string {
  const t = process.env.MISTRAL_TOKEN
  if (!t) throw new Error("MISTRAL_TOKEN nicht gesetzt.")
  return t
}

/**
 * OCR für ein Dokument als Data-URL (data:application/pdf;base64,… oder
 * data:image/…;base64,…). Liefert den zusammengefügten Markdown-Text.
 */
export async function mistralOcr(dataUrl: string): Promise<string> {
  const istBild = dataUrl.startsWith("data:image/")
  const document = istBild
    ? { type: "image_url", image_url: dataUrl }
    : { type: "document_url", document_url: dataUrl }

  const res = await fetch(`${BASE}/ocr`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OCR_MODEL,
      document,
      include_image_base64: false,
    }),
  })
  if (!res.ok) {
    throw new Error(`Mistral OCR ${res.status}: ${await res.text()}`)
  }
  const json = (await res.json()) as { pages?: { markdown?: string }[] }
  return (json.pages ?? [])
    .map((p) => p.markdown ?? "")
    .join("\n\n")
    .trim()
}

export type BelegExtraktion = {
  belegnummer: string | null
  belegdatum: string | null // ISO YYYY-MM-DD
  netto: number | null
  ust_betrag: number | null
  ust_satz: number | null
  brutto: number | null
  lieferant_name: string | null
  lieferant_ustid: string | null
  iban: string | null
  gewerk: string | null
  k1: string | null
  /** Selbsteinschätzung des Modells, 0..1. */
  confidence: number
}

const EXTRAKT_PROMPT = `Du extrahierst Fakten aus einem deutschen Eingangsbeleg (Rechnung/Quittung).
Gib AUSSCHLIESSLICH ein JSON-Objekt mit genau diesen Schlüsseln zurück:
belegnummer (string|null), belegdatum (ISO YYYY-MM-DD|null), netto (number|null),
ust_betrag (number|null), ust_satz (number 19|7|0|null), brutto (number|null),
lieferant_name (string|null), lieferant_ustid (string|null), iban (string|null),
gewerk (string|null, z.B. "Reinigung","Strom","Versicherung"),
k1 (string|null, handschriftliches Objekt-Kürzel falls erkennbar),
confidence (number 0..1, deine Sicherheit).
Keine Erklärungen, nur das JSON.`

/** OCR-Text → strukturierte Belegfakten (deterministisch geparst aus JSON-Mode). */
export async function mistralExtrahiere(text: string): Promise<BelegExtraktion> {
  const res = await fetch(`${BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: EXTRAKT_PROMPT },
        { role: "user", content: text.slice(0, 12000) },
      ],
    }),
  })
  if (!res.ok) {
    throw new Error(`Mistral Chat ${res.status}: ${await res.text()}`)
  }
  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  const raw = json.choices?.[0]?.message?.content ?? "{}"
  let parsed: Partial<BelegExtraktion> = {}
  try {
    parsed = JSON.parse(raw)
  } catch {
    parsed = { confidence: 0 }
  }
  return {
    belegnummer: parsed.belegnummer ?? null,
    belegdatum: parsed.belegdatum ?? null,
    netto: numOrNull(parsed.netto),
    ust_betrag: numOrNull(parsed.ust_betrag),
    ust_satz: numOrNull(parsed.ust_satz),
    brutto: numOrNull(parsed.brutto),
    lieferant_name: parsed.lieferant_name ?? null,
    lieferant_ustid: parsed.lieferant_ustid ?? null,
    iban: parsed.iban ?? null,
    gewerk: parsed.gewerk ?? null,
    k1: parsed.k1 ?? null,
    confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0,
  }
}

function numOrNull(v: unknown): number | null {
  if (v == null) return null
  const n = typeof v === "string" ? Number(v.replace(",", ".")) : Number(v)
  return Number.isFinite(n) ? n : null
}

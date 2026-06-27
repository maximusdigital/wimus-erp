/**
 * Claude-Vision-Anbindung für Übergabe-Fotos (Spec 0004, ops).
 * NUR serverseitig verwenden (liest ANTHROPIC_TOKEN).
 *
 * Bewusste Modelltrennung (Entscheidung 2026-06-28): Mistral OCR bleibt
 * FiBu/Belege-only; Claude macht die beiden Übergabe-Bildaufgaben:
 *   - claudeZaehlerstand:     Zählerstand-Foto → strukturierte Zählerstände.
 *   - claudeUebergabeAbgleich: Vorher/Nachher-Fotos → neue Schäden.
 *
 * Schema wird im Prompt vorgegeben, das Modell liefert NUR JSON (keine
 * Fences/Vorspann); die Validierung gegen das Schema passiert deterministisch
 * beim Aufrufer (lib/validations/foto-analyse.ts) – kein Prompt-Drift.
 */

const BASE = "https://api.anthropic.com/v1/messages"
const MODEL = "claude-opus-4-8"
const VERSION = "2023-06-01"

function token(): string {
  const t = process.env.ANTHROPIC_TOKEN ?? process.env.ANTHROPIC_API_KEY
  if (!t) throw new Error("ANTHROPIC_TOKEN nicht gesetzt.")
  return t
}

/** Data-URL (data:image/…;base64,…) → {media_type, data} für die Messages-API. */
function bildBlock(dataUrl: string) {
  const m = /^data:([^;]+);base64,([\s\S]+)$/.exec(dataUrl)
  if (!m || !m[1].startsWith("image/")) {
    throw new Error("Ungültige Bilddaten (erwartet data:image/…;base64,…).")
  }
  return {
    type: "image" as const,
    source: { type: "base64" as const, media_type: m[1], data: m[2] },
  }
}

/** Robuste JSON-Extraktion: nimmt das äußerste {…} (toleriert Fences/Vorspann). */
function extrahiereJson(text: string): unknown {
  const start = text.indexOf("{")
  const end = text.lastIndexOf("}")
  if (start === -1 || end === -1 || end < start) {
    throw new Error("Claude lieferte kein JSON.")
  }
  return JSON.parse(text.slice(start, end + 1))
}

/**
 * Kern-Aufruf: Bilder + Schema-Prompt → geparstes (noch nicht validiertes) JSON.
 * Thinking bleibt aus (kurze, strukturierte Antwort) – der System-Prompt schärft
 * „nur JSON". Validierung gegen zod-Schema erfolgt beim Aufrufer.
 */
export async function claudeVisionJson(
  dataUrls: string[],
  system: string,
  frage: string
): Promise<unknown> {
  if (dataUrls.length === 0) throw new Error("Keine Bilder übergeben.")

  const content = [
    ...dataUrls.map(bildBlock),
    { type: "text" as const, text: frage },
  ]

  const res = await fetch(BASE, {
    method: "POST",
    headers: {
      "x-api-key": token(),
      "anthropic-version": VERSION,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1500,
      system,
      messages: [{ role: "user", content }],
    }),
  })
  if (!res.ok) {
    throw new Error(`Claude ${res.status}: ${await res.text()}`)
  }

  const json = (await res.json()) as {
    stop_reason?: string
    content?: { type: string; text?: string }[]
  }
  // Sicherheits-Klassifizierer kann ablehnen (HTTP 200, stop_reason refusal).
  if (json.stop_reason === "refusal") {
    throw new Error("Claude hat die Analyse abgelehnt (refusal).")
  }
  const text = (json.content ?? [])
    .filter((b) => b.type === "text")
    .map((b) => b.text ?? "")
    .join("")
    .trim()
  return extrahiereJson(text)
}

const ZAEHLER_SYSTEM = `Du liest Verbrauchszähler von einem Foto (Wohnungsübergabe).
Gib AUSSCHLIESSLICH ein JSON-Objekt zurück, exakt mit diesen Schlüsseln:
{
  "zaehler": [
    {
      "art": "strom" | "gas" | "wasser_kalt" | "wasser_warm" | "heizung" | "sonstiges",
      "zaehlernummer": string | null,
      "stand": number | null,        // abgelesener Zählerstand, Nachkommastellen als Punkt
      "einheit": "kWh" | "m3" | "MWh" | string | null
    }
  ],
  "confidence": number               // 0..1, deine Gesamtsicherheit der Ablesung
}
Lies nur, was klar erkennbar ist. Unklare Felder = null. Keine Erklärungen, nur das JSON.`

/** Zählerstand-Foto(s) → strukturierte Zählerstände (ungeprüftes JSON). */
export function claudeZaehlerstand(dataUrls: string[]): Promise<unknown> {
  return claudeVisionJson(
    dataUrls,
    ZAEHLER_SYSTEM,
    "Lies alle sichtbaren Zählerstände aus dem/den Foto(s) ab."
  )
}

const ABGLEICH_SYSTEM = `Du vergleichst Wohnungsfotos vom Einzug (VORHER) mit Fotos vom Auszug (NACHHER)
und findest neue Schäden/Veränderungen, die beim Auszug vorliegen, beim Einzug aber nicht.
Gib AUSSCHLIESSLICH ein JSON-Objekt zurück, exakt mit diesen Schlüsseln:
{
  "schaeden": [
    {
      "ort": string,                 // wo (z.B. "Wohnzimmer, Wand links")
      "beschreibung": string,        // was (z.B. "Kratzer im Parkett")
      "schaden_typ": "boden" | "wand" | "sanitaer" | "elektro" | "moebel" | "fenster" | "sonstiges" | null,
      "schwere": "bagatell" | "mittel" | "gross" | "grossschaden" | null,
      "neu": boolean                 // true = beim Auszug neu ggü. Einzug
    }
  ],
  "confidence": number               // 0..1, deine Sicherheit des Abgleichs
}
Normale Abnutzung ist KEIN Schaden. Nur klar erkennbare Veränderungen melden.
Keine Erklärungen, nur das JSON.`

/** Vorher/Nachher-Fotos → Schadensvorschläge (ungeprüftes JSON). */
export function claudeUebergabeAbgleich(
  vorher: string[],
  nachher: string[]
): Promise<unknown> {
  const frage =
    `Die ersten ${vorher.length} Foto(s) sind VORHER (Einzug), die nächsten ` +
    `${nachher.length} Foto(s) sind NACHHER (Auszug). Finde neue Schäden.`
  return claudeVisionJson([...vorher, ...nachher], ABGLEICH_SYSTEM, frage)
}

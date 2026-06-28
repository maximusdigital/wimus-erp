/**
 * Kommunikations-Schicht (Modul 007) — Signatur-Auflösung (rein/testbar).
 *
 * E-Mail: Signatur an JEDE ausgehende Mail. WhatsApp: nur erste Nachricht eines
 * Verlaufs / automatische Nachricht. Platzhalter `{schluessel}` werden zur
 * Sendezeit aufgelöst; unbekannte Platzhalter bleiben unverändert stehen (kein
 * Datenverlust, sichtbarer Hinweis auf fehlenden Wert).
 */

export type SignaturKontext = Record<string, string | null | undefined>

const PLATZHALTER = /\{([a-z0-9_]+)\}/gi

/** Ersetzt {schluessel} aus dem Kontext; unbekannte/leere bleiben stehen. */
export function loeseSignatur(vorlage: string, kontext: SignaturKontext): string {
  return vorlage.replace(PLATZHALTER, (treffer, schluessel: string) => {
    const wert = kontext[schluessel.toLowerCase()]
    return wert != null && wert !== "" ? wert : treffer
  })
}

/**
 * Hängt die (aufgelöste) Signatur an den Text. E-Mail immer; WhatsApp nur wenn
 * `ersteNachricht`. Gibt den Text unverändert zurück, wenn keine Signatur greift.
 */
export function mitSignatur(args: {
  text: string
  kanal: "email" | "whatsapp"
  signaturVorlage: string | null | undefined
  kontext: SignaturKontext
  ersteNachricht?: boolean
}): string {
  const { text, kanal, signaturVorlage, kontext, ersteNachricht } = args
  if (!signaturVorlage) return text
  if (kanal === "whatsapp" && !ersteNachricht) return text
  const sig = loeseSignatur(signaturVorlage, kontext)
  const trenner = kanal === "email" ? "\n\n-- \n" : "\n\n"
  return `${text}${trenner}${sig}`
}

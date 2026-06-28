/**
 * Kommunikations-Schicht (Modul 007) — Secret-Ver-/Entschlüsselung.
 *
 * KRITISCH (CLAUDE.md-Pflichtregel): IMAP-Passwörter + GreenAPI-Tokens werden NUR
 * serverseitig verschlüsselt gespeichert (`*_verschluesselt`-Spalten). Der Schlüssel
 * kommt aus der Server-Env (`KOM_SECRET_KEY`), NIE aus der DB. In der UI sind die
 * Felder write-only — der Klartext wird nie zurückgegeben (API-Routen geben nur
 * `gesetzt: true/false` zurück, s. maskiere()).
 *
 * Verfahren: AES-256-GCM. Format des Ciphertext-Strings (Base64-Teile, durch ':'):
 *   v1:<iv>:<authTag>:<ciphertext>
 * Authentifiziert (GCM) → Manipulation wird beim Entschlüsseln erkannt.
 *
 * NUR serverseitig importieren (node:crypto). Niemals im Client-Bundle.
 */

import { createCipheriv, createDecipheriv, randomBytes, createHash } from "node:crypto"

const VERSION = "v1"
const ALGO = "aes-256-gcm"
const IV_LEN = 12 // GCM-Standard

/**
 * Leitet den 32-Byte-AES-Schlüssel aus der Env ab. `KOM_SECRET_KEY` darf eine
 * Passphrase beliebiger Länge sein (per SHA-256 auf 32 Byte normalisiert) ODER
 * ein 64-stelliger Hex-String (dann direkt genutzt).
 */
function ladeSchluessel(): Buffer {
  const roh = process.env.KOM_SECRET_KEY
  if (!roh || roh.length < 16) {
    throw new Error(
      "KOM_SECRET_KEY fehlt oder zu kurz (min. 16 Zeichen). Server-Env setzen — Secrets nicht speicherbar.",
    )
  }
  if (/^[0-9a-fA-F]{64}$/.test(roh)) return Buffer.from(roh, "hex")
  return createHash("sha256").update(roh, "utf8").digest()
}

/** Klartext → authentifizierter Ciphertext-String (oder null bei leerem Input). */
export function verschluessele(klartext: string | null | undefined): string | null {
  if (klartext == null || klartext === "") return null
  const key = ladeSchluessel()
  const iv = randomBytes(IV_LEN)
  const cipher = createCipheriv(ALGO, key, iv)
  const enc = Buffer.concat([cipher.update(klartext, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return [VERSION, iv.toString("base64"), tag.toString("base64"), enc.toString("base64")].join(":")
}

/** Ciphertext-String → Klartext. Wirft bei manipuliertem/ungültigem Wert. */
export function entschluessele(gespeichert: string | null | undefined): string | null {
  if (gespeichert == null || gespeichert === "") return null
  const teile = gespeichert.split(":")
  if (teile.length !== 4 || teile[0] !== VERSION) {
    throw new Error("Ungültiges Secret-Format (erwartet v1:iv:tag:ct).")
  }
  const key = ladeSchluessel()
  const iv = Buffer.from(teile[1], "base64")
  const tag = Buffer.from(teile[2], "base64")
  const ct = Buffer.from(teile[3], "base64")
  const decipher = createDecipheriv(ALGO, key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8")
}

/**
 * Write-only-Helfer für API-Responses: gibt NIE den Wert zurück, nur ob gesetzt.
 * So bleibt das Secret in der UI maskiert.
 */
export function maskiere(gespeichert: string | null | undefined): { gesetzt: boolean } {
  return { gesetzt: gespeichert != null && gespeichert !== "" }
}

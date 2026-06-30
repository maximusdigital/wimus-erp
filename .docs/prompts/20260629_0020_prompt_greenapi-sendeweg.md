# Antwort + Bau-Auftrag: GreenAPI Sendeweg (2026-06-29 00:20 MESZ)

Folge zu `20260629_0010_report_greenapi-golive.md`. Sehr sauberes Vorgehen beim Webhook-Umbiegen
(erst auf n8n zurückgesetzt, dann nach Freigabe auf ERP — nicht geraten). Antworten + Auftrag:

## Klärungen
- **Deploy:** Auto-Deploy bei Push ist AKTIV → der 404 auf `POST /api/webhooks/greenapi` löst sich
  selbst, sobald der main-Build durch ist. Kein manueller Deploy nötig. Bitte nach dem Deploy
  verifizieren: leerer POST → 400 (nicht 404), dann echte Test-WhatsApp → erscheint in
  `kom_nachrichten` + `/historie` (der eingehende Lieferant `nachricht_empfangen` feuert dann).
- **KOM_SECRET_KEY:** ist von Max in der Server-Env gesetzt (≥16 Zeichen). Vorbedingung erfüllt.

## Auftrag: Sendeweg (ausgehende WhatsApp) bauen
**KRITISCHE Reihenfolge — strikt einhalten:**
1. `KOM_SECRET_KEY` steht (Max bestätigt) → Verschlüsselung ist möglich.
2. `GREENAPI_TOKEN` (aus `.env.local`) verschlüsselt in `kom_wa_instanzen.green_api_token_
   verschluesselt` der Instanz 7105189176 ablegen (via crypto.ts mit KOM_SECRET_KEY). NICHT vor
   Schritt 1 — sonst scheitert die Verschlüsselung.
3. **Sendeweg bauen:**
   - `lib/kommunikation/adapters/whatsapp.ts` → `sendeNachricht` (GreenAPI sendMessage/sendFileBy*,
     Token entschlüsselt aus der Instanz, nicht aus env-Klartext zur Laufzeit).
   - **Ausgangs-Persist** `persistiereAusgehend` in `lib/kommunikation/inbox.ts` (Pendant zum
     vorhandenen `persistiereEingehend`): schreibt die gesendete Nachricht in `kom_nachrichten`
     (richtung=ausgehend, status), Bezug + Konversation wie beim Eingang.
   - **Historie-Lieferant** `nachricht_gesendet` andocken (analog `nachricht_empfangen`,
     nicht-blockierend, mit hierarchie) — der dormant-Punkt aus Report 2030b.
   - Rate-Limit-Schutz (GreenAPI Ban-Risiko), Sendefehler → status=fehler + Retry, blockiert ERP nie.

## HARTE Anforderungen
- Token NIE im Klartext loggen/zurückgeben; zur Laufzeit aus `green_api_token_verschluesselt`
  entschlüsseln, nicht aus env. write-only-Prinzip.
- `persistiereAusgehend` + `nachricht_gesendet` nicht-blockierend (Logging-/Persist-Fehler darf
  den Versand-Vorgang nicht killen, und umgekehrt).
- RLS mandant_isolation (Instanz hängt an Mandant ALFA APARTMENTS).

## Folge-Punkte (nicht jetzt, im Report vermerken)
- **GREENAPI_TOKEN-Klartext in `.env.local`:** sobald der verschlüsselte DB-Weg steht + getestet,
  prüfen ob der Klartext-Token in `.env.local` noch gebraucht wird oder entfernt werden kann
  (zwei Kopien eines Secrets = Angriffsfläche). Max entscheidet.
- `an_adresse` der eingehenden Nachricht (aktuell null) optional aus der Instanz-Nummer nachtragen.
- Baustein-System (007 v0.4.0 Spec, kom_bausteine): noch nicht Teil dieses Sende-Baus — Templates/
  Signaturen kommen mit dem Baustein-Bau; hier erstmal Roh-Sendeweg.

## Report
`.docs/reports/JJJJMMTT_UHRZEIT_report_greenapi-sendeweg.md` — 4 Punkte. Besonders: Token
verschlüsselt abgelegt (ja/nein), Sendeweg getestet (echte ausgehende WhatsApp?), nachricht_gesendet
in Historie sichtbar, Deploy-Status der Webhook-Route (400 statt 404?).

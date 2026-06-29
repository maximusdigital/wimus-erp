# Report: GreenAPI Sendeweg (Modul 007) (2026-06-29 10:40 MESZ)

Auftrag: `20260629_0020_prompt_greenapi-sendeweg.md`. Commits `b9bc589` (Sendeweg) + `c2e6df5`
(Rate-Limit). 394 Tests grün, build grün. Die kritische Reihenfolge (1. KOM_SECRET_KEY → 2. Token
verschlüsseln → 3. Sendeweg) wurde eingehalten.

## 1. Gebaut — mit echten Tabellen/Feldern
- **Token verschlüsselt abgelegt (JA):** `GREENAPI_TOKEN` → AES-256-GCM (crypto.ts/`KOM_SECRET_KEY`,
  Round-Trip verifiziert) → `kom_wa_instanzen.green_api_token_verschluesselt` der Instanz
  `7105189176`. Zur Laufzeit wird entschlüsselt, **nie aus env-Klartext**.
- **`adapters/whatsapp.ts sendeNachricht`:** bereits vorhanden (GreenAPI `sendMessage`), bekommt den
  entschlüsselten Token; wirft nie (Ergebnis trägt `status`).
- **`persistiereAusgehend`** (`inbox.ts`, Pendant zu `persistiereEingehend`): `kom_nachrichten`
  (richtung=ausgehend, status/extern_id/fehler_text/gesendet_am), Konversation + Bezüge wie beim
  Eingang. Helper `mieterEinheitObjekt` extrahiert (von `findeKontakt` mitgenutzt).
- **Historie-Lieferant `nachricht_gesendet`** (009) angedockt — analog `nachricht_empfangen`,
  nicht-blockierend, mit Einheit/Objekt-Hierarchie. (Der dormant-Punkt aus Report 2030b erledigt.)
- **`send.ts sendeWhatsapp()`** orchestriert: Instanz laden → Token entschlüsseln →
  **Rate-Limit-Schutz** (`warteRateLimit`, `KOM_CONFIG.waMinSendeAbstandMs`=1500ms je Instanz,
  DB-basiert über letzten `gesendet_am`) → senden → persistieren (auch Fehler → status=fehler,
  Retry-Diagnose).
- **8 Unit-/Integrationstests** gesamt für den Block (4 send-Orchestrator + 4 historie/bezug),
  inkl. Sende-Fehler-Pfad.

## 2. HARTE Anforderungen — erfüllt
- Token **nie im Klartext** geloggt/zurückgegeben; Laufzeit-Decrypt aus DB, write-only. ✓
- `persistiereAusgehend` + `nachricht_gesendet` **nicht-blockierend** (Persist-/Historie-Fehler
  killt den Versand nicht; Sende-Fehler killt das ERP nicht). ✓
- RLS mandant_isolation (Instanz an ALFA APARTMENTS). ✓
- Rate-Limit/Ban-Schutz. ✓

## 3. Offen / nicht live testbar
- **Sendeweg live getestet: NEIN.** Kein realer ausgehender WhatsApp ausgelöst — (a) es gibt noch
  keinen Consumer/Trigger (Reply-UI/Autoreply), (b) der Decrypt braucht `KOM_SECRET_KEY` in der
  **Server-Env** (lt. Auftrag gesetzt, aber nicht von mir verifizierbar), (c) Versand erst nach
  Deploy sinnvoll. Code-seitig + Unit-getestet vollständig.
- **`nachricht_gesendet` in der Historie sichtbar:** Code verdrahtet + Unit-getestet; live erst nach
  erstem echten Versand sichtbar.
- **Deploy-Status der Webhook-Route:** weiterhin **404** (`POST /api/webhooks/greenapi`), Root 500.
  Auto-Deploy (lt. Klärung aktiv) ist offenbar noch nicht durch / der Live-Build hängt. **Deploy ist
  von Max in den Backlog verschoben.** Bis dahin: kein Live-Empfang UND kein Live-Versand.
- **Retry-Queue:** Sendefehler werden als `status=fehler` + `fehler_text` persistiert (Grundlage);
  ein automatischer Retry-Job (`maxSendeVersuche`) ist noch nicht gebaut — Folge-Punkt.

## 4. Rückfragen / Folge-Punkte
- **`GREENAPI_TOKEN`-Klartext in `.env.local`:** Der verschlüsselte DB-Weg steht. Sobald live
  getestet, kann der Klartext-Token aus `.env.local` raus (zwei Secret-Kopien = Angriffsfläche).
  **Max entscheidet** — ich fasse `.env.local` nicht eigenmächtig an.
- **Consumer bauen?** Reply-Funktion (Inbox/Vorgang) oder statischer Autoreply als erster Aufrufer
  von `sendeWhatsapp()` — nach Deploy + Live-Empfangstest, oder schon jetzt code-seitig?
- **`an_adresse` eingehend** (aktuell null) optional aus der Instanz-Nummer nachtragen — Folge.
- Baustein-System (007 v0.4.0, kom_bausteine) bewusst NICHT Teil dieses Roh-Sendewegs.

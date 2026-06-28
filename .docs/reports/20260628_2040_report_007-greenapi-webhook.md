# Report: GreenAPI-Eingangs-Webhook (Modul 007) (2026-06-28 20:40 MESZ)

Auftrag (Chat): „007-Eingangs-Webhook". Commit `aa78d60`. 390 Tests grün, build grün.
Keine Migration nötig (`kom_wa_instanzen` + Inbox existieren seit 026).

## 1. Gebaut — mit echten Tabellen/Feldern
- **`POST /api/webhooks/greenapi`** (`app/api/webhooks/greenapi/route.ts`):
  1. Payload parsen (`request.json`, fail-safe).
  2. Instanz über `instanceData.idInstance` → `wimus.kom_wa_instanzen` (`green_id_instance`)
     auflösen → `id`, `mandant_id`, `webhook_token`, `aktiv`. Unbekannt/inaktiv → 404.
  3. **Auth timing-safe** gegen den **per-Instanz** `webhook_token` (Header `Authorization:
     Bearer …` oder `?token=`), fail-closed → 401.
  4. `parseGreenApiWebhook` (real, bereits getestet) → bei eingehender Nachricht
     `persistiereEingehend(adminClient, {mandant_id, kanal:'whatsapp', wa_instanz_id}, nachricht)`.
     Status-Callbacks (keine Nachricht) → `200 {ignored:true}`.
  5. Admin-Client (Service-Role, kein User-Session-Kontext); Mandant explizit aus der Instanz.
- **Aktiviert die Ingestion-Kette:** eingehende WhatsApp → `kom_nachrichten`/`kom_nachricht_bezug`
  (007) **und** automatisch die Historie-Aktivität `nachricht_empfangen` (009) — die zuvor
  „dormante" Verdrahtung feuert jetzt real.
- Idempotent/Retry-fest über `extern_id` (in `persistiereEingehend`).
- **7 Integrationstests** (Auth, unbekannte Instanz, Status-Callback, Delegation, ?token=).

## 2. Abweichungen / Realität
- **Nur eingehend + nur WhatsApp.** „Eingangs-Webhook" = GreenAPI (WhatsApp). E-Mail ist IMAP
  (Poll, kein Webhook) → separater Job, nicht hier. Ausgehend (`nachricht_gesendet`) braucht erst
  einen Ausgangs-Persist-Pfad (007-Folge).
- **Auth per-Instanz statt globalem ENV-Secret:** sauberer für Multi-Instanz/Multi-Mandant; der
  Token liegt in `kom_wa_instanzen.webhook_token`.

## 3. Go-Live (offen — braucht Daten/Console, kein Code)
> GreenAPI-Instanz ist laut Max bezahlt/verlängert → produktiv nutzbar. Es fehlt nur Konfiguration:
1. **`kom_wa_instanzen`-Zeile anlegen** (aktuell **leer**) mit `green_id_instance` (= GreenAPI
   idInstance), selbst gewähltem `webhook_token`, `mandant_id`, `aktiv=true`. (Für *Empfang* reicht
   das; für *Antworten senden* zusätzlich `green_api_token_verschluesselt` via crypto.ts.)
2. **GreenAPI-Console:** Webhook-URL = `https://erp.m81s.de/api/webhooks/greenapi`,
   `incomingMessageReceived` aktivieren, **Authorization-Header-Token = derselbe `webhook_token`**.
3. Test: WhatsApp an die Instanz → Eintrag in `kom_nachrichten` + Aktivität in `/historie`.

## 4. Rückfragen
- **Instanz-Daten zum Scharfschalten:** Welche GreenAPI `idInstance` und welcher **Mandant**
  (ALFA APARTMENTS / CAMPUS / DEVELOPMENT / WIMUS Hausverwaltung)? Dann lege ich die
  `kom_wa_instanzen`-Zeile via `/pg/query` an (webhook_token generiere ich) — du trägst ihn nur
  noch in der GreenAPI-Console ein.
- **Senden (Antworten):** Soll ich den Ausgangs-Weg (sendeNachricht + Ausgangs-Persist +
  `nachricht_gesendet`-Historie) als Folge bauen? Dann brauche ich den GreenAPI apiToken
  (wird verschlüsselt abgelegt).

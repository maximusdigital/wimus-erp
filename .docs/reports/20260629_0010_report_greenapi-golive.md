# Report: GreenAPI Go-Live — ERP übernimmt direkt (2026-06-29 00:10 MESZ)

Folge zu `…_report_007-greenapi-webhook.md`. Entscheidung Max: **ERP übernimmt GreenAPI direkt,
n8n war nur ein Test.**

## 1. Gemacht
- **`kom_wa_instanzen`-Zeile angelegt** (via `/pg/query`): Instanz `7105189176`, Mandant
  **ALFA APARTMENTS** (`33333333-…`), `green_api_host='https://7105.api.greenapi.com'`,
  `webhook_token` gesetzt (liegt nur in der DB), `status='authorized'`, `aktiv=true`.
- **GreenAPI-Webhook auf den ERP umgebogen** (`setSettings`, verifiziert via `getSettings`):
  `webhookUrl=https://erp.m81s.de/api/webhooks/greenapi`, `incomingWebhook=yes`,
  `webhookUrlToken` gesetzt (= der DB-`webhook_token`). Outgoing/State-Webhooks = no.
- **Vorbefund + sauberes Vorgehen:** Die Instanz hing vorher an n8n
  (`n.m80s.de/webhook/df615d65-…`). Da GreenAPI nur EINE Webhook-URL erlaubt, habe ich zuerst
  gestoppt + auf n8n zurückgesetzt (nicht geraten), dann nach Max' Freigabe („n8n war Test")
  final auf den ERP gestellt. n8n empfängt damit keine WhatsApp mehr (so gewollt).

## 2. OFFENER BLOCKER (Aktion nötig)
- **ERP-Route ist noch nicht live deployed:** `POST https://erp.m81s.de/api/webhooks/greenapi`
  liefert aktuell **404** (Code ist auf `main`, aber die laufende Instanz hat den neuen Build noch
  nicht). → **Deployment von `main` auf erp.m81s.de nötig** (Coolify/Auto-Deploy). Bis dahin
  laufen eingehende WhatsApp bei GreenAPI ins Leere (Queue/Retry).
- Nach dem Deploy: `POST …/greenapi` mit leerem Body sollte **400** (nicht 404) liefern; dann echte
  Test-WhatsApp → erscheint in `kom_nachrichten` + `/historie`.

## 3. Offen / Folge
- **Senden (Antworten):** `KOM_SECRET_KEY` ist in der Server-Env **nicht gesetzt** → der
  GreenAPI-apiToken (`GREENAPI_TOKEN` in `.env.local`) wurde **nicht** verschlüsselt abgelegt.
  Fürs reine Empfangen egal. Für ausgehende Nachrichten: `KOM_SECRET_KEY` setzen (min. 16 Zeichen),
  dann lege ich den Token verschlüsselt in `kom_wa_instanzen.green_api_token_verschluesselt` und
  baue den Sendeweg (`sendeNachricht` + Ausgangs-Persist + `nachricht_gesendet`-Historie).
- **`an_adresse`** der eingehenden Nachricht ist aktuell null (eigene Instanz-Nummer); optional aus
  der Instanz nachtragen.

## 4. Rückfragen
- **Deploy:** Läuft auf erp.m81s.de Auto-Deploy bei Push, oder muss in Coolify manuell deployt
  werden? (Ich habe keinen Deploy-Zugang — bitte anstoßen oder mir den Weg nennen.)
- **`KOM_SECRET_KEY`** in der Server-Env setzen, wenn der Sendeweg gebaut werden soll?

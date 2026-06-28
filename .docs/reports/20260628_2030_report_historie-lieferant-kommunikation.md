# Report: GreenAPI/Kommunikation → Historie-Lieferant (Modul 009) (2026-06-28 20:30 MESZ)

Auftrag (Chat): „check greenapi unter 009" → bestätigter Scope: WhatsApp(GreenAPI)+E-Mail als
Aktivitäts-Lieferant der Historie (009) verdrahten. Commit `76c2385`. 383 Tests grün, build grün.
Keine Migration nötig (`aktivitaeten` existiert seit 028).

## 1. Gebaut — mit echten Tabellen/Feldern
- **`lib/kommunikation/inbox.ts` → `persistiereEingehend`** ruft nach dem Schreiben einer NEUEN
  eingehenden Nachricht (mit zugeordnetem Kontakt) `protokolliere()` (Modul 009):
  - `typ='nachricht_empfangen'`, `modul='kommunikation'`,
  - `titel='WhatsApp empfangen'` / `'E-Mail empfangen'` (kanal-abhängig), `beschreibung`=Betreff/
    Text-Snippet, `payload={kanal, nachricht_id, von}`,
  - `primaerBezug={typ: ist_mieter?'mieter':'kontakt', id}` + `hierarchie={einheit_id, objekt_id}`.
  - **Nicht-blockierend** (protokolliere schluckt Fehler) und nur bei `neu`+Kontakt → keine
    Doppel-Aktivität bei Webhook-Retry, kein Eintrag ohne Entitäts-Bezug.
- **`protokolliere()` erweitert** um optionales `hierarchie`: der Aufrufer (Kommunikation kennt
  einheit/objekt des Mieters bereits) übergibt sie; sie wird mit der aus dem Primär-Bezug
  abgeleiteten Hierarchie gemerged → die Nachricht erscheint auch in der Einheit-/Objekt-Historie
  (dezentral „inkl. untergeordnete"), nicht nur beim Kontakt.
- **Test** ergänzt: Mieter-Primär + übergebene Hierarchie → Einheit/Objekt als abgeleitete Bezüge.

## 2. Abweichungen / Realität
- **WhatsApp = GreenAPI-Adapter** (`lib/kommunikation/adapters/whatsapp.ts`), E-Mail = IMAP-Adapter.
  Beide laufen über denselben Persist-Pfad (`persistiereEingehend`) → das Wiring deckt **beide
  Kanäle** ab (nicht nur GreenAPI). Token für GreenAPI liegt laut Max in `.env.local` (für das
  Historie-Wiring nicht nötig — relevant erst beim realen Empfang/Senden).
- **Dormant bis Ingestion live:** `persistiereEingehend` wird aktuell von KEINER Webhook-Route
  gerufen (007 ist „Fundament" — Ingestion-Route noch nicht gebaut). Das Wiring feuert automatisch,
  sobald der GreenAPI/IMAP-Webhook die Nachrichten hereinreicht. Bewusst so: Lieferant steht, wartet
  auf die Ingestion.

## 3. Offen (geparkt)
- **`nachricht_gesendet` (ausgehend):** es existiert noch KEIN Ausgangs-Persist-Pfad in 007
  (`persistiereAusgehend` fehlt). Sobald ausgehende Nachrichten persistiert werden, dort analog
  `protokolliere(typ='nachricht_gesendet')` andocken — Folge-Punkt (gehört zum 007-Ingestion-Bau).
- **Eingangs-Webhook (007):** GreenAPI-/IMAP-Webhook-Route, die `persistiereEingehend` ruft, ist
  der eigentliche Aktivierungs-Schritt (Modul 007, nicht 009).
- **FiBu-Lieferanten** (zahlung_eingegangen/mahnung_versandt/beleg_verbucht) bleiben der nächste
  bestätigte Historie-Folge-Auftrag (Priorität vor Kommunikation laut Antwort 2030 — hier wurde
  Kommunikation auf expliziten Wunsch zuerst angedockt, da der Persist-Pfad schon stand).

## 4. Rückfragen
- Keine. Scope war via Rückfrage geklärt (Kommunikation→Historie, beide Kanäle).

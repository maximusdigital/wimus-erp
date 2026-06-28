# Stand-Report 0004 ops — 2026-06-28

> Festschreiben der Spec auf den realen Code-/Migrationsstand + Bau-Chronik aus `git log`.
> Modulversion: **0.4.1** (in_arbeit). Sicherungspunkt: Tag
> `sicherung/vor-festschreiben-004-20260628-0125`.

## 1. Gebaut (echte Tabellen / Felder / Dateien)

**Migrationen (eingespielt):**
- `017_akteure.sql` — `akteure` (typ mensch/ki/extern, kontakt_id, organisation_id, ki_modell,
  ki_konfidenz_schwelle, bereich[]), `akteur_verfuegbarkeit`, `akteur_faehigkeiten` (additiv, da
  `akteure` aus V501 live ohne typ/mandant_id existierte).
- `018_ops_vorgaenge.sql` — `vorgaenge` geschärft (CHECK typ/status, `owner_akteur_id`,
  `faellig_am`, `eskaliert`/`eskaliert_am`, `benachrichtigung_kanal`; CHECKs `NOT VALID`);
  `vorgang_verlauf`, `vorgang_zuweisung`, `vorgang_foto`; 5 Typ-Tabellen `vorgang_reinigung/
  _uebergabe/_wartung/_reparatur/_schaden` (vorgang_id PK); `checklisten_ausfuehrungen.akteur_id`.
- `019_vorgang_foto_ki.sql` — `vorgang_foto` + `ki_analyse` JSONB, `ki_confidence` NUMERIC(3,2),
  `ki_status` TEXT CHECK(auto/pruefen/manuell), `ki_analysiert_am` TIMESTAMPTZ.

**Engine-Logik (`lib/ops/`, DB-frei, getestet):**
- `status.ts` (statusUebergang/uebergangErlaubt/istAbgeschlossen), `schaden.ts`
  (schwereAusBetrag/abwicklungsstufeAusBetrag/schadenEinstufung), `eskalation.ts`
  (eskalationFaellig/istUeberfaellig/eskalationsGrund/zeigtEskalation), `confidence.ts`
  (kiStatusAusConfidence). Unit-Tests: `ops.test.ts` (14) + `confidence.test.ts` (5).

**KI-Bildverarbeitung (Claude Vision, Übergabe-Fotos):**
- `lib/integrations/claude.ts` — Vision-Call (raw HTTP Messages API, `claude-opus-4-8`),
  Aufgaben `claudeZaehlerstand` + `claudeUebergabeAbgleich`; Schema im Prompt, nur JSON.
- `lib/validations/foto-analyse.ts` — zod-Schemas (zaehler/abgleich), serverseitige Validierung.
- `app/api/vorgaenge/[id]/foto-analyse/route.ts` — modus=zaehler|abgleich → Public-URL→base64 →
  Claude → validieren → Confidence-Routing → `vorgang_foto.ki_*` (+ best-effort
  `vorgang_uebergabe.zaehlerstaende.ki`).
- `app/api/vorgaenge/[id]/schaden-uebernehmen/route.ts` — Vorschlag → Folge-Vorgang `typ=schaden`
  + `vorgang_schaden` + Verlauf-Querverweis (Kostenträger Mieter, Objekt/Einheit geerbt).

**UI / API (Auszug):** Plantafel-DnD, Vorgang-Detail (Zuweisungen/Verlauf/Typ-Panels/Eskalation),
Akteure-CRUD, Foto-UI (`vorgang-fotos.tsx`: Kamera-Capture + Galerie + KI-Badges + „Zähler lesen"
+ „Vorher/Nachher abgleichen" + „Als Schaden anlegen").

**Qualität:** `npm run test:run` 298 grün, `npm run build` grün, E2E-Grobtests 25/25 grün.

## 2. Abweichungen (Spec ↔ Realität, jetzt korrigiert)

- **600_tests** nannte `istEskaliert` — reale Funktionen heißen `eskalationFaellig`/
  `istUeberfaellig`/`eskalationsGrund`/`zeigtEskalation`. → korrigiert.
- **600_tests** führte Foto-Capture + KI als „Hook/offen" — sind gebaut (Confidence-Test +
  Endpoints). → festgeschrieben.
- **500_migration** kannte Migration 019 nicht. → ergänzt.
- **400_design**: „Recharts" / Fotos als „Upload-Hook" → auf Konvention **shadcn-charts**
  (Recharts-basiert) + gebauten Foto-/KI-Stand gebracht.
- **README-Index**: 0004 stand auf 0.3.0 + eine veraltete 0.1.0-Dublette. → eine Zeile 0.4.1,
  Dublette entfernt (war der abgelöste Chat-Grobentwurf, keine echte Info).
- **Frühere Idee „Mistral Pixtral fürs Bild"** → korrigiert: Claude Vision für Übergabe-Fotos,
  Mistral bleibt FiBu/Belege-only (Decision-Log 2026-06-28).

## 3. Offen (bewusst, kein Defekt)

- **Forderung/Kaution-Verknüpfung** beim übernommenen Schaden (`vorgang_schaden.forderung_id`)
  wird noch nicht automatisch gesetzt — hängt an der Kautionsabrechnung (Kern).
- **Doppelklick-Schutz** bei „Als Schaden anlegen" ist session-lokal (kein Idempotenz-Tracking
  in `ki_analyse`).
- **Modellgüte-Vorbehalt:** Auto-Confidence-Schwellen erst scharfstellen nach Test an 20–30
  echten Vorher/Nachher-Paaren; aktuell kritische Felder generell „nie auto".
- **Kein automatisierter E2E** der KI-Pipeline (braucht echte Fotos + `ANTHROPIC_TOKEN`); DB
  aktuell ohne Vorgänge → Detail-Drilldown im Grobtest übersprungen.
- **Externe Hooks** (Benachrichtigung, Auftrag-Versand, KI-Checklisten-Prüfloop) weiter Stub.
- **OP-6**: alte schema-only-Tabellen (`ma_profile`/`einsaetze`/…) noch nicht gedroppt.

## 4. Rückfragen / Entscheidungen

1. **Version einfrieren?** 0.4.1 ist ein kohärenter, getesteter Stand. Soll ich am Meilenstein
   `status: freigegeben` setzen, oder bleibt 004 im Cycle `in_arbeit`? (Aktuell: in_arbeit.)
2. **Schaden-Übernahme**: Kostenträger ist hart `mieter` (Auszug→Kaution). Bei Einzug-Übergaben
   unpassend — soll das wählbar werden oder pro Richtung automatisch?
3. **Idempotenz** der Schaden-Übernahme: übernommene Vorschläge in `ki_analyse` markieren, damit
   nach Reload kein Doppelanlegen möglich ist — bauen?
4. **README-Dublette** (alte 0.1.0-Zeile) habe ich entfernt statt nur zu markieren — ok so?

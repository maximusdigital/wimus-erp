# Report: FiBu als Historie-Lieferant (009) — 2026-06-29 11:35 MESZ

Auftrag: `.docs/prompts/20260629_1130_prompt_fibu-historie-lieferant.md` (Backlog #14, erster
bestätigter Historie-Folge-Auftrag). Voller Zyklus. Commit `e99a90d`. Tests 401 grün, Build grün.
Review-Subagent: **FREIGABE** (keine kritischen Findings).

## 1) Gebaut (mit echten Tabellen/Feldern)

Alle 3 Lieferanten über die EINE `protokolliere()`-API (Modul 009, `lib/historie/`) verdrahtet —
keine neue Infrastruktur, keine Migration, nicht-blockierend. Zentrale Service-Schicht
`lib/fibu/historie.ts` (3 dünne Emitter), DB-gestützter K1-Resolver `lib/fibu/k1-bezug.ts`.

**`zahlung_eingegangen`** (modul=fibu) — an **2 realen Stellen**:
- `app/api/fibu/bank/import/route.ts` (Auto-Import): feuert je Umsatz mit
  `zuordnung_status="zugeordnet" && m.mietvertrag_id`, nach erfolgreichem `bank_umsaetze`-Insert.
  payload `{betrag, datum: wertstellung, forderung_id, quelle:"bank"}`.
- `app/api/fibu/bank/umsaetze/[id]/zuordnen/route.ts` (manuell): feuert bei
  `richtung="einnahme" && forderung_id`, nach erfolgreichem Update. quelle `"manuell"`.
- **primärBezug** = `{typ:"mietvertrag"}`; Hierarchie `einheit_id/objekt_id` mitgegeben.
- echte Felder: `bank_umsaetze.{betrag,wertstellung,richtung,mietvertrag_id,objekt_id,einheit_id,
  forderung_id}`, `forderungen.{id,mietvertrag_id}` (Letzteres im Select für den Bezug ergänzt).

**`mahnung_versandt`** (modul=fibu) — an **2 realen Stellen**:
- `app/api/forderungen/[id]/mahnung/route.ts` (Mahnlauf-Action, nutzt `naechsteMahnung`): nach
  erfolgreichem Mahnungs-Insert + Forderungs-Update. payload `{mahnstufe, betrag: gesamt, forderung_id}`.
- `app/api/mahnungen/route.ts` POST (manuelle Mahnung): nach erfolgreichem Insert.
  payload `{mahnstufe: stufe, betrag: gesamtforderung, forderung_id:null}`.
- **primärBezug** = `{typ:"mietvertrag"}` aus `forderung.mietvertrag_id` bzw. `mahnungen.mietvertrag_id`.
- echte Felder: `mahnungen.{stufe,gesamtforderung,mietvertrag_id}`, `forderungen.mietvertrag_id`,
  `MahnVorschlag.{stufe,gesamt}` aus `lib/utils/mahnlauf.ts`.

**`beleg_verbucht`** (modul=fibu) — an **2 realen Stellen**:
- `app/api/fibu/belege/route.ts` POST (KI-Auto): nur bei `entwurf.auto_buchbar`, nach
  `fibu_buchungen`-Insert. art `"ki"`.
- `app/api/fibu/belege/[id]/route.ts` PATCH `action="freigeben"` (Mensch): nach Buchung +
  `status="gebucht"`-Update. art `"mensch"`.
- **primärBezug** = Objekt/Einheit via **K1-Auflösung** (`resolveK1Bezug`): zuerst volle
  Einheit-Code-Übereinstimmung (`einheiten.verwendungszweck_code`) → Einheit (+Objekt), sonst
  Objektkürzel (`objekte.kuerzel`) via vorhandenem `parseVerwendungszweck`. Kein Treffer → nur Mandant.
- echte Felder: `belege.{id,brutto,soll_konto,k1,mandant_id}`, `einheiten.verwendungszweck_code`,
  `objekte.kuerzel`.

**Service-Erweiterung (minimal, additiv, rückwärtskompatibel):**
- `lib/historie/types.ts`: `ProtokolliereInput.primaerBezug` jetzt **optional** — für „nur Mandant"-
  Aktivitäten (z.B. Lieferanten-Beleg ohne Objekt). Bestehende Aufrufer (007, Verträge) unberührt.
- `lib/historie/bezug.ts`: neue `bezuegeAusHierarchie()` (alle Hierarchie-IDs als „abgeleitet"),
  greift, wenn kein Primär-Bezug vorliegt.
- `lib/historie/protokolliere.ts`: verzweigt sauber je nach vorhandenem `primaerBezug`. Zentraler
  Feed (`getFeed`) liest `aktivitaeten` direkt per Mandant → bezuglose Aktivität ist zentral sichtbar.

**Nicht-blockierend (harte Anforderung erfüllt):** Emitter werfen nie — `safe()` schluckt
`protokolliere`-Fehler; `resolveK1Bezug` zusätzlich try/catch-gekapselt; der Mandant-Lookup im
zuordnen-Pfad komplett in try/catch; jeder Historie-Aufruf liegt NACH dem erfolgreichen
FiBu-Schreibvorgang. Tests decken beide Wurf-Pfade ab.

**Tests:** `tests/unit/lib/fibu-historie.test.ts` (+7): typ/modul/primärBezug/payload je Lieferant,
„nur Mandant"-Fall (ohne Mietvertrag / ohne K1-Treffer), 2× Nicht-Blockieren (protokolliere wirft,
resolveK1Bezug wirft).

## 2) Abweichungen (inkl. Review-Findings)

- **Je Lieferant 2 Andockstellen** statt einer — beide sind reale, getrennte Vorgänge (auto/manuell
  bzw. ki/mensch). Bewusst, damit jede echte Zahlung/Mahnung/Verbuchung erfasst wird (kein
  Doppel-Logging desselben Ereignisses, da disjunkte Pfade).
- **K1-Resolver neu** (`k1-bezug.ts`): `bank-match.ts` löst K1 in-memory aus vorgeladenen Arrays;
  die Beleg-Verbuchung hat nur den K1-String → frischer DB-Lookup nötig. Der Parser
  (`parseVerwendungszweck`) wird geteilt → keine Kernlogik-Doppelung (Review bestätigt, KLEIN).
- Review-Finding (KLEIN, **behoben**): Mandant-Lookup im zuordnen-Pfad war ungekapselt nach dem
  Write → jetzt in try/catch (Leitplanke „blockiert nie" deckt auch die Mandant-Auflösung).
- Review-Finding (KLEIN, offen/harmlos): bei `zahlung_eingegangen` mit Mietvertrag ist das
  zusätzliche Mitgeben von einheit/objekt streng genommen redundant (Service leitet sie ohnehin ab),
  Merge gleicher Quelle → unschädlich.
- Doku (`.docs/CLAUDE.md`, `_LOG.md`) von Konzept-Claude wurde bewusst NICHT in den Build-Commit
  aufgenommen (gehört nicht zu diesem Bau).

## 3) Offen

- **HistorieTab dezentral**: die FiBu-Aktivitäten sind im zentralen Feed `/historie` sichtbar; der
  dezentrale `<HistorieTab>` ist noch in keine Detailseite eingehängt (Backlog #14, eigener
  Stufe-2-Schritt — wie im Prompt vermerkt). Kein Handlungsbedarf hier.
- Weitere Lieferanten (Belegung, Zugang/Schloss) bleiben Stufe-2/Phase 3.
- Mahnung-„versandt" erfasst aktuell das **Auslösen/Erstellen** der Mahnung (kein realer
  Versand-Kanal angebunden) — sobald 007 die Mahnung tatsächlich verschickt, ggf. Zeitpunkt/Quelle
  verfeinern.

## 4) Rückfragen

- **Doppel-Logging Mahnung (Beobachtung):** `forderungen/[id]/mahnung` (Mahnlauf) und `mahnungen`
  POST (manuell) sind zwei legitime Erstellungspfade. Aktuell getrennte UI-Flows → kein Doppel-Log.
  Falls künftig die manuelle Maske intern den Mahnlauf-Endpoint nachzieht, entstünden zwei
  Aktivitäten — bitte bei Bedarf einen kanonischen Pfad festlegen.
- **„nur Mandant"-Belege:** Lieferanten-Belege ohne K1 erzeugen eine bezuglose Aktivität (nur
  zentraler Feed). Falls gewünscht, dass solche Belege stattdessen am **Buchungskreis/`firma_id`**
  hängen (eigener Bezugstyp „organisation"/„firma"), bitte Spec ergänzen — aktuell bewusst nicht
  geraten (Prompt: „sonst nur Mandant").

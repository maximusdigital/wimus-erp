---
id: 0010
titel: Berechtigungen (RBAC mit Bereich × Stufe × Scope)
status: entwurf            # entwurf | in_arbeit | freigegeben | umgesetzt | abgelöst
version: 0.1.0            # springt nur am Meilenstein; lebt NUR in dieser Datei
modul: berechtigungen
erstellt: 2026-06-29
geaendert: 2026-06-29
abhaengt_von: [0001]
---

# 0010 — Berechtigungen (RBAC: Bereich × Stufe × Scope)

## Worum geht's

Ein durchgängiges Berechtigungssystem fürs GESAMTE ERP. Heute existiert ein Rollen-Fundament
(`rollen` mit 12 geseedeten Rollen, `benutzer_rollen` als n:m User↔Rolle×Mandant), aber die Rollen
tragen KEINE maschinenlesbaren Rechte — die RLS nutzt nur die abgeleitete Mandantenliste
(`user_mandanten()`). Real heißt das: Ob jemand `verwalter` oder `buchhalter` ist, ändert aktuell
NICHTS an seinen Zugriffsrechten — beide sehen innerhalb des Mandanten alles. Die Rollen-
Beschreibung ist Doku, keine Durchsetzung.

Dieses Modul macht aus den Rollen echte, durchgesetzte Rechte und erweitert den Geltungsbereich
über „ein Mandant" hinaus.

## Drei Achsen (das Kernmodell)

Eine Berechtigung ist immer ein Tripel: **Bereich × Stufe × Scope.**

### Achse 1 — Bereich (WAS, pro Modul)
Funktionsbereiche, grob entlang der Module:
`fibu` · `vorgaenge` · `belegung` · `crm` · `stammdaten` · `kommunikation` · `historie` ·
`berechtigungen` (Admin) · `audit`.
> Granularität = Modul-Ebene, bewusst NICHT Feld-Ebene. Feld-Rechte sind ein Komplexitäts-Sumpf
> (Pflege + RLS-Durchsetzung explodieren). Falls je ein einzelnes Feld geschützt werden muss
> (z.B. Bankdaten), löst das ein gezielter Spezialfall — kein generisches Feld-Rechte-System.
> (Prinzip „lean over complex".)

### Achse 2 — Stufe (WIE VIEL, hierarchisch)
`kein` < `lesen` < `schreiben` < `freigeben`
- **kein** — expliziter Ausschluss (sieht den Bereich gar nicht).
- **lesen** — View.
- **schreiben** — Edit + Create + Delete (gebündelt; keine Trennung in dieser Stufe).
- **freigeben** — Approval/Genehmigung: einen Datensatz verbindlich machen (Mahnung freigeben,
  Beleg zur Verbuchung freigeben, Mietanpassung genehmigen). Schließt `schreiben` ein.
> Hierarchisch: höhere Stufe schließt alle darunter ein. „freigeben" ist die Approval-Schwelle,
> die fachlich schon an vielen Stellen existiert (FiBu-Gating, KI-Konfidenz, geldwirksam-Freigabe).

> **NICHT enthalten — Teilen/Weiterleiten (extern):** Daten an Dritte rausgeben (Vorgang an
> Handwerker, Beleg an StB, Dokument extern) ist eine ANDERE Vertrauensentscheidung als Approval
> und gehört NICHT in die Stufen-Leiter (sonst dürfte jeder Freigeber automatisch nach außen
> teilen — DSGVO-Falle). Kommt später als SEPARATES, orthogonales Recht (Backlog). Bis dahin
> hängt Außen-Weitergabe an den vorhandenen Kommunikations-/Versand-Leitplanken + Logging.

### Achse 3 — Scope (WO, vererbend nach unten)
`global` > `mandant` (=Marke) > `gesellschaft` (=Firma/Buchungskreis) > `objekt`
- Ein Scope-Eintrag zeigt auf EINEN Knoten eines Typs (`scope_typ` + `scope_id`) und gilt für
  diesen Knoten **plus alles darunter** (Vererbung).
- `global` = alle Mandanten/Gesellschaften/Objekte (Geschäftsführung). `scope_id` = null.
- Beispiele:
  - Projektleitung ALFA APARTMENTS → `scope_typ=mandant, scope_id=AA` → alles unter AA.
  - FiBu über zwei Firmen → ZWEI Zuweisungen `scope_typ=gesellschaft` (oder eine pro Firma).
  - Hausmeister eines Gebäudes → `scope_typ=objekt, scope_id=…`.

> **Reale Hierarchie (aus Migration 002 verifiziert):** `mandanten` → `gesellschaften`
> (mandant_id FK) → `objekte` (mandant_id FK + optional gesellschaft_id FK) → `einheiten`
> (objekt_id FK, KEINE eigene mandant_id). Es gibt KEINE `projekte`- oder `marken`-Tabelle —
> „Marke" = `mandant`, „Firma" = `gesellschaft`. Einheit-Scope wird über das Objekt aufgelöst.

## Effektives Recht (Auflösung)

„Darf User U im Bereich B mit Stufe S auf Ressource R zugreifen?"
1. Ressource R → ihre Hierarchie-Kette bestimmen (Objekt → Gesellschaft → Mandant; bzw. Einheit
   → Objekt → …).
2. Alle `benutzer_rollen`-Zuweisungen von U sammeln, die zeitlich gültig sind (`gueltig_von/bis`).
3. Davon die behalten, deren Scope R abdeckt (Scope-Knoten liegt auf R's Kette oder ist global).
4. Für jede davon die Rollen-Rechte im Bereich B nachschlagen (`rolle_rechte`).
5. **Höchste Stufe gewinnt** (Vereinigung, max). Wenn ≥ S → erlaubt.

> Mehrere Rollen/Gruppen → Rechte ADDIEREN sich (Vereinigung), nie Subtraktion. Eine explizite
> `kein`-Stufe in einer Rolle hebt NICHT ein `schreiben` aus einer anderen Rolle auf (additive
> Vereinigung; expliziter Entzug wäre ein späteres, separates Feature — YAGNI für jetzt).

## Architektur-Entscheidungen

1. **Vorhandenes erweitern, nicht neu daneben** (Entscheidung Max 2026-06-29): `rollen` +
   `benutzer_rollen` bleiben, werden ergänzt. Spart Migration des `benutzer_rollen`-Bestands +
   die bestehende `user_mandanten()`-RLS bleibt funktionsfähig, bis die neue Engine sie ablöst.

2. **Durchsetzung über `security definer`-Funktionen (wie `user_mandanten()`)** — NICHT als
   naive Subquery in jeder Policy. Die Scope-Vererbung (Objekt→Gesellschaft→Mandant hochlaufen +
   Bereich prüfen) wird in zentralen Funktionen gekapselt, die je Request die erlaubten IDs je
   Bereich liefern. Sonst wird die DB bei jeder Query langsam. **Performance ist hier kritisch:**
   das heutige `mandant_id in (select user_mandanten())` ist billig; das neue Modell darf nicht
   bei jeder Zeile die ganze Kette neu auflösen.

3. **Stufenweiser, risikoarmer Rollout (3 Stufen, s.u.)** — RLS über ~60 Tabellen umzubauen ist
   der gefährlichste denkbare Eingriff (kaputte Policy = alle sehen alles ODER keiner sieht was).
   Darum NIE Big Bang. Engine zuerst bauen + testen, dann modulweise scharfschalten.

4. **Vertretung kostenlos über vorhandene Felder:** `benutzer_rollen.gueltig_von/bis` existieren
   bereits → eine Vertretung ist eine zeitlich befristete Zuweisung. Kein Extra-Mechanismus, nur
   UI-Nutzbarmachung („Vertretung bis Datum X"). (Aus ERP-Best-Practice applus-erp.)

5. **DSGVO-Rechenschaft:** Eine exportierbare Berechtigungs-Matrix („wer darf was wo") ist Teil
   der DSGVO-Dokumentationspflicht bei echten Mieterdaten — kein Nice-to-have. (Aus Best-Practice.)

6. **Geschichtetes Modell (RBAC + RLS + leichtes ABAC) — bewusst KEIN ABAC-Vollausbau.**
   Das Modell folgt dem etablierten Sicherheits-Schichtenmuster (vgl. Databricks RBAC/RLS/ABAC):
   RBAC = `rollen`/`rolle_rechte` (wer darf was), RLS = Postgres Row-Level-Security (Durchsetzung,
   Stufe 2), und der Scope-Anker (`scope_typ`+`scope_id`, vererbend) ist ein LEICHTES,
   attributartiges ABAC-Element — kontextabhängige Entscheidung ohne feste Ebenen-Spalten. Ein
   vollwertiges ABAC mit Governance-Tags/Policy-Engine wäre für ein ~27-Einheiten-ERP massiv
   über-engineered → YAGNI. Übernommen wird das Schichten-KONZEPT (geschichtete Durchsetzung,
   Scope-als-Attribut), nicht die Enterprise-Maschinerie. Auch die empfohlene Reihenfolge
   (erst RBAC, dann RLS) deckt sich 1:1 mit der 3-Stufen-Planung.

## Stufung (3 sichere Scheiben — je eigener Bau-Auftrag)

> SDD-Prinzip: großes Querschnittsthema in einzeln testbare Scheiben schneiden, kein Big Bang.

### Stufe 1 — Datenmodell + Rechte-Engine (OHNE RLS-Umbau)
- Tabellen: `rolle_rechte` (Rolle×Bereich×Stufe), Scope-Felder an `benutzer_rollen`
  (`scope_typ`, `scope_id`); optional `bereiche`/`stufen` als ENUM/Lookup.
- Die 12 geseedeten Rollen mit ECHTEN Rechten füllen (Mapping aus ihren Klartext-Beschreibungen).
- Zentrale Funktionen: `hat_recht(bereich, stufe, ressource)` / `erlaubte_ids(bereich, scope_typ)`
  (security definer, analog `user_mandanten()`).
- UI: Rollen-/Rechte-Verwaltung (`/einstellungen/berechtigungen`) + Zuweisung User→Rolle×Scope.
- **RLS NOCH NICHT umstellen** — Engine existiert, wird gelesen, aber noch nicht durchgesetzt.
  Voll testbar, risikoarm. App-seitige Checks (UI/API) können hier schon andocken.

### Stufe 2 — Durchsetzung modulweise
- Modul für Modul: RLS-Policies + API-Checks auf die neue Engine umstellen. Reihenfolge nach
  Heikelkeit/Einfachheit (Vorschlag: erst `audit` als einfachster, dann `fibu` als heikelster).
- Jedes Modul EINZELN, mit Negativ-Tests, bevor das nächste dran ist. Kein paralleler Umbau.
- Übergangs-Konvention: bis ein Modul umgestellt ist, gilt für seine Tabellen weiter die alte
  `mandant_isolation`-Policy.

### Stufe 3 — Gruppen (Komfort obendrauf)
- `gruppen` = benannte Bündel von (Rolle, Scope)-Zuweisungen; User∈Gruppen erben.
- Technisch optional/additiv: eine Gruppe ist Wiederverwendung vorhandener Zuweisungen.
  Erst bauen, wenn Rolle×Scope steht und sich Wiederholung in der Praxis zeigt.

## Risiken & Leitplanken

- **Versagensarten doppelt absichern:** zu offen (Buchhalter sieht Mieterdaten → DSGVO) UND zu eng
  (Verwalter kann nicht arbeiten → Betrieb steht). Beide brauchen explizite Negativ-Tests.
- **service_role umgeht RLS** (wie bisher) — serverseitige API bleibt frei; die Durchsetzung für
  Menschen läuft über die `authenticated`-Policies. API-Routen müssen die Rechte SELBST prüfen,
  wo sie service_role nutzen (kein impliziter Schutz).
- **Kein Lockout:** superadmin/global-Admin muss immer erhalten bleiben; Migration darf den
  aktuellen Alleinnutzer (Max) nicht aussperren — Stufe-1-Seed gibt Max global/admin.
- **Audit-Bereich:** „wer darf das Audit-Log sehen" wird selbst über dieses System geregelt
  (löst Backlog #14-Punkt „Rollen-Restriktion Audit-Ansicht").

## Modul-Bezug

- **001 erp-kern:** liefert die Hierarchie (mandanten/gesellschaften/objekte/einheiten) +
  `rollen`/`benutzer_rollen`/`user_mandanten()`, die hier erweitert werden.
- **009 historie:** Audit-Ansicht-Restriktion (Backlog #14) wird hierüber gelöst.
- **Alle Fachmodule:** docken in Stufe 2 an die Engine an (RLS + API-Checks).
- **005 automation / 006 agenten (geplant):** KI-Akteure brauchen später eigene Rechte-Profile —
  das Akteure-Modell (mensch/ki) ist kompatibel, KI-Rechte = eigener späterer Punkt.

## Änderungshistorie

| Datum/Zeit (MESZ) | Vorgang | Dateien |
|-------------------|---------|---------|
| 2026-06-29 14:00 | v0.1.0 Erstentwurf: RBAC Bereich×Stufe×Scope auf vorhandenem rollen/benutzer_rollen-Fundament; 3-Stufen-Rollout; Vertretung über gueltig_von/bis; DSGVO-Matrix-Export; keine Feldebene; Teilen→Backlog. | 000/200/300 |

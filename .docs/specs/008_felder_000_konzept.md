---
id: 0008
titel: Custom-Field-Schicht + Kontaktmodell (Person/Organisation, Typen)
status: in_arbeit            # entwurf | in_arbeit | freigegeben | umgesetzt | abgelöst
version: 0.2.0            # springt nur am Meilenstein; lebt NUR in dieser Datei
modul: felder
erstellt: 2026-06-28
geaendert: 2026-06-28
abhaengt_von: [0001, 0006]
---

# 0008 — Custom-Field-Schicht + Kontaktmodell

## Worum geht's

Zwei eng verbundene Dinge in einem Modul:

1. **Kontaktmodell Person ↔ Organisation** (Pipedrive-Muster): saubere Trennung von natürlicher
   Person und Organisation/Unternehmen (Firma/Maklerbüro/Handwerksbetrieb/Hausverwaltung),
   verknüpft (eine Organisation hat mehrere Ansprechpartner). Beide mit pflegbaren **Typen**.
2. **Generische Custom-Field-Schicht** (querschnittlich): per UI definierbare Zusatzfelder an
   beliebigen Entitäten (Person, Organisation, Vorgänge, Objekte, Einheiten …), **je Feld
   filterbar**. Eigene Felder anlegen ohne Entwickler/Deploy.

Querschnittlich wie Suche (0006), Kommunikation (0007), Historie (0009): EINE Schicht, alle
Module docken an. Der Kontaktmodell-Teil berührt den Kern (0001), die Filterung dockt an die
Such-/Filter-Schicht (0006) an — KEIN zweites Filtersystem.

## Warum ein eigenes Modul

- **Querschnittlich** wie 0006/0007: Custom Fields gelten für viele Entitäten, nicht für eine.
- **Eigener Lebenszyklus:** Feld-Definitionen, Feldtypen, EAV-vs-JSONB-Entscheidung, Filter-
  Andockung — genug eigenständige Substanz für ein eigenes Konzept.
- **Kern bleibt scharf:** Das Kontakt-Person/Organisation-Modell ist eng am Kern, aber das
  Custom-Field-Framework drumherum würde 0001 überladen.

## Leitprinzipien

- **Stabiler `key`, nicht Label** (Pipedrive-Prinzip): Code/Filter referenzieren den stabilen
  Feld-/Options-`key`, NIE das Anzeige-Label. Label jederzeit umbenennbar, nichts bricht.
- **System-geschützt vs. frei:** Felder/Typen mit Code-Logik (Mieter/Lieferant/Eigentümer) sind
  `geschuetzt` — in UI sicht-/zuweisbar, aber nicht löschbar/umbenennbar. Alles andere frei.
- **Filter über Modul 0006** (nicht neu bauen): Custom Fields werden zu dynamischen
  `filterFields` der Such-Registry; `filter-bar.tsx` zeigt sie automatisch.
- **Fertige Lösung vor Eigenbau / kein Over-Engineering:** schlank halten (Typ-Listen + Custom
  Fields), KEIN volles Pipedrive-CRM-Customizing (keine Formelfelder, keine Feldgruppen-
  Hierarchien in Stufe 1).
- **RLS durchgängig**, mandant_isolation auf allen Tabellen.

## Zentrale Designentscheidung: Speicher-Ansatz Custom Fields — ENTSCHIEDEN: Variante C

> ENTSCHIEDEN (2026-06-28): **Variante C** (typisierte EAV-Wert-Spalten). Begründung Claude Code:
> (1) unsere Größe (einige tausend Kontakte, wenige Felder) → Joins unkritisch; (2) physische,
> typisierte, indizierbare Wert-Spalten (partielle B-Tree je Typ); (3) **0006-Andockung sauberer**
> — der 0006-Query-Builder kennt nur flache Spalten; C dockt über einen **id-Prefilter** an
> (`customFieldIds()` → bezug_id-Mengen → `.in("id", ids)`), statt JSONB-Casting/GIN in den
> Query-Builder zu drücken (vermeidet zweite Filtersystem-Komplexität). B (JSONB) bleibt hinter
> der Service-Schicht migrierbar, falls Multi-Feld-Last später bremst. Beide Varianten unten dokumentiert.

**Variante C (EMPFOHLEN als Default): EAV mit typisierten Wert-Spalten.**
- Definition `custom_field_def` (UI-pflegbar) + Werte in EINER Tabelle mit typgerechten Spalten
  (`wert_text`/`wert_zahl`/`wert_datum`/`wert_bool`), B-Tree-Index je Typ-Spalte.
- Vorteil: physische, typisierte, indizierbare Wert-Spalten (sauber filter-/sortierbar je Feld);
  vermeidet das „alles-als-Text"-EAV-Antipattern. Nachteil: Multi-Feld-Filter = Joins/Self-Joins.

**Variante B (Alternative): JSONB-Hybrid.**
- Feste Kern-Spalten + eine `custom_fields` JSONB-Spalte an der Entität, GIN-Index.
- Vorteil: ein Join weniger, weniger Tabellen, flexibel. Nachteil: Filterung gröber, explizites
  Typ-Casting nötig, Query-Planer „sieht" die Felder schlechter.

**Entscheidungsregel (Claude Code, im Report begründen):** Default C; wenn die reale Filterlast
über viele Custom Fields gleichzeitig geht und die Joins messbar bremsen → B erwägen. Bei
geringer Feldzahl/Last ist C klar besser (saubere Typisierung). NICHT raten — messen/begründen.

## Feldtypen (Stufe 1)

Text · Zahl · Datum · Auswahl (1 Option) · Mehrfachauswahl (n Optionen) · Ja/Nein.
(Roadmap: Währung/Geld, URL, Adresse, Verknüpfung-zu-Entität — später, kein Stufe-1-Zwang.)

## Kontaktmodell (Person/Organisation)

- **Person** (natürliche Person): Vorname/Nachname/E-Mail/Telefon … + Typen + Custom Fields.
- **Organisation** (Firma): Name/Anschrift/USt-ID … + Typen + Custom Fields.
- **Verknüpfung:** Person gehört zu 0..n Organisationen (Ansprechpartner-Rolle); Organisation
  hat 0..n Personen. n:m mit optionaler Funktions-/Positionsangabe.
- **Typen** (Kontakttyp/Organisationstyp): Auswahl-Felder mit System-Schutz — Mieter/Lieferant/
  Eigentümer geschützt (Code-Logik), Makler/Interessent/Energieberater/… frei. n:m (ein Kontakt
  kann mehrere Typen haben).
- ⚠ **Reale `kontakte`-Struktur prüfen:** trennt sie schon Person/Firma? Migrationspfad zu
  getrennten Objekten — NICHT blind neu bauen, vorhandenes referenzieren/erweitern.

## Abgrenzung

- **Nicht** das Filtersystem selbst — das ist Modul 0006; hier nur die Felddefinitionen, die als
  dynamische Filter dort andocken.
- **Nicht** volles CRM-Customizing (Formelfelder, „required/important"-Workflows, Feldgruppen-
  Hierarchie) — bewusst aus Stufe 1 ausgeklammert (Over-Engineering vermeiden).
- **Verhältnis `fibu_lieferanten`:** klären, ob „Lieferant" ein Organisationstyp ist ODER eine
  eigene FiBu-Entität bleibt — Doppelung vermeiden (s. offene Punkte).

## Steht (gebaut & läuft)

- **Modul 008 GEBAUT (Migration 027, 375 Tests grün; SQL einzuspielen).** Kontaktmodell durch
  ERWEITERUNG des Bestehenden (kein Neubau): „Person" = `kontakte(kontakt_typ='person')`,
  „Organisation" = bestehende `organisationen` (Mig. 012). Ergänzt: `kontakt_typen` +
  `kontakt_typ_zuordnung` (n:m, polymorph), `person_organisation` (n:m additiv zur 1:n
  `kontakte.organisation_id`). **Custom Fields Variante C** durch Erweiterung der bisher
  ungenutzten 002-Tabellen (`custom_field_definitionen` += geschuetzt/CHECKs, `custom_field_option`
  NEU, `custom_field_werte` += typisierte Spalten + partielle B-Tree-Indizes, `custom_field_value_option`
  NEU). Service `lib/felder/` (key/mapping/definition/value/typen/filter-adapter), API + UI
  (`/einstellungen/felder` + `/einstellungen/kontakttypen`), System-Typen geseedet je Mandant.
- Noch offen (Stufe 2): 0006-Filterleisten-Route, Custom-Field-Werte/Typen/Ansprechpartner in
  Detailansichten, Organisationen-CRUD-UI (s. In Arbeit). Vorhandenes Fundament: `kontakte` (real, Struktur prüfen),
  Such-/Filter-Schicht 0006 (Registry + Query-Builder + filter-bar), RLS im `wimus`-Schema.

## In Arbeit (Stufe 2, geparkt — Service-API steht, UI/Verdrahtung fehlt)

- **0006-Filterleisten-Route je Entität:** `defsToFilterFields` + `customFieldIds` (id-Prefilter)
  gebaut+getestet, aber noch in keine Liste eingehängt (kontakte-Liste hat noch keine filter-bar).
- **Custom-Field-Werte + n:m-Typen + Ansprechpartner in Detailansichten:** `getWerte`/`setWert`/
  `setZuordnungen` stehen; Rendern/Editieren in kontakte/[id]- + organisationen-Detail fehlt.
- **Organisationen-CRUD-UI:** nur DB + Verknüpfung; eigene Verwaltungs-UI (Tab/Route) offen.
- **ist_*-Flags ↔ System-Typen Vereinheitlichung:** Doppelspur bewusst belassen (ist_* von
  lib/fibu + api/kontakte?rolle= genutzt) → eigener Migrationsauftrag (Backlog).

## Roadmap (bewusst später)

- Weitere Feldtypen (Geld/Währung, URL, Adresse, Entitäts-Verknüpfung).
- Feldgruppen/Reihenfolge-Feintuning, Pflichtfeld-Workflows.
- Custom Fields in der globalen Suche (0006) als durchsuchbarer Inhalt (nicht nur Filter).

## Offene Punkte → Claude Code verifiziert gegen reales Schema

> Spec entscheidungsfest bis auf die bewusst offene Speicher-Variante (C vs. B, an realer Last).
1. **Reale `kontakte`-Struktur:** Person/Firma getrennt oder ein Topf? Vorhandene Typ-/Rollen-
   Felder? Migrationspfad.
2. **Speicher-Variante C vs. B** an realer Filterlast entscheiden (s.o.), im Report begründen.
3. **`fibu_lieferanten`** ↔ Organisationstyp „Lieferant": Doppelung? Eine Wahrheit festlegen.
4. **Welche Typen System (geschützt)** initial — welche haben wirklich Code-Logik.
5. **0006-Andockung:** wie genau dynamische `filterFields` aus Custom-Field-Defs erzeugen.

## Decision-Log

- 2026-06-28: **Eigenes Modul `008_felder`** (querschnittlich), Kontaktmodell-Teil am Kern.
- 2026-06-28: **Person/Organisation getrennt** (Pipedrive-Muster), beide mit Typen + Custom Fields.
- 2026-06-28: **Generische Custom Fields per UI, je Feld filterbar** (volles Muster, nicht nur
  Typ-Listen); für alle Entitäten.
- 2026-06-28: **Feldtypen** Text/Zahl/Datum/Auswahl/Mehrfachauswahl/JaNein (Stufe 1).
- 2026-06-28: **Speicher Variante C GEWÄHLT** (typisierte EAV-Wert-Spalten) — Joins bei unserer
  Größe unkritisch, typisiert+indizierbar, und 0006-Andockung über id-Prefilter sauberer als
  JSONB-Casting im Query-Builder. B bleibt hinter Service-Schicht migrierbar.
- 2026-06-28: **Kontaktmodell durch Erweiterung** (Person=kontakte(person), Organisation=
  organisationen) statt neuer Tabellen — vorhandenes nicht umbauen.
- 2026-06-28: **lieferanten zweigleisig** — Kreditorenstamm (FiBu) ≠ Org-Typ lieferant (CRM),
  je eine Wahrheit pro Zweck; optionaler Link als Roadmap.
- 2026-06-28: **Stabiler key statt Label** (Pipedrive); System-geschützt vs. frei.
- 2026-06-28: **Filter über 0006**, kein zweites Filtersystem. CRM-Customizing-Vollausbau verworfen.

## Meilensteine

| Version | Datum | Status | Beschreibung |
|---------|-------|--------|--------------|
| 0.2.0 | 2026-06-28 | in_arbeit | GEBAUT (Migration 027, 375 Tests grün): Kontaktmodell durch Erweiterung (Person=kontakte, Organisation=organisationen), n:m-Typen + person_organisation, Custom Fields Variante C (id-Prefilter für 0006), Service+UI, System-Typen geseedet. lieferanten zweigleisig. Stufe 2 (Detail-UI/0006-Route) geparkt. |
| 0.1.0 | 2026-06-28 | entwurf | Vorab-Spec: Modul 008_felder — Person/Organisation getrennt + Typen, generische Custom-Field-Schicht (Feldtypen Text/Zahl/Datum/Auswahl/Mehrfach/JaNein), Speicher C/B offen an Last, Filter dockt an 0006, System-Schutz via stabilem key. Bau folgt. |

## Änderungshistorie

| Datum/Zeit (MESZ) | Vorgang | Dateien |
|-------------------|---------|---------|
| 2026-06-28 16:15 | v0.2.0: GEBAUT nachgezogen (Migration 027, Variante C+id-Prefilter, Kontaktmodell-Mapping, lieferanten zweigleisig, Stufe-2-Parkliste) | 000,200,300 |
| 2026-06-28 23:30 | v0.1.0: Modul 008_felder als Vorab-Spec angelegt (Konzept/Datenmodell/Prozesse) | 000,200,300 |

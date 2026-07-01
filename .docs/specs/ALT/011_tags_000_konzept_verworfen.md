---
id: 0011
titel: Tags — freie Quer-Kennzeichnung (Labels)
status: entwurf
version: 0.1.0
modul: tags
erstellt: 2026-06-29
geaendert: 2026-06-29
abhaengt_von: [0001]
---

# 0011 — Tags (freie Quer-Kennzeichnung)

> ⛔ VERWORFEN (2026-06-29): Tags sind KEIN eigenes Modul 011 — sie kamen IN DEN KERN (001_erp).
> Maßgeblich ist der Abschnitt „Tags (Kern-Querschnitt)" in `001_erp_200_datenmodell.md`.
> ACHTUNG: Diese Datei enthält veraltete Begriffe (u.a. `workspace_id` — es gibt KEIN workspace,
> Mandanten sind die Wurzel). NICHT als Quelle verwenden. Nur als Historie aufbewahrt.

## Worum geht's

> Ein generisches, typenloses Label-System, das QUER über ALLE Strukturgrenzen gruppiert. Ein Tag
> ist ein freier Text (wie ein Hashtag), der an JEDEN Baustein des ERP gehängt werden kann —
> Objekt, Einheit, Buchung, Vorgang, Kontakt, Projekt, Firma, Mietvertrag, egal was. Ein Tag kann
> beliebig viele Datensätze verbinden, ein Datensatz beliebig viele Tags tragen (n:m).

Zweck: lose Bündelungen abbilden, die die harten FK-Strukturen (mandant/firma/projekt/objekt)
NICHT können — z.B. „mehrere Projekte zusammenfassen", einen „Fall" (Wasserschaden #42) quer über
Buchungen + Vorgänge + Nachrichten, oder ein Portfolio-Label über Objekte verschiedener Firmen.

**Klare Abgrenzung (wichtig):**
- Tags sind KEINE Org-Dimension. `projekt_id`/`firma_id`/`mandant_id` bleiben harte FKs (Struktur,
  RLS, Integrität, KLR). Tags sind lose, frei, NIE sicherheitstragend, NIE kostenverteilend.
- Tags sind KEINE Kostenstelle und KEIN Kostenträger (verteilen/tragen keine Kosten systematisch).
- Tags ersetzen NICHT Custom Fields (008): Custom Fields = typisierte Werte je Definition; Tags =
  ein freies Label ohne Wert. Verwandtes polymorphes Muster, anderer Zweck.

## Steht (gebaut & läuft)

- – (Erstentwurf, noch nicht gebaut)

## In Arbeit

- –

## Ideen / als Nächstes

- Tag-Farbe optional (UI-Chips).
- Tag-Umbenennen propagiert automatisch (Label sitzt zentral in `tags`, nicht in der Zuordnung).
- Tag-Merge (zwei Tags zusammenführen) — später, falls Dubletten entstehen.
- Auto-Vorschläge / Häufigkeits-Sortierung beim Tippen — später.

## Entscheidungen (warum es so ist)

- 2026-06-29: **Kommt in den KERN** (Modul 011), nicht als P3-Add-on — Tags sollen von Anfang an
  überall verfügbar sein. Grund: Querschnitts-Feature, das überall andockt.
- 2026-06-29: **RLS-Wurzel = `mandant_id`** (NICHT workspace). Mandanten bleiben die Isolationswurzel
  des Systems; Tags folgen dem etablierten Muster aller Kerntabellen. Grund: Konsistenz, keine
  Sonderrolle, und #21 löst mandant NICHT ab (firma/projekt kommen zusätzlich).
- 2026-06-29: **Typenlos / frei** (kein Tag-Typ-System, keine Validierung, keine feste Werteliste).
  Grund: Max will ein freies Label wie ein Hashtag; Typen wären Over-Engineering (verworfen nach
  Abwägung). „Lean over complex."
- 2026-06-29: **An ALLE Bausteine** — `bezug_typ` ist ein FREIER String, keine Whitelist. Jede
  Tabelle ist taggbar, auch künftige, ohne Schemaänderung. Grund: maximale Flexibilität, Wesen
  eines freien Labels; Whitelist wäre künstliche Schranke.
- 2026-06-29: **Polymorphes n:m über `bezug_typ`/`bezug_id`** — GLEICHES Muster wie
  `aktivitaet_bezug`/`kom_nachricht_bezug` (007) und `custom_field_werte` (008). Grund: bewährtes
  Hausmuster, kein Fremdkörper, CC kennt es.
- 2026-06-29: **Label eindeutig je Mandant** (UNIQUE(mandant_id, label)) — kein Doppel-Tag. Grund:
  „Wasserschaden" soll EIN Tag sein, nicht fünf Tippvarianten. (Frei beim Anlegen, aber
  dedupliziert.)

## Offene Punkte

- OP-1: Label case-sensitive oder normalisiert? (Empfehlung: case-insensitive UNIQUE, damit
  „Wasserschaden" == „wasserschaden" == EIN Tag. Im Datenmodell via lower()-Index.)
- OP-2: Tag-Berechtigung — wer darf Tags anlegen/löschen/zuordnen? Vorerst: alle authentifizierten
  Nutzer des Mandanten (wie Custom Fields). Feinere Rechte später über Modul 010.
- OP-3: Verwaiste Zuordnungen — wenn ein getaggter Datensatz gelöscht wird, bleibt die Zuordnung
  zurück. Lösung: kein FK auf den polymorphen bezug (geht nicht), daher periodischer Cleanup ODER
  ON-DELETE-Trigger je getaggter Tabelle (zu viel). Vorerst: Cleanup-Job / tolerieren (Zuordnung
  ins Leere wird beim Lesen ignoriert). ‹im Bau entscheiden›.
- OP-4: Filter/Auswertung (Mehrfach-Tag-Filter, Tag-Summen im Finanzteil) — überschneidet sich mit
  #21-B5. Reihenfolge klären, nicht doppelt bauen.

## Meilensteine & Versionen

| Version | Datum | Status | Inhalt / zugehöriger Stand |
|---------|-------|--------|----------------------------|
| 0.1.0 | 2026-06-29 | entwurf | Erstentwurf: tags + tag_zuordnung (polymorph, mandant-RLS, typenlos, an alle Bausteine). Aus Backlog #22 in den Kern überführt. |

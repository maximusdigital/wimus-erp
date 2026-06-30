---
gehoert_zu: 0010
dokument: Prozesse
geaendert: 2026-06-29
---

# 0010 — Prozesse (Berechtigungen)

> Version & Status des Moduls stehen in `010_berechtigungen_000_konzept.md`.

## 1. Rollen-Seed — die 12 Rollen mit echten Rechten

> Mapping aus den Klartext-Beschreibungen der in Migration 002 geseedeten Rollen. Stufe je
> Bereich. Leer = nicht eingetragen = implizit `kein` (sicherer Default). Im Stufe-1-Bau als
> idempotenter Seed in `rolle_rechte` (ON CONFLICT (rolle_id,bereich) DO UPDATE).

| Rolle | fibu | vorgaenge | belegung | crm | stammdaten | kommunikation | historie | berecht. | audit |
|-------|------|-----------|----------|-----|------------|---------------|----------|----------|-------|
| superadmin | freigeben | freigeben | freigeben | freigeben | freigeben | freigeben | freigeben | freigeben | freigeben |
| mandant_admin | freigeben | freigeben | freigeben | freigeben | freigeben | freigeben | lesen | schreiben | lesen |
| verwalter | kein | freigeben | schreiben | schreiben | schreiben | schreiben | lesen | kein | kein |
| buchhalter | freigeben | kein | kein | kein | lesen | kein | lesen | kein | lesen |
| steuerberater | lesen | kein | kein | kein | lesen | kein | kein | kein | lesen |
| hausmeister | kein | schreiben | lesen | kein | kein | lesen | kein | kein | kein |
| reinigungskraft | kein | lesen | lesen | kein | kein | kein | kein | kein | kein |
| aussendienst | kein | lesen | lesen | schreiben | lesen | schreiben | kein | kein | kein |
| lesezugriff | lesen | lesen | lesen | lesen | lesen | lesen | lesen | kein | kein |
| eigentuemer_portal | lesen | lesen | kein | kein | kein | kein | kein | kein | kein |
| mieter_portal | kein | schreiben | kein | kein | kein | schreiben | kein | kein | kein |
| gast_portal | kein | kein | kein | kein | kein | kein | kein | kein | kein |

> Begründungen einiger Schnitte (aus den Original-Beschreibungen):
> - **verwalter**: „KEINE Finanzen/Bank" → fibu=kein. „Vorgänge/Kommunikation" → schreiben/freigeben.
> - **buchhalter**: „Finanzen/DATEV/Rechnungen, KEINE Mieter-Kommunikation" → fibu=freigeben,
>   kommunikation=kein. audit=lesen (Buchhaltung muss Belegfluss nachvollziehen).
> - **steuerberater**: „Lesezugriff Finanzen/Belege, KEINE Mieterdaten" → fibu=lesen, crm=kein,
>   kommunikation=kein. Portal-übergreifend (Scope global) per Zuweisung.
> - **hausmeister**: „nur Vorgänge eigener Objekte" → vorgaenge=schreiben, ABER per Scope
>   eingeschränkt (objekt-Scope, nicht alle Objekte). Die Stufe ist objektunabhängig; die
>   Einschränkung „eigene Objekte" macht der SCOPE bei der Zuweisung.
> - **reinigungskraft**: „Buchungen/Checklisten, KEINE Kontaktdaten" → belegung/vorgaenge=lesen,
>   crm=kein.
> - **gast_portal**: alles kein — Portalzugriff läuft NICHT über dieses interne RBAC, sondern
>   über token-/buchungsgebundene Sonderwege (eigenes Thema, nicht Teil von 010).

> **Portal-Rollen (extern):** eigentuemer/mieter/gast_portal sind hier nur grob abgebildet;
> externe Portalzugriffe sind ein eigener Mechanismus (token/buchungsgebunden) und werden in
> 010 NICHT scharfgeschaltet — die Zeilen dienen der Vollständigkeit. ‹Im Bau: externe Rollen
> aus der RLS-Durchsetzung von Stufe 2 ausnehmen, separat behandeln›.

## 2. Effektiv-Recht-Auflösung (Ablauf)

```
hat_recht(bereich, minstufe, mandant, objekt?):
  1. Zuweisungen von auth.uid() laden, die zeitlich gültig sind (gueltig_von/bis)
  2. je Zuweisung: deckt ihr Scope die Ressource?
     - global         → ja (alles)
     - mandant=X       → ja, wenn Ressource-Mandant = X
     - gesellschaft=G  → ja, wenn Objekt zu G gehört (objekt.gesellschaft_id=G)
                          bzw. für mandant-Ebene: Mandant von G
     - objekt=O        → ja, wenn Ressource-Objekt = O (oder Einheit in O)
  3. für passende Zuweisungen: rolle_rechte[rolle][bereich] → Stufe
  4. max(Stufe) über alle passenden ≥ minstufe ?  → erlaubt
```
- **Einheit → Objekt**: einheit-gebundene Ressourcen lösen ihren Objekt-Bezug auf (einheit.objekt_id),
  dann greift erlaubte_objekte.
- **Tabellen ohne objekt/mandant-Direktbezug** (Kindtabellen): über Elternkette wie in der
  bestehenden RLS (Migration 002 macht das bereits vor — Muster übernehmen).

## 3. Stufe-1-Bauumfang (erster Auftrag) — KEINE RLS-Umstellung

1. Migration `‹NNN›_berechtigungen_rechte_scope.sql` (idempotent):
   - `rolle_rechte` anlegen + Seed der 12 Rollen (Tabelle oben).
   - `benutzer_rollen` um `scope_typ`/`scope_id` erweitern; Bestand migrieren
     (scope_typ='mandant', scope_id=mandant_id); UNIQUE-Constraint umstellen.
   - Engine-Funktionen `stufe_rang`, `erlaubte_mandanten`, `erlaubte_objekte`, `hat_recht`
     (security definer).
   - **Kein-Lockout-Seed:** sicherstellen, dass der aktuelle Nutzer (Max) eine global/superadmin-
     Zuweisung hat. ‹Im Bau: benutzer_id real ermitteln, nicht raten — sonst als Frage parken›.
   - Migration läuft NIE Fast-Path; /pg/query-Guardrail (exakte SQL zeigen, Freigabe abwarten).
2. `lib/berechtigungen/`: TS-Wrapper `hatRecht(bereich, stufe, {mandantId, objektId})` (ruft
   die DB-Funktion über RLS-Client), `bereiche.ts` (Konstanten), `stufen.ts` (Rang-Helper).
3. UI `/einstellungen/berechtigungen`:
   - Rollen-Liste + Rechte-Matrix (Bereich×Stufe je Rolle, editierbar — superadmin/admin only).
   - Zuweisung User→Rolle mit Scope-Wahl (global/mandant/gesellschaft/objekt + Knoten-Auswahl)
     + optional Gültigkeit von/bis (= Vertretung).
   - **DSGVO-Matrix-Ansicht**: „wer darf was wo", exportierbar (CSV). Pflicht-Feature.
4. **NOCH NICHT**: RLS-Policies anfassen. App-Checks (UI ausgrauen via hatRecht) dürfen schon
   andocken, aber nichts hängt sicherheitskritisch daran, solange RLS die alte Isolation fährt.

## 4. Tests (Stufe 1) — Negativ-Tests sind PFLICHT

> Bei einem Rechtesystem sind die WICHTIGSTEN Tests die, die etwas VERBIETEN.

- **Engine-Funktionen** (DB/Integration):
  - buchhalter mit gesellschaft-Scope G1: `hat_recht('fibu','freigeben',mandant,obj_in_G1)` = true.
  - **NEGATIV:** derselbe buchhalter auf Objekt in G2 (anderer Scope) = false.
  - **NEGATIV:** verwalter auf `fibu` (Rolle hat fibu=kein) = false, egal welcher Scope.
  - global-Scope superadmin: überall true.
  - objekt-Scope hausmeister: nur sein Objekt true, Nachbarobjekt false.
  - Stufen-Ordnung: wer `schreiben` hat, besteht `lesen`-Check; wer `lesen` hat, scheitert an
    `schreiben`.
  - Vereinigung: User mit zwei Rollen → höhere Stufe gewinnt.
  - Gültigkeit: abgelaufene Zuweisung (gueltig_bis < now) zählt nicht.
- **TS-Wrapper** `hatRecht`: mappt korrekt auf die DB-Funktion (Mock/Integration).
- **UI**: Matrix rendert; Zuweisung mit Scope speichert; DSGVO-Export erzeugt korrekte Zeilen.
- Kein Commit ohne grün (test:run + build). Review-Subagent prüft besonders: Default-sicher
  (fehlender Eintrag = kein Zugriff), kein Lockout, Negativ-Tests vorhanden.

## 5. Stufe 2 (Folgeauftrag, je Modul) — Durchsetzung

Pro Modul ein eigener Auftrag: RLS-Policies der Modul-Tabellen von `mandant_isolation` auf
bereichs-/stufen-Policies umstellen (SELECT vs. write getrennt), API-Routen mit `hatRecht`
absichern (besonders die mit service_role — die umgehen RLS!). Reihenfolge-Vorschlag:
`audit` (einfach, löst Backlog #14) → `historie` → `belegung` → `crm` → `vorgaenge` → `fibu`
(heikelster zuletzt, wenn das Muster erprobt ist). Jedes Modul mit eigenen Negativ-Tests.

## 6. Stufe 3 (Folgeauftrag) — Gruppen

`gruppen` + `benutzer_gruppen` + `gruppen_rechte`; Engine-Funktionen um den Gruppen-Pfad
erweitern (Vereinigung User-Rollen ∪ Gruppen). Erst wenn Rolle×Scope produktiv erprobt ist.

## 7. Backlog-Verweise
- **Teilen/Weiterleiten (extern)** als separates orthogonales Recht — eigener späterer Punkt
  (NICHT in der Stufen-Leiter, DSGVO-Trennung).
- **KI-Akteur-Rechte**: KI-Akteure (Modul 005/006) brauchen eigene Rechte-Profile — später.
- **Backlog #14** „Rollen-Restriktion Audit-Ansicht" wird durch Stufe 2 (`audit` zuerst) gelöst.

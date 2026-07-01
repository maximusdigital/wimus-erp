# Report: Admin-Bereich STUFE 0 (Modul 010) — 2026-07-01 23:20 MESZ

Auftrag: `.docs/prompts/20260701_2250_prompt_admin-stufe0.md`. Voller Zyklus. Commit `4c4b085`.
Tests **420 grün** (+13), Build grün. Review-Subagent: **FREIGABE** (0 kritisch, 3 KLEIN s.u.).
**Migration 031 ist geschrieben + committet, aber NOCH NICHT angewandt** (Guardrail — exakte SQL
liegt zur Freigabe vor).

## 1) Gebaut (mit echten Tabellen/Feldern/Routen)

**Migration `supabase/migrations/031_admin_stufe0.sql`** (KEINE neuen Tabellen):
- `wimus.ist_admin() RETURNS boolean` — `stable security definer`, `search_path` fix, 1:1 nach
  `wimus.user_mandanten()` (002). True, wenn `auth.uid()` eine zeitlich gültige `benutzer_rollen`-Zeile
  mit Rolle `superadmin`|`mandant_admin` hat (join `wimus.rollen`). `grant execute … to authenticated`.
- **Bewusst KEINE neue RLS-Policy** auf `benutzer`: API-Gate (requireAdmin) + bestehende
  `mandant_isolation` genügen (Spec 2c „weniger ist besser").

**Gate-Wrapper `lib/berechtigungen/istAdmin.ts`** (EINZIGER Weg — Nahtlos-Regel für Stufe 1):
- `istAdmin()` — ruft `supabase.rpc("ist_admin")` im RLS-Auth-Kontext; **fail-closed** (RPC-Fehler → false);
  Preview-Bypass (`PREVIEW_NO_AUTH` → true, konsistent zum Dashboard-Guard).
- `requireAdmin()` (Seiten → `redirect("/")`), `requireAdminApi()` (API → 403 | null),
  `istSelbstDeaktivierung()` (reine Anti-Lockout-Prüfung, testbar).

**Setup-Schutz (S0-2):**
- `app/(dashboard)/einstellungen/layout.tsx` NEU — zentrales `await requireAdmin()`, deckt ALLE
  Unterseiten (projekte/firmen/workspace/bk-arten/felder/kontakttypen/audit/benutzer).
- **11 schreibende Routen** mit `requireAdminApi()` als erstem Statement abgesichert:
  `firmen` (POST, [id] PATCH/DELETE) · `projekte` (POST, [id] PATCH/DELETE) · `workspace` (PATCH) ·
  `bk-arten` (POST, [id] PATCH/DELETE) · `felder`-**Definitionen** (POST, [id] PATCH/DELETE) ·
  `kontakttypen` (POST, [id] PATCH/DELETE).
- `/api/felder/werte` (Custom-Field-**Werte** der Detailseiten, alle Nutzer) bewusst **NICHT** gegatet.
- Nav: „Verwaltung"-Gruppe in `crm-sidebar` nur bei `istAdmin` (Layout reicht Flag durch).

**Benutzer-Verwaltung NEU (S0-3):**
- Liste `einstellungen/benutzer/page.tsx` (Name/E-Mail/Rollen-Chips/MFA/Status) + Bearbeiten
  `benutzer/[id]/bearbeiten` + `components/einstellungen/benutzer-form.tsx`.
- Bearbeiten: vorname/nachname, E-Mail read-only, Rollen nur Ansicht (Vergabe = Stufe 1), Aktiv/Inaktiv.
- **Deaktivieren mit Confirm-Dialog** (entitätskonkret) + **Anti-Lockout serverseitig** (409 bei
  Selbst-Deaktivierung, `istSelbstDeaktivierung`); UI-Button zusätzlich disabled.
- API `api/benutzer/route.ts` (GET) + `api/benutzer/[id]/route.ts` (PUT) — je `requireAdminApi`,
  **RLS-Client** (mandant-scoped, KEIN Service-Role → kein Cross-Mandant-Leak).

**Landing (S0-4):** `einstellungen/page.tsx` in 3 Gruppen (Organisation · Stammdaten/Kataloge ·
Verwaltung/Sicherheit) + Benutzer-Karte (NEU) + Berechtigungen-Karte (`aktiv:false`, „bald").

**Echte Objekte:** `wimus.benutzer` (id/email/vorname/nachname/aktiv/mfa_aktiv), `wimus.benutzer_rollen`
(benutzer_id/rolle_id/gueltig_von/gueltig_bis), `wimus.rollen` (superadmin/mandant_admin/… 12 geseedet).

**Tests (+13):** `berechtigungen.test.ts` — istAdmin (true/false/fail-closed/Preview),
requireAdminApi (403|null), requireAdmin (redirect), istSelbstDeaktivierung (5 Fälle).

## 2) Abweichungen (inkl. Review-Findings)

- **`import "server-only"`** in istAdmin.ts wieder entfernt: Vitest kann das Next-Virtual nicht
  auflösen; kein anderes lib-File nutzt es. Modul ist durch `next/headers`/`redirect`/`NextResponse`
  ohnehin server-only.
- Review-Findings (KLEIN, kein Blocker):
  - **firmen/projekte/workspace nutzen weiter `createAdminClient`** (Service-Role, umgeht RLS) —
    vorbestehend, jetzt durch `requireAdminApi` grob gegatet. Fein-granularer Mandant-Scope
    (mandant_admin nur eigener Mandant) kommt **Stufe 1**.
  - **Anti-Lockout nur Selbst-Schutz** — ein Admin könnte theoretisch den letzten *anderen* Admin
    deaktivieren. Spec H2 fordert nur Selbst-Schutz → konform; als bekannte Grenze notiert.
  - **benutzer-form ohne react-hook-form/zod** — schlankes 2-Feld-Formular mit serverseitiger
    zod-Validierung (`benutzerUpdateSchema`); YAGNI-vertretbar.

## 3) Offen

- **Migration 031 NICHT angewandt** (Guardrail): SQL liegt zur Freigabe vor. **Wichtig:** bis 031 live
  ist, liefert `ist_admin()` nicht → `istAdmin()` fällt fail-closed auf false → in PROD wäre der
  Admin-Bereich für alle gesperrt (kein Datenrisiko, aber Zugriff). Dev nutzt den Preview-Bypass.
  → 031 sollte mit/vor dem nächsten Deploy angewandt werden.
- **Benutzer-Anlegen GEPARKT** (Rückfrage): Im Projekt existiert KEIN Auth-Admin-API-Muster
  (`auth.admin.createUser`) und kein `.rpc`-Präzedenz für den auth.users-Weg. Anlegen weggelassen
  (Liste/Bearbeiten/Deaktivieren genügen für Stufe 0). Weg klären → eigener kleiner Folgeauftrag.
- Rollen-VERGABE, Rechte-Matrix, Scope-Engine, mandant-feiner Schreib-Scope = **Stufe 1** (nach #21 Phase B).

## 4) Rückfragen

1. **Benutzer-Anlege-Weg:** Über Supabase Auth Admin API (service_role, serverseitig `auth.admin.createUser`
   → Trigger/Insert `wimus.benutzer`)? Oder Einladungs-Flow (inviteUserByEmail)? Bitte Weg vorgeben,
   dann baue ich die Anlegen-Seite als Folgeauftrag (mit Tests).
2. **Migration 031 anwenden?** Additiv (nur Funktion), Backup nicht zwingend nötig (kein Datenschreib).
   Freigabe → ich spiele ein + verifiziere (Funktion existiert, `ist_admin()` läuft fehlerfrei).
3. Reale abgesicherte Setup-Routen: s. Abschnitt 1 (11 Routen). `felder/werte` bewusst offen — ok so?

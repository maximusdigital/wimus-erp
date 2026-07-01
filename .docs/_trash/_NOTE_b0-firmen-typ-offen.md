# NOTE — Offener Stand B0 / firmen.typ (Stand 2026-06-29 ~18:30 MESZ)

> Kurznotiz zum Wiedereinstieg. B0 ruht bis Backup + typ-Zuordnung geklärt sind (mit klarem Kopf).

## Was offen ist, bevor B0 läuft

1. **DB-Backup** bestätigen (Pflicht vor jedem Phase-B-Schreibschritt).

2. **firmen.typ-Werteliste ändern** — NEU (Max 2026-06-29). ZWEI ORTHOGONALE DIMENSIONEN, nicht vermischen:

   **(a) Rechtsform = `typ`** (was die Firma rechtlich IST):
   - Liste: `privat`, `Einzelunternehmung`, `GbR`, `GmbH`
     (privat = Privatperson. Einzelunternehmung GROSS geschrieben — Substantiv.)
   - GbR + GmbH = „mit Anteilen" → Anteile laufen über bestehende `gesellschafter` + `beteiligungen`
     (Migration 010, FK firma_id, Quoten zeitabhängig). KEIN Neubau nötig, nur nutzen.

   **(b) Tätigkeitsvermerk = eigenes Feld/Flag** (NICHT in typ!):
   - `operativ` vs. `vermoegensverwaltend` — ist ein VERMERK, keine Rechtsform.
   - „vvGmbH" = `typ=GmbH` + `vermerk=vermoegensverwaltend` (NICHT ein eigener typ!).
   - Neues Feld nötig, z.B. `firmen.taetigkeit` (operativ/vermoegensverwaltend) — ‹im Bau anlegen›.

   **(c) Steuersatz konfigurierbar je Firma** (für FiBu-Berechnungen, Max 2026-06-29):
   - Je Firma muss ein Steuersatz hinterlegbar sein, abhängig von Rechtsform + Vermerk:
     - GmbH operativ → fester Satz (KSt + GewSt, grob ~30 %)
     - GmbH vermögensverwaltend (vvGmbH) → ggf. nur KSt ~15 % (erweiterte GewSt-Kürzung §9 Nr.1 S.2
       GewStG, WENN ausschließlich eigener Grundbesitz — Bedingung, vom StB bestätigen lassen)
     - Privatperson → GRENZSTEUERSATZ (progressiv, NICHT fest! hängt vom Gesamteinkommen ab) →
       muss hinterlegbar/schätzbar sein, evtl. als variabler Wert je Jahr.
   - → neues Feld/Struktur für Steuersatz je Firma ‹Design in wacher Session›. Evtl. zeitabhängig
     (Sätze ändern sich je Jahr) — dann eigene kleine Tabelle statt Spalte.
   - ⚠ Claude ist KEIN Steuerberater — die konkreten Sätze + ob die erw. Kürzung greift, gehören
     durch den StB bestätigt. ERP modelliert nur die KONFIGURIERBARKEIT, nicht die Steuerwahrheit.

   **ACHTUNG Schema:** Die bestehende CHECK-Constraint auf `firmen.typ` ist
   `privat/operativ/vvGmbH/GbR/holding/sonstige` — passt NICHT zur neuen Liste. B0 muss die
   CHECK-Constraint anpassen (DROP + neue CHECK auf privat/Einzelunternehmung/GbR/GmbH), das neue
   `taetigkeit`-Feld anlegen, und (separat, eigener Schritt) die Steuersatz-Struktur. Damit ist das
   doch ein Schema-Change (nicht nur Stammdaten) → NORMAL-Pfad, Migration NIE Fast-Path.
   ÜBERLEGUNG: Steuersatz-Struktur evtl. NICHT in B0, sondern eigener Schritt B0b/eigene Spec
   (FiBu-nah). B0 dann nur: typ-CHECK umstellen + taetigkeit-Feld + marke droppen.

3. **typ-Zuordnung je Firma** — NOCH OFFEN (Max müde, bewusst vertagt). Zu klären:
   - Maxim Moser (MMP) → ?  (privat? Einzelunternehmung?)
   - WIMUS GmbH (WIM) → GmbH?
   - WIMUS vvGmbH (VVG) → GmbH? (vvGmbH ist eine GmbH-Variante — als GmbH führen?)

## Warum von FiBu/Steuer her gedacht (Leitlinie für die Zuordnung)
Firma = steuerliches Subjekt. typ bestimmt die Besteuerungslogik (privat vs. GmbH = andere Welt).
Was die FiBu real braucht, ist meist schon da (firmen: steuernummer/ust_id/besteuerungsart/DATEV/
Kontenrahmen ✅; Anteile via gesellschafter+beteiligungen ✅). Offen ist nur die typ-Liste + Zuordnung.

## B0 danach (unverändert, schlank)
- projekte.marke droppen (0/7 befüllt → unkritisch).
- firmen.typ: erst CHECK-Liste umstellen, dann je Firma setzen (nach Max-Zuordnung).
- pfad NICHT in B0 (→ Backlog #23).
- Prompt liegt: `.docs/prompts/20260629_1810_prompt_org-phase-b0.md` (typ-CHECK-Anpassung dort noch
  ergänzen, sobald Zuordnung steht).

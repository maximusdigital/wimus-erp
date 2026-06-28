# Report — Such-/Filter-Schicht (Modul 006), 2026-06-28 11:30 MESZ

> Prompt `20260628_2045_prompt_suche-modul-aufbau.md`, Vorab-Spec `006_suche_*`. **Keine
> Spec-Edits** (Spec-Nachzug = Konzept-Claude). Sicherung: Tag `sicherung/vor-suche-modul-20260628-1130`.
> Build + **332 Unit-Tests grün**. **SQL offen: Migration 024.**

## 1. Gebaut (echte Tabellen/Felder/Indizes)

**Migration 024** `pg_trgm` + **GIN-Trigram-Indizes** (`gin_trgm_ops`, idempotent) auf den
gegen das reale Schema **verifizierten** Spalten: `kontakte`(nachname/vorname/firmenname/email),
`objekte`(kuerzel/strasse/stadt), `einheiten`(verwendungszweck_code/kuerzel/bezeichnung),
`mietvertraege`/`vorgaenge`/`buchungen`(aktenzeichen). Keine Daten-Duplikation.

**Such-Schicht `lib/search/`** (eine Engine, zwei Konsumenten):
- `types.ts`, `config.ts` (Schwellen/Limits zentral), `registry.ts` (verifizierte Entitäten),
  `query-builder.ts` (REIN: FilterInput→QueryOps + `applyOps`), `global-search.ts`
  (Fan-out + REIN `mergeAndRank`). **+6 Unit-Tests** (buildQueryOps je Feldtyp, escapeOr, Ranking).

**Globale Suche:** `/api/search` (Fan-out über Registry, **RLS über Server-Client**, Ranking
`score×globalWeight` + Präfix-Bonus) · **Command-Palette ⌘K/Strg-K** (`command-palette.tsx`,
debounced, gruppiert, Tastatur-Navigation, Sprung via `routePattern`) im Dashboard-Layout +
Header-Trigger (toter Such-Input ersetzt).

**Pro-Modul-Filter:** `filter-bar.tsx` (URL-param-getrieben, Konfiguration aus Registry-
`filterFields`) **in die Vorgänge-Liste** eingebunden; Liste filtert über dieselbe Engine
(`buildQueryOps`/`applyOps`) — Status/Typ/Priorität + Freitext, RLS-konform.

## 2. Abweichungen (Whitelist ↔ reales Schema)

- **„mieter" = `kontakte`** (keine eigene `mieter`/`personen`-Tabelle) → Entität key `kontakte`.
- **`forderungen` raus:** keine Trigram-taugliche Textspalte (nur Beträge/Status/FK). Dokumentiert.
- **Noch NICHT in der Registry** (diese Stufe): `rechnungen`/`lieferanten`/`nachrichten` —
  reale Tabellen/Spalten nicht final verifiziert (Kandidaten: `belege`/`fibu_lieferanten`/
  `portal_nachrichten`?). Bewusst weggelassen statt geraten (s. Rückfragen).
- **FTS (`such_vektor`) nicht gebaut:** die Kern-Entitäten haben kein großes Freitextfeld →
  Stufe 1 trigram-only; FTS = Roadmap (Notizen/Beschreibungen).
- **Kein echtes `similarity()`-Ranking:** Fan-out nutzt `ILIKE '%q%'` (durch `gin_trgm_ops`
  index-beschleunigt) + Score = Gewicht + Präfix-Bonus. Echtes Trigram-Ranking bräuchte eine
  RPC (`similarity()` ist über den Supabase-Client nicht direkt filterbar) — Refinement.

## 3. Offen

- **SQL-Stop:** `024_suche_trigram.sql` einspielen. Bis dahin laufen Suchen ohne Index (Seq-Scan)
  bzw. `pg_trgm`-Operatoren fehlen.
- **Filter-Leiste Rollout** auf FiBu/Bank (Registry-Einträge dafür ergänzen) — Vorgänge ist drin.
- **Restliche Whitelist-Entitäten** (rechnungen/lieferanten/nachrichten) verifizieren + aufnehmen.
- **RLS-Automattest** (Nutzer A findet keine Daten von Mandant B) NICHT als Test ergänzt — die
  Suche läuft über den RLS-Server-Client (korrekt), aber ein Cross-Mandant-Test bräuchte 2
  Test-User; als Lücke vermerkt.
- FTS + `similarity()`-RPC + Materialized View (nur falls Fan-out real zu langsam) = Roadmap.

## 4. Rückfragen

1. **Whitelist-Ergänzung:** Sind `rechnungen`=`belege`, `lieferanten`=`fibu_lieferanten`,
   `nachrichten`=`portal_nachrichten` die realen Tabellen (+ durchsuchbare Felder)? Dann nehme ich
   sie in die Registry.
2. **Filter-Leiste als Nächstes:** FiBu/Bank zuerst (große Tabellen) — bestätigt? (Vorgänge ✓.)
3. **`similarity()`-RPC** für echtes Trigram-Ranking jetzt bauen oder später (ILIKE reicht für Stufe 1)?
4. **`/buchungen/{id}`** als Treffer-Route korrekt (existiert die Detailseite)? Sonst route ich auf die Liste.
5. **Spec-Nachzug 006** (Konzept-Claude): von „Vorab/entwurf" auf gebauten Stand (Migration 024,
   verifizierte Entitäten, ILIKE-Stufe-1, FTS/similarity als Roadmap).

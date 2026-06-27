---
gehoert_zu: 0004
dokument: Migration
geaendert: 2026-06-26
---

# 0004 — Migration

> Version & Status des Moduls stehen in `004_ops_000_konzept.md`.
> SQL als Download/`.txt`, idempotent. Setzt Kern (0001) voraus, inkl. `organisationen`.

## Reihenfolge (Grobplan)

1. **Vorgang-Erweiterung:** `vorgaenge` um Betriebsfelder erweitern (typ/unter_typ/prioritaet/
   status/kostentraeger/aktenzeichen/zuweisungen); `vorgang_verlauf`, `vorgang_anhaenge`.
2. **Reinigung:** `reinigungsauftraege`, `reinigungsplaene`, `inventar_positionen`.
3. **Übergaben:** `uebergabeprotokolle`, `uebergabe_zaehler`, `uebergabe_schluessel`,
   `uebergabe_positionen`.
4. **Wartung/Facility:** `wartungsobjekte` (FK Kern-Fristen), `muellabfuhr_termine`.
5. **Einsatzplanung:** `einsaetze`.
6. **Dienstleister-Zusatz:** `dienstleister_bewertungen`, `dienstleister_preislisten`
   (FK `organisationen` typ=dienstleister).
7. **Seed:** Vorgangstypen/Status, Wartungsintervalle (Heizung 1J … Gas 12J),
   Standard-Reinigungstypen.

## Idempotenz

CREATE IF NOT EXISTS; ENUMs via DO-Block. UNIQUE: ein offener Reinigungsauftrag je
Buchung+Einheit. Seeds ON CONFLICT DO NOTHING.

## Abhängigkeiten

- Kern `organisationen` (typ=dienstleister) muss vorhanden sein.
- Kern `vorgaenge`, `fristen`, `forderungen`, `kautionen`, Akteure vorausgesetzt.

## Offen

- OP-4 Foto-Ablage (Paperless vs. Nextcloud) vor Anhang-Migration klären.
- OP-5 Müllabfuhr-Kalenderquelle je Standort.

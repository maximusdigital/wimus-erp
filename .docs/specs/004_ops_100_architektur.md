---
gehoert_zu: 0004
dokument: Architektur
geaendert: 2026-06-27
---

# 0004 — Architektur

> Version & Status stehen in `004_ops_000_konzept.md`. Baut auf Kern 0001.

## Leitprinzip: eine Engine, Typen erben

Es gibt **keine** parallelen Subsysteme für Reinigung/Übergabe/Wartung. Es gibt die
**Vorgangs-Engine** (`vorgaenge` + Begleittabellen `vorgang_verlauf`/`_zuweisung`/`_foto`) und
fünf **Typ-Erweiterungen** (`vorgang_reinigung/_uebergabe/_wartung/_reparatur/_schaden`), die
1:1 am Vorgang hängen. Jede Engine-Fähigkeit ist genau einmal implementiert und wird von jedem
Typ genutzt. Sichten („Reinigung heute", „meine Aufträge", Plantafel) sind Filter/Views, kein
eigenes Datenmodell.

## Schichten

| Schicht | Inhalt | Quelle/Tabellen |
|---------|--------|-----------------|
| Engine-Kern | Vorgang anlegen/bearbeiten, Status-Flow, Aktenzeichen, Kostenträger | `vorgaenge` |
| Verlauf | Audit-Timeline jeder Änderung/Statuswechsel | `vorgang_verlauf` |
| Zuweisung | intern (Akteur) + extern (Organisation/Handwerker), Auftrag-Versand | `vorgang_zuweisung`, `akteure` |
| Foto | Vorher/Nachher + Pflichtfotos (Referenzen) | `vorgang_foto` |
| Checklisten | Vorlagen/Positionen + Ausführung je Vorgang | `checklisten_*` (Kern 002) |
| Typ-Zusatz | je Typ ein 1:1-Datensatz + UI-Sicht | `vorgang_<typ>` |

## Systemgrenzen / externe Anbindung (Hook/Stub)

- **Benachrichtigung bei Statuswechsel** → Channel-System (E-Mail/WhatsApp/Telegram/Zammad):
  Engine schreibt `vorgang_verlauf` (art=benachrichtigung) + Feld `benachrichtigung_kanal`;
  echte Zustellung via n8n/Channel später.
- **Externer Auftrag-Versand** → `vorgang_zuweisung.auftrag_versendet_am`/`auftrag_kanal`
  (Stub); Versand via n8n später.
- **Foto-Capture/Storage** → Paperless/Nextcloud: Felder `paperless_id`/`url`, Upload später.
- **KI-Prüfung Checkliste** (`ki_schwellenwert`/`max_versuche`) + KI-Schadenskategorisierung
  (Claude Vision) → Hook; KI-Call später.
- **KZV-Turnaround** → Beds24-Webhook → n8n erzeugt Reinigungs-Vorgang (`vorgang_reinigung`
  mit `buchung_id`); der Webhook-Skeleton existiert im Kern.

## Träger-Modell (akteure)

Jeder Vorgang hat einen `owner_akteur_id` (verantwortlich) und 0..n `vorgang_zuweisung`
(ausführend, intern Akteur / extern Organisation/Handwerker). Akteur = Mensch **oder** KI —
KI-Agenten (z.B. Posteingang/Schaden) sind ebenfalls Akteure und können Vorgänge tragen.

## Querbezug Kern (0001)

- **Fristen → Vorgang:** fällige Wartungsfrist (`fristen.frist_typ wartung_*`) erzeugt einen
  Vorgang `typ=wartung` (+ `vorgang_wartung.frist_id`).
- **Vorgang → Forderung:** Schaden mit Mieter-/Versicherungs-Kostenträger erzeugt/verknüpft
  eine Forderung (`forderungen.vorgang_id`); Abgleich mit Kaution.
- **Übergabe → Kaution:** Auszug-Vorgang vergleicht mit Einzug (`abgleich_vorgang_id`) →
  Schäden → Kautionsabrechnung (Kern).
- **Akteure/Organisationen/DMS/Channel** kommen aus dem Kern.

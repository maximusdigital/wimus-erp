---
id: 0021
titel: Org-Migration mandant→firma/projekt — Phase B (firma_id/projekt_id, gesellschaft→firma)
status: entwurf            # entwurf | in_arbeit | freigegeben | umgesetzt | abgelöst
version: 0.4.0
modul: org-migration
erstellt: 2026-06-29
geaendert: 2026-06-29
abhaengt_von: [0001]
backlog_ref: 21
---

# 0021 — Org-Migration Phase B (firma_id/projekt_id, gesellschaft→firma)

> **NICHT bauen ohne Gegenlesen.** Anspruchsvollste Datenmigration des Projekts. Live, echte Daten.
> Teil der #21-Gesamtstrategie: A (Tracking, ✅ erledigt) → **B (diese Spec)** → C (RLS umstellen) →
> D (mandant + gesellschaft + marke droppen). Phase B ist ADDITIV und umkehrbar.

## Org-Modell (bereinigt, Entscheidungen Max 2026-06-29)

Hierarchie, von oben:

```
workspace                (WIMUS Gruppe; 1 Stück)
  └─ firma                = juristische Person (GmbH/GbR/…) ODER Privatperson.
     │                      DIE Auflösungs-/FiBu-Wurzel. Sitzt am OBJEKT (Besitz).
     └─ projekt            = operative Einheit (Abteilung). Sitzt an der EINHEIT (Nutzung).
        │                    Eigene Bankkonten, CI, FiBu-Teilbereiche, Unter-Projekte.
        └─ (unter-projekt)  z.B. ALFA APARTMENTS → Touristen / Monteure
```

> **Zwei Verankerungs-Ebenen (wichtig):** `objekte.firma_id` (Besitz, ein Gebäude = eine Firma) und
> `einheiten.projekt_id` (Nutzung, je Wohnung verschieden — ein MFH kann KZV+WG+HV mischen).
> firma vererbt nach unten (Einheit erbt über objekt_id); projekt sitzt direkt auf der Einheit.

Vier Festlegungen, die diese Spec prägen:

1. **`gesellschaft_id` → `firma_id` DURCHGEHEND ersetzen.** `gesellschaften` wird vollständig durch
   `firmen` abgelöst — nicht nur ergänzt. Überall, wo heute `gesellschaft_id` steht, steht künftig
   `firma_id`. (Spalten-Drop selbst erst Phase D, aber Phase B ist auf vollständige Ablösung
   ausgelegt, nicht auf Koexistenz.)

2. **„Marke" KOMPLETT raus** — Begriff, Konzept UND die Spalte `projekte.marke`. Es gibt keine
   eigene Marken-Dimension; was „Marke" hieß, IST ein Projekt. `projekte.marke` wird in Phase B
   entfernt (bzw. ihr Inhalt, falls genutzt, geht in name/kuerzel auf — im Bau prüfen, ob die
   Spalte real befüllt ist).

3. **Projekte können eigene Strukturen tragen:** eigene Bankkonten, eigene FiBu-Teilbereiche,
   Unter-Projekte (parent_projekt_id/ebene/pfad existieren bereits). Ein Projekt ist also nicht nur
   ein Label, sondern kann buchhaltungsrelevante Substruktur UNTERHALB seiner Firma haben.
   > Die FiBu-HOHEIT bleibt bei der Firma (juristische Person); ein Projekt-FiBu-Teilbereich ist
   > eine Untergliederung INNERHALB der Firmen-Buchhaltung, keine eigene juristische Einheit.

4. **Auflösung auf höchster Ebene über `firma` = juristische Person bzw. Privatperson.** Die
   oberste Trenn-/Auflösungsgrenze ist die Firma (rechtliche Einheit). Projekt ist die operative
   Untergliederung darunter.

> **Folge fürs RLS-Modell (Phase C):** Die SICHERHEITS-/Auflösungswurzel ist `firma_id`. `projekt_id`
> ist die feinere operative Grenze darunter. Ein Recht kann auf Firma-Ebene (alles der jur. Person)
> ODER Projekt-Ebene (eine operative Einheit) greifen — passt exakt zum 010-Scope
> (global > firma > projekt). Die alte „mandant"-Ebene entfällt ersatzlos.

## Attribut-Modell — was gehört zur Firma, was zum Projekt

> Leitsatz (Max 2026-06-29): **Projekt = Abteilung** (eigene Bankkonten, eigene Corporate Identity,
> eigener FiBu-Teilbereich), das **über die Firma (steuerliches Subjekt) kumuliert**. Trennlinie:
> **steuerlich/rechtlich bindend → Firma; operativ/darstellend/gliedernd → Projekt.**
> Jede Zeile unten ist gegen das REALE Schema (Migration 004 + 010) geprüft: ✅=existiert schon,
> ➕=fehlt, neu in Phase B/B4. NICHTS doppeln — was an firma existiert, NICHT auch an projekt.

### Firma = steuerliches Subjekt (Kumulations-/Rechtswurzel)
Trägt ALLES, was die juristische/steuerliche Wahrheit ausmacht. Das meiste existiert real:
| Eigenschaft | Feld (firmen) | Status |
|-------------|---------------|--------|
| Identität jur. Person | name, kuerzel, rechtsform, rechtsform_typ, typ | ✅ |
| Holding-Struktur | mutter_firma_id (Selbst-FK) | ✅ |
| Geschäftsführung | geschaeftsfuehrer, prokuristen | ✅ |
| Handelsregister | handelsregister_nr/_gericht, gruendungsdatum, stammkapital | ✅ |
| **Steuer** | steuernummer, ust_id, steueramt, umsatzsteuer_typ, umsatzsteuer_period | ✅ |
| **Bilanzierung** | besteuerungsart (bilanz/euer/ueberschuss), wirtschaftsjahr_start | ✅ |
| **DATEV** | datev_berater_nr, datev_mandant_nr | ✅ |
| **Kontenrahmen** | kontenrahmen_ref (SKR03/04/EÜR-Basis) | ✅ |
| Stamm-Bankverbindung | bank_name, iban, bic, kontoinhaber | ✅ |
| Sitz | strasse…land | ✅ |
| Kontakt | telefon, telefon_2, fax, email, website | ✅ |
| Beteiligungen/Gesellschafter | via gesellschafter + beteiligungen (FK firma_id) | ✅ (Mig. 010) |
| (CI auf Firmenebene) | logo_url, ci_farbe_* | ✅ vorhanden, aber s.u. — CI gehört primär zum Projekt |

> **Firma braucht NICHTS Neues für das Org-Modell.** Sie ist bereits das vollständige steuerliche
> Subjekt. Einzige Bereinigung: ihre CI-Felder sind zweitrangig (Projekt-CI dominiert in der
> Außendarstellung) — bleiben als Fallback/Konzern-CI, kein Handlungsbedarf.

### Projekt = operative Einheit / „Abteilung" (kumuliert über Firma)
Drei Gruppen von Attributen — Zugehörigkeit, Darstellung, Teil-FiBu:

**(a) Zugehörigkeit & Struktur — existiert real ✅**
| Eigenschaft | Feld (projekte) | Status |
|-------------|-----------------|--------|
| → seine Firma (Kumulationsziel) | firma_id | ✅ (FK existiert!) |
| → Workspace | workspace_id | ✅ |
| Baum (Abteilung/Unterabteilung) | parent_projekt_id, ebene, pfad | ✅ |
| Identität | name, kuerzel, typ, status | ✅ |
| Laufzeit/Budget | start_datum, end_datum, budget | ✅ |
| Verantwortlicher | projektmanager_id (→ akteure) | ✅ |

**(b) Corporate Identity (eigene Außendarstellung) — existiert real ✅**
| Eigenschaft | Feld (projekte) | Status |
|-------------|-----------------|--------|
| Logo/Farben | logo_url, logo_dunkel_url, ci_farbe_primary/secondary, ci_config | ✅ |
| Domains/Web | domain, website, gaestemappe_domain, impressum_url, datenschutz_url | ✅ |
| Kontaktkanäle | email, telefon, whatsapp | ✅ |
| Social | instagram_url, google_profil_url | ✅ |
| operative Integrationen | beds24_*, pricelabs_id, airbnb/booking, retell, ttlock, tuya | ✅ |
| Steuer-/Melde-Spezifika operativ | citytax_*, meldeschein_* | ✅ |
| ~~marke~~ | — | ❌ ENTFERNEN (Punkt 2) |

**(c) Eigene Bankkonten + FiBu-Teilbereich — FEHLT, neu (➕, Schritt B4)**
> Das ist die EINZIGE substanzielle Lücke aus deinem Leitsatz. Projekte haben heute KEINE
> Bankkonto-/FiBu-Teilbereichs-Felder. Bewusst NICHT an `projekte` als Spalten (ein Projekt hat
> potenziell MEHRERE Konten + die FiBu-Zuordnung ist eine n:m-Beziehung) → eigene Strukturen:
>
> - ➕ **`projekt_bankkonten`** (n Konten je Projekt): id, projekt_id, firma_id (Kumulationsziel,
>   redundant-denormalisiert für schnelle Aggregation), bank_name, iban, bic, kontoinhaber,
>   verwendungszweck/bezeichnung, aktiv. → erlaubt „eigenes Konto je Abteilung", Saldo kumuliert
>   über firma_id.
> - ➕ **FiBu-Teilbereich = PROJEKTZUORDNUNG der Buchung (Aufwand UND Ertrag):** Ein Projekt
>   erzeugt BEIDES — Ausgaben (Mietaufwand, Instandhaltung) und Einnahmen (Mieten, KZV-Umsatz).
>   `projekt_id` an der Buchung trägt daher die VOLLE Projekt-Erfolgsrechnung (Erträge − Aufwände =
>   Projektergebnis), NICHT nur Kosten. Die KOSTENSTELLE ist nur die *Aufwands-Sicht* dieser
>   Projektzuordnung (= Buchungen auf Aufwandskonten eines Projekts) — sie ergibt sich aus
>   projekt_id + Kontoart, ist KEINE eigene Spalte.
>   Begriffe (vgl. KLR): Kostenart = Konto/SKR (`fibu_konten` ✅); die Kostenstelle hängt immer mit
>   einem Projekt zusammen, ist aber nur die Ausgaben-Teilmenge.
>   Umsetzung: additives `projekt_id` (nullable) an den buchungsführenden FiBu-Tabellen → jede
>   Buchung gehört zur Firma (steuerlich, Pflicht) UND optional zu einem Projekt.
>   Aggregation: GROUP BY firma_id (steuerlich) · firma_id+projekt_id (Projekt-Erfolg gesamt) ·
>   firma_id+projekt_id WHERE konto=Aufwand (Kostenstellen-/Gemeinkosten-Sicht).
>
> Diese (c)-Strukturen sind Schritt **B4** (eigener Zyklus nach B0–B3). Begründung der Wahl
> (FK-Tag statt eigener Buchungskreis): steuerlich ist + bleibt die Firma das Subjekt; das Projekt
> ist eine Auswertungs-/Gliederungsdimension → ein Fremdschlüssel ist das richtige, schlanke Mittel
> (kein paralleler Kontenrahmen je Projekt). „Lean over complex."
>
> **Begriffs-Abgrenzung (wichtig, sonst Modell-Verwirrung):**
> - **projekt_id = Projektzuordnung** der Buchung (Aufwand UND Ertrag, volle Erfolgsrechnung).
>   Harte FK, je Buchung GENAU EINE. → dieses Modell.
> - **Kostenstelle** = nur die AUSGABEN-Sicht eines Projekts (projekt_id + Aufwandskonto). Hängt
>   IMMER an einem Projekt, ist aber KEINE eigene Spalte — eine Query-Perspektive. (Korrektur Max
>   17:20: projekt_id ist NICHT „die Kostenstelle", weil KS nur Ausgaben betrifft; Projekt umfasst
>   auch Erträge.)
> - **Kostenträger** (Produkt/Leistung, „wofür", z.B. einzelnes Apartment/WG-Zimmer): SPÄTERE,
>   feinere Dimension, käme über objekt/einheit ODER eigene FK — NICHT projekt, NICHT jetzt.
> - **Tag (#22) = freies Label** („querüber"): verteilt/trägt KEINE Kosten, n:m, nur Gruppierung.
>   Hat mit KLR NICHTS zu tun — bewusst getrennt.

> **Konsistenz-Regel (wichtig):** `projekt.firma_id` ist die Kumulationszuordnung. Ein
> projekt_bankkonto und eine projekt-getaggte Buchung MÜSSEN zur selben Firma gehören wie das
> Projekt (projekt.firma_id). In B3/B4 als CHECK/Verifikation absichern.

## Backfill-Logik (Bestandsdaten)

**„Nach FiBu entspricht ein Mandant einer Firma" (Klarstellung Max).** Der alte `mandant` spielte
historisch zwei Rollen, die jetzt getrennt werden:
- mandant → **firma_id** (die juristische Person / Privatperson, FiBu-Wurzel)
- mandant → **projekt_id** (die operative Einheit)

Für die Bestandsdaten leiten sich also BEIDE aus `mandant` ab — über zwei kleine Map-Tabellen.
ACHTUNG offener Punkt: Mehrere Mandanten können auf DIESELBE Firma fallen (z.B. AA + ALFA CAMPUS
sind beide „Maxim Moser / Private Vermietung", eine FiBu → eine Firma, aber zwei Projekte). Daher:
- mandant → firma: n:1 möglich (mehrere Mandanten, eine Firma)
- mandant → projekt: 1:1 (jeder Mandant = ein Top-Projekt)
→ real auszählen, wie viele DISTINCT Firmen die Mandanten ergeben (Offener Punkt #5).

## Reale Ausgangslage (aus Schema 002 + DDL-Extraktion verifiziert)

- **objekte**: `mandant_id` (NOT NULL) + `gesellschaft_id` (nullable). Beide werden abgelöst.
- **einheiten**: keine mandant_id → erbt über objekt_id (erbt firma_id/projekt_id automatisch).
- **gesellschaften** (an mandant_id): id, mandant_id, name, kuerzel, typ(privat/operativ/vvGmbH/
  GbR), versteuerungsart, ust_id, steuernummer. **gesellschaft_id verdrahtet in:**
  objekte, finanzierungen, veraeusserungen, reinvestitionsruecklagen, intercompany
  (leistende_/empfangende_gesellschaft_id). → ALLE auf firma_id umstellen.
- **firmen** (neu, an workspace_id, 49 Spalten): rechtsform_typ, besteuerungsart, datev_*, bank_*
  (bank_name/iban/bic/kontoinhaber), mutter_firma_id (Holding), CHECK typ:
  privat/operativ/vvGmbH/GbR/holding/sonstige. → reicher als gesellschaften, nimmt alles auf.
- **projekte** (neu, an workspace_id): **firma_id existiert bereits** (FK), parent_projekt_id/
  ebene/pfad (Baum), bank-relevante Felder NUR beds24/zahlungs-IDs — **KEINE eigenen Bankkonto-
  Felder** für FiBu-Teilbereiche. **`marke` (varchar) existiert** → in Phase B entfernen.
  → eigene Bankkonten/FiBu-Teilbereiche für Projekte = NEU zu bauen (s. B4, offener Scope).
- RLS heute: 4-Schichten-Maschine über `user_mandanten()`. Phase B fasst RLS NICHT an (→ Phase C).

## Teilschritt B0 — CHECK-Swap firmen.typ (marke-Drop → Phase D verschoben)

> Vorlauf-bestätigt (1745): 7 projekte, marke 0/7 befüllt. **ABER: Apply-Versuch 2045 deckte eine
> untracked Abhängigkeit auf** — die untracked Live-View `wimus.v_projekt_effektiv` (rekursive
> CI-Vererbung) referenziert `projekte.marke` dreifach, und `projekt-form.tsx` hat ein marke-Feld.
> Ein `DROP COLUMN marke` ist damit KEIN reiner Stammdaten-Schritt mehr → **verschoben nach Phase D**
> (dort sowieso die Marke-Restliste SC-1). Datenlage (0/7) war korrekt, aber Objekt-Abhängigkeiten
> zählen auch.

**B0 reduziert auf den abhängigkeitsfreien Teil:**
- **firmen.typ-CHECK-Liste umstellen** auf `privat/Einzelunternehmung/GbR/GmbH` (ersetzt alte Liste
  privat/operativ/vvGmbH/GbR/holding/sonstige). Alle typ aktuell NULL → sicher, keine Abhängigkeit.
  Idempotent (drop constraint if exists + add).
- **firmen.typ-WERTE je Firma:** NICHT per Migration — werden über die **UI** gepflegt (Max
  2026-06-29). Migration legt nur die CHECK-Struktur.

**Nach Phase D verschoben (eigener, getesteter Schritt):**
- `projekte.marke` droppen — erfordert: (a) `v_projekt_effektiv` DROP + ohne marke neu anlegen UND
  erstmals tracken (bisher untracked!), (b) marke-Feld aus `projekt-form.tsx` entfernen (App-Change
  mit Tests). Gehört zur Marke-Gesamtablösung (SC-1: crm_pipelines/kom_*/objekt_tags).
- `pfad` füllen → Backlog #23. ALFA DEVELOPMENT → war Sample, nicht bauen.

## Teilschritt B1 — gesellschaften → firmen (Ablösung)

### B1a Map-Tabelle (Audit-Trail)
`org_migration_map(mandant_id, firma_id, projekt_id, gesellschaft_id)` — dokumentiert ALLE
Zuordnungen an einer Stelle. Dauerhaft als Audit (kann nach Phase D weg). ‹Tendenz: dauerhaft›.

### B1b Daten-Migration (jede gesellschaft → eine firma)
| gesellschaften | → firmen | Hinweis |
|----------------|----------|---------|
| name | name | direkt |
| kuerzel | kuerzel | direkt |
| typ | typ | firmen-CHECK deckt privat/operativ/vvGmbH/GbR + holding/sonstige ✓ |
| versteuerungsart | besteuerungsart / umsatzsteuer_typ | ‹Werte real auszählen, Offener Punkt #1› |
| ust_id | ust_id | direkt |
| steuernummer | steuernummer | direkt |
| — | workspace_id | NOT NULL = das 1 WIMUS-Workspace (Seed 006) ‹real ermitteln› |

> Falls mandant→firma n:1 (mehrere Mandanten = eine Firma): NICHT pro Mandant eine Dublette-Firma
> anlegen. Erst DISTINCT Firmen bestimmen, dann mappen. (Offener Punkt #5.)

### B1c FK-Umstellen: gesellschaft_id → firma_id (durchgehend)
Jede Tabelle mit `gesellschaft_id` bekommt `firma_id` + Backfill, Ziel = vollständige Ablösung:
- `objekte`: + `firma_id` ← aus **mandant** (mandant=firma) über die Map. (gesellschaft_id von
  objekte wird damit redundant → Drop Phase D.)
- `finanzierungen`, `veraeusserungen`, `reinvestitionsruecklagen`: + `firma_id` ← aus
  gesellschaft_id über gesellschaft→firma-Map.
- `intercompany`: + `leistende_firma_id` + `empfangende_firma_id` ← aus den zwei gesellschaft-FKs.
- Alte `gesellschaft_id`-Spalten bleiben bis Phase D (additiv/umkehrbar), sind aber ab B totes
  Gleis (keine neuen Schreibzugriffe darauf — App-Umstellung in Phase C).

> Konsistenz-Pflicht: Die Firma aus mandant (für objekte) und die Firma aus gesellschaft (für die
> finanz-Tabellen) müssen für dieselbe reale jur. Person IDENTISCH sein. Bei Divergenz: STOPP +
> Frage. (Offener Punkt #2.)

## Teilschritt B2 — firma_id an objekte + projekt_id an einheiten (ZWEI EBENEN)

> Reale Datenlage (Vorlauf 2026-06-29 1745): nur **10 objekte** betroffen. gesellschaften + alle
> gesellschaft_id-Tabellen LEER → B1 ist faktisch No-Op (s.o.), der einzige echte Backfill ist hier.

**ZENTRALE STRUKTUR (Korrektur Max 2026-06-29 18:00): Die zwei Achsen leben auf VERSCHIEDENEN
Ebenen**, weil ein Objekt (Gebäude) Einheiten haben kann, die VERSCHIEDENEN Projekten zugeordnet sind
(MFH mit KZV-Wohnungen [AAP] + WG-Zimmern [ACA] + normaler Vermietung [WHV]):

| Achse | Ebene | Pflicht | Begründung (real verifiziert in Schema 002) |
|-------|-------|---------|---------------------------------------------|
| **firma_id** | **objekte** | NOT NULL | Besitz + FiBu-Heimat am Gebäude; alle Einheiten gehören derselben Firma. Einheiten erben firma über objekt_id. |
| **projekt_id** | **einheiten** | NOT NULL | operative Nutzung je Wohnung verschieden. `mietvertraege.einheit_id` + `buchungen.einheit_id` hängen real an der Einheit → Ertrag/FiBu löst projekt aus der Einheit auf. |

> **Warum das die FiBu korrekt macht:** Eine KZV-Buchung kennt ihre einheit_id → daraus projekt_id
> (z.B. AAP) → Ertrag landet im richtigen Projekt-Ergebnis, AUCH wenn die Nachbarwohnung im selben
> Haus zu ACA gehört. Gebäude-Ebene würde gemischt genutzte Häuser falsch zuordnen.
> **objekte bekommt KEIN projekt_id** (das wäre die alte, falsche Annahme). Nur firma_id.

**Kopplung: beide NOT NULL.** Objekte werden immer für eine Intention angeschafft, aber die
Intention ist auf EINHEITS-Ebene fein aufgelöst (ein MFH wird gekauft mit Plan: 3 WHG KZV, 2 WG).
Vorteil: RLS (Phase C) ohne NULL-Sonderfall; Konsistenz projekt.firma_id == objekt.firma_id (über
einheit.objekt_id) prüfbar.

**Sichere Reihenfolge (NOT NULL NIE direkt):** (1) Spalten nullable + FK → (2) backfillen →
(3) verifizieren (0 NULLs) → (4) DANN `SET NOT NULL`. Migration bricht nicht ab, sondern stoppt
sauber bei der Verifikation, falls eine Zeile keine Zuordnung bekommt.

**Backfill objekte.firma_id (real, Vorlauf-bestätigt) — mandant → firma:**
| Mandant | #objekte | → firma_id |
|---------|----------|------------|
| APART   | 3 | VVG (WIMUS vvGmbH) |
| CAMPUS  | 1 | VVG (WIMUS vvGmbH) |
| WIMUS   | 6 | WIM (WIMUS GmbH) |
> DISTINCT Firmen = 2 (VVG, WIM). UUIDs im Bau aus DB ziehen, NICHT hardcoden.

**Backfill einheiten.projekt_id — KNIFFLIG, NICHT trivial aus mandant ableitbar:**
Die Einheit erbt NICHT automatisch das Projekt aus dem alten Mandanten ihres Objekts — denn genau
DIE Annahme (1 Objekt = 1 Projekt) ist ja falsch. ABER: für die Bestandsdaten ist der Mandant der
beste verfügbare Default (die heutige Trennung APART/CAMPUS/WIMUS war de facto die Projekt-Trennung).
→ **Default-Backfill:** einheit.projekt_id = Projekt des alten Mandanten ihres Objekts
(APART→AAP, CAMPUS→ACA, WIMUS→WHV). DANN: Liste ALLER Einheiten mit zugewiesenem Projekt ausgeben,
Max prüft + korrigiert die Fälle, wo eine Einheit fachlich zu einem anderen Projekt gehört
(gemischte Häuser). ERST danach SET NOT NULL.
> ⚠ Hier ist menschliche Gegenprüfung PFLICHT — die gemischte Nutzung ist genau der Grund für
> dieses Modell und kann NICHT aus Altdaten erraten werden. Im Bau: Einheiten-Liste + Default-Projekt
> ausgeben, auf Max' Korrektur warten, dann finalisieren.

- **firma-Vererbung für einheit-gebundene Tabellen** läuft weiter über objekt_id (bestehende
  RLS-Elternkette einheit→objekt). NUR projekt_id ist neu auf der Einheit verankert.
- mandant_id-Tabellen OHNE objekt/einheit-Pfad (kontakte, kommunikationskanaele, …): Offener
  Punkt #3 — eigener Anker für Phase-C-RLS. Erst Bestandszahlen je Tabelle, dann entscheiden.

## Teilschritt B3 — Verifikation (Pflicht, vor Phase C)

- **objekte:** objekte ohne firma_id = 0 (NOT NULL nach Backfill).
- **einheiten:** einheiten ohne projekt_id = 0 (NOT NULL nach Backfill + Max-Korrektur).
- Jede gesellschaft-verankerte Zeile hat firma_id; kein gesellschaft_id ohne firma_id-Pendant
  (faktisch No-Op, da leer).
- **Hierarchie-Konsistenz:** projekt einer Einheit muss zur selben Firma gehören wie das Objekt der
  Einheit → `(select firma_id from projekte p where p.id = einheit.projekt_id)` ==
  `(select firma_id from objekte o where o.id = einheit.objekt_id)`. Bei Divergenz STOPP
  (eine Einheit kann nicht zu einem Projekt einer FREMDEN Firma gehören).
- **Einheiten-Projekt-Stichprobe:** ALLE Einheiten mit (objekt, alter-mandant, zugewiesenes Projekt)
  als Liste ausgeben → Max gegenprüft, besonders die gemischt genutzten Häuser.

## Teilschritt B4 — Projekt-eigene Bankkonten / FiBu-Teilbereiche (NEU, eigener Zyklus)

> Aus Punkt 3 + Attribut-Modell (c). NICHT Teil der reinen Ablöse-Migration B0–B3 — eigener
> Zyklus danach. Design jetzt FESTGELEGT (war: Scope offen):

- ➕ **`projekt_bankkonten`** (n Konten je Projekt): projekt_id, firma_id (Kumulationsziel),
  bank_name, iban, bic, kontoinhaber, bezeichnung, aktiv. CHECK: firma_id == projekt.firma_id.
- ➕ **`projekt_id`-Auflösung für FiBu-Buchungen über die EINHEIT:** Buchungen/Mietverträge hängen
  real an `einheit_id` (Schema 002 verifiziert) → das Projekt einer Buchung kommt aus
  `einheit.projekt_id`, NICHT aus einer eigenen Buchungs-Spalte und NICHT aus dem Objekt.
  Das löst gemischt genutzte Häuser automatisch korrekt. Buchung = Firma (über einheit→objekt.firma_id,
  steuerlich Pflicht) + Projekt (über einheit.projekt_id). KEINE separate Buchungskreis-Tabelle.
  > Für fibu-Buchungen OHNE einheit-Bezug (z.B. firmenweite Kosten): projekt_id bleibt NULL/
  > firmenweit — ‹im B4-Bau prüfen, welche fibu_*-Tabellen einheit-los sind und wie deren
  > Projektzuordnung laufen soll; ggf. optionales projekt_id-Tag NUR dort›.
- Aggregation: firma_id = steuerliche Sicht (Pflicht-Summenebene), projekt (via einheit) =
  Projekt-Erfolg / Kostenstellen-Sicht.
- ‹Genaue fibu-Tabellenliste + einheit-Pfad im B4-Bau gegen reales Schema prüfen.›

## Teilschritt B5 — Filter + Finanzauswertung (NICHT vergessen!)

> Eine projekt_id/Tag an der Buchung ist WERTLOS ohne Filter + Auswertung. Gehört zwingend dazu,
> sonst ist die ganze Dimension tot. Zwei Filterarten, weil zwei Datentypen (FK vs. freies Label):

**(a) Filter in Listen/UI**
- **Projekt/Kostenstelle (FK):** exakter Dropdown-Filter `WHERE projekt_id = X` (+ optional
  Hierarchie: Projekt inkl. Unter-Projekte via pfad/parent). Überall wo Buchungen/Belege gelistet
  werden (FiBu-Journal, Belegliste, Kontenblätter). Auch firma_id-Filter (steuerliche Sicht).
- **Tag (#22, freies Label):** Mehrfach-Filter (mehrere Tags wählbar, ODER/UND), kann QUER über
  Projekte/Firmen filtern („alles mit Tag ‘Wasserschaden-Fall’"). Andere UI (Tag-Chips, nicht
  Dropdown). → kommt mit #22, hier nur als Pflicht-Konsument vermerkt.
- Kombinierbar: projekt_id-Filter UND Tag-Filter gleichzeitig (orthogonal).

**(b) Auswertung im Finanzteil (das eigentliche Ziel)**
- **Projekt-Erfolgsrechnung:** je Projekt Erträge − Aufwände = Projektergebnis
  (GROUP BY firma_id, projekt_id). Drill-down über Projekt-Hierarchie (Unter-Projekte summieren auf
  Eltern via pfad).
- **Kostenstellen-Sicht:** dieselbe Aggregation gefiltert auf Aufwandskonten (Gemeinkosten je
  Projekt/Abteilung).
- **Steuerliche Sicht (Pflicht-Ebene):** GROUP BY firma_id — die Projekt-Dimension wird
  WEGAGGREGIERT, Firma = Summenebene für DATEV/Abschluss. Projekt ist NUR interne Auswertung,
  NIE steuerlich bindend.
- **Tag-Auswertung:** Summen je Tag möglich (z.B. Gesamtkosten eines „Falls" über mehrere Projekte),
  aber NUR informativ/intern — KEINE KLR-/Steuerdimension (Tag verteilt/trägt keine Kosten
  systematisch). Mit #22.
- Bestehende FiBu-Reports (Migration 015 fibu_reporting) um projekt_id-Dimension erweitern —
  ‹reale Report-Views/Funktionen in 015 im B5-Bau prüfen, additiv ergänzen, nicht doppeln›.

> B5 ist eigener Zyklus NACH B4 (Daten müssen erst da sein). Reihenfolge: B4 (Struktur) → B5
> (Filter+Auswertung). Tag-Anteile von B5 hängen an #22.

## Schema-Check-Befunde (Dump 20260701_1159, Live-Stand vor 029) — für Phase D

> Reale DDL aus dem Backup-Dump extrahiert (nicht aus Migrationsdateien). Befunde, die über 029/
> Phase B hinausgehen und in Phase D / eigene Klärung gehören. KEIN Handlungsbedarf in B0–B3.

### SC-1: „Marke" lebt an MEHREREN Stellen — 029 entfernt nur EINE
Ziel „Marke komplett raus" (Punkt 2) ist mit `projekte.marke`-Drop (029) NICHT erledigt. Real trägt
der Markenbegriff noch:
- **`crm_pipelines.marke`** — TEXT NOT NULL, DEFAULT 'uebergreifend', mit CHECK
  (`hausverwaltung/alfa_apartments/alfa_campus/alfa_development/uebergreifend`) UND Unique-Index
  `uq_crm_pipelines_default_marke (mandant_id, marke) WHERE default_pipeline`. Am stärksten verankert.
- **`kom_postfaecher.marke`** (TEXT), **`kom_wa_instanzen.marke`** (TEXT) — Kommunikationskanäle je Marke.
- **`objekt_tags.tag_typ`** erlaubt Wert `'marke'` (CHECK `nutzungsart/marke/region`).
- **`wimus.v_projekt_effektiv`** (UNTRACKED Live-View, rekursive CI-Vererbung) referenziert
  `projekte.marke` DREIFACH → blockiert den marke-Drop (entdeckt beim 029-Apply 2045). Kein
  App-Code liest sie. Muss beim marke-Drop ge-DROPpt + ohne marke neu angelegt + erstmals
  getrackt werden. Plus: `projekt-form.tsx` hat ein marke-Formularfeld (App-Change nötig).
> → Phase D muss diese vier Stellen adressieren (nicht nur projekte.marke). ACHTUNG: crm_pipelines/
> kom_* sind operativ genutzt — Ablösung braucht Migration der Werte auf projekt_id ODER bewusste
> Beibehaltung als eigenständiges Feld. NICHT im Zuge von B einfach droppen. Eigener Klärungspunkt
> (Offener Punkt #9). Diese Stellen kennen auch `alfa_development` als Marke (obwohl DEV nur Sample).

### SC-2: `firmen` hat DREI konkurrierende Typ-/Rechtsform-Felder
Real in firmen nebeneinander:
- **`typ`** varchar(20), CHECK alt `privat/operativ/vvGmbH/GbR/holding/sonstige` → 029 stellt auf
  `privat/Einzelunternehmung/GbR/GmbH` um.
- **`rechtsform_typ`** TEXT, CHECK `kapitalgesellschaft/personengesellschaft/privat`.
- **`rechtsform`** varchar(50), Freitext.
> Drei Felder für im Grunde dieselbe Frage „was für eine Firma". Nach unserem Modell ist `typ`
> (privat/Einzelunternehmung/GbR/GmbH) die Wahrheit + `taetigkeit` (operativ/vermögensverwaltend,
> noch anzulegen) + Steuersatz. Zu klären: Bleibt `rechtsform_typ` als grobe Oberkategorie
> (kapital-/personengesellschaft — automatisch aus typ ableitbar!) oder weg? Ist `rechtsform`
> (Freitext) noch nötig? Empfehlung: typ = führend; rechtsform_typ automatisch ableitbar (GmbH→
> kapital, GbR→personen, privat/Einzelunternehmung→…) → redundant, Kandidat für Drop/Trigger;
> rechtsform-Freitext nur für Anzeige, falls überhaupt. Eigener Klärungspunkt (Offener Punkt #10).
> NICHT in B0–B3 anfassen — nur dokumentiert.

## Was Phase B NICHT tut

- KEINE RLS-Änderung (Phase C). Bestehende mandant_isolation-Policies laufen weiter.
- KEIN Drop von mandant_id, gesellschaft_id, gesellschaften (Phase D). Ausnahme: projekte.marke
  (Punkt 2) — ‹B oder D, im Bau entscheiden›.
- Keine App-Code-Änderung an activeMandantId()/user_mandanten() (Phase C).

## Risiken & Leitplanken

- **Migration NIE Fast-Path**, /pg/query-Guardrail (exakte SQL zeigen, Freigabe). Idempotent.
- **DB-Backup vor Lauf** — Phase B schreibt echte Daten. Vor Phase B sicherstellen (Offener Punkt #4).
- **Werte-Mapping versteuerungsart→besteuerungsart** real auszählen, nicht raten.
- **mandant→firma n:1** sauber behandeln (keine Dubletten-Firmen). 
- **#17 (App live):** Phase C braucht laufende App zur Verifikation; sinnvoll, #17 vor B/C zu lösen.

## Reihenfolge im Bau

B0 (Seed-Fix + marke-Drop) → B1 (gesellschaft→firma + FK-Umstellung) → B2 (projekt_id-Anker) →
B3 (Verifikation). DANN eigene Zyklen: B4 (Projekt-Bankkonten + projekt_id an FiBu-Buchungen) →
B5 (Filter + Finanzauswertung). Getrennte Migrationen je Schritt (einzeln verifizierbar).
Migrationsnummern am Ende der Kette (höchste real prüfen). B5-Tag-Anteile hängen an #22.

## Offene Punkte (vor/im Bau klären, nicht raten)

1. versteuerungsart-Werte real auszählen → Mapping besteuerungsart/umsatzsteuer_typ.
2. Konsistenz mandant↔gesellschaft → dieselbe Firma? Bei Divergenz STOPP.
3. Welche mandant_id-Tabellen ohne objekt-Pfad brauchen firma_id und/oder projekt_id (je Tabelle)?
4. DB-Backup vor Phase B gesichert?
5. mandant→firma n:1: wie viele DISTINCT Firmen ergeben die Mandanten real? (AA+Campus = 1 Firma?)
6. ~~B4 Projekt-Bankkonten/FiBu-Teilbereiche: Felder vs. Tabelle?~~ ENTSCHIEDEN: eigene Tabelle
   `projekt_bankkonten` + projekt_id-Tag (Kostenstelle) an FiBu-Buchungen. Bleibt: genaue
   FiBu-Tabellenliste fürs Tag im B4-Bau prüfen.
7. projekte.marke real befüllt? (entscheidet, ob Drop in B unkritisch oder Inhalt sichern.)
8. Eine Migration vs. getrennte B0/B1/B2 (Tendenz: getrennt).
9. **Marke-Restliste (SC-1):** crm_pipelines.marke (mit CHECK+Unique!), kom_postfaecher.marke,
   kom_wa_instanzen.marke, objekt_tags.tag_typ='marke' — wie in Phase D ablösen? (Werte auf
   projekt_id migrieren ODER als eigenständiges Feld behalten?) Operativ genutzt, nicht einfach droppen.
10. **firmen Typ-Redundanz (SC-2):** typ vs. rechtsform_typ vs. rechtsform — welches ist führend?
    rechtsform_typ aus typ ableitbar → redundant? rechtsform-Freitext nötig? (typ = Wahrheit lt. Modell.)
11. **firmen Attribut-Modell (3 orthogonale Dimensionen, Max 2026-06-29) — für B0/eigenen Schritt:**
    - **(a) Rechtsform `typ`:** neue Liste `privat`(=Privatperson)/`Einzelunternehmung`/`GbR`/`GmbH`.
      GbR+GmbH „mit Anteilen" → über bestehende gesellschafter+beteiligungen (Mig. 010, kein Neubau).
      → CHECK-Swap ist B0 (029). ERLEDIGT als Struktur; Werte je Firma via UI.
    - **(b) Tätigkeitsvermerk `firmen.taetigkeit` (NEU anzulegen):** `operativ`/`vermoegensverwaltend` —
      ist ein VERMERK, keine Rechtsform. „vvGmbH" = typ=GmbH + taetigkeit=vermoegensverwaltend (KEIN
      eigener typ). Feld fehlt real → eigener additiver Schritt (nicht in 029).
    - **(c) Steuersatz konfigurierbar je Firma (NEU):** abhängig von typ+taetigkeit — GmbH operativ
      ~30% (KSt+GewSt), vvGmbH ~15% (erw. GewSt-Kürzung §9 Nr.1 S.2 GewStG, WENN nur eigener
      Grundbesitz — StB bestätigt), Privatperson = Grenzsteuersatz (progressiv/variabel je Jahr →
      evtl. zeitabhängige Tabelle statt Spalte). ⚠ ERP modelliert nur KONFIGURIERBARKEIT, keine
      Steuerwahrheit (Claude ist kein StB). → eigener FiBu-naher Schritt (B0b/eigene Spec), NICHT B0.
    > Reihenfolge: (a) ist 029 (erledigt). (b)+(c) = eigener Schritt nach B, mit klarem Kopf +
    > StB-Rücksprache für die Sätze. Design (zeitabhängige Steuersatz-Tabelle) offen.

## Änderungshistorie

| Datum/Zeit (MESZ) | Vorgang |
|-------------------|---------|
| 2026-06-29 21:45 | firmen-Attribut-Modell in Spec überführt (war in _NOTE_b0-firmen-typ-offen, jetzt Offener Punkt #11): 3 orthogonale Dimensionen — (a) Rechtsform typ=privat/Einzelunternehmung/GbR/GmbH (029, erledigt), (b) taetigkeit=operativ/vermoegensverwaltend NEU anzulegen (vvGmbH=GmbH+vermerk), (c) Steuersatz konfigurierbar je Firma (eigener FiBu-Schritt, StB-Rücksprache). NOTE-Dateien nach _trash geräumt (Karpathy-Schema: Chronik lebt in Spec, nicht in Streu-NOTES). |
| 2026-06-29 21:00 | 029-APPLY GESTOPPT + B0-SPLIT (Report 2045): marke-Drop scheiterte an untracked View v_projekt_effektiv (referenziert marke 3×) + projekt-form.tsx-Feld — Live-Schema unverändert (sauberer Rollback, CC vermied CASCADE). ENTSCHEIDUNG: B0 = NUR firmen.typ-CHECK-Swap (abhängigkeitsfrei, sofort). marke-Drop → Phase D (mit View-Recreate+Tracking + App-Change), gehört zur Marke-Gesamtablösung SC-1. B0-Abschnitt + SC-1 aktualisiert. Parallel: Tags (030) LIVE (Commit 55be904, 407 grün, verifiziert). |
| 2026-06-29 20:40 | Schema-Check gegen Backup-Dump (20260701_1159, Live vor 029): 2 Befunde ergänzt (Abschnitt „Schema-Check-Befunde" + Offene Punkte #9/#10). SC-1: „Marke" lebt an 4 weiteren Stellen (crm_pipelines.marke mit CHECK+Unique, kom_postfaecher/kom_wa_instanzen.marke, objekt_tags.tag_typ) — 029 droppt nur projekte.marke, Rest = Phase D. SC-2: firmen hat 3 konkurrierende Typ-Felder (typ/rechtsform_typ/rechtsform) — Redundanz, typ führend, Rest klären. Beide NUR dokumentiert, kein Eingriff in B0–B3. Sonst Schema sauber/konsistent (RLS-Maschine, FK-Ketten einheit→objekt→…, polymorphe Bezüge). |
| 2026-06-29 18:00 | v0.4.0 ZWEI-EBENEN-KORREKTUR (Max: Einheiten eines Objekts können verschiedenen Projekten gehören): firma_id sitzt am OBJEKT (Besitz/FiBu, ein Gebäude=eine Firma), projekt_id sitzt an der EINHEIT (Nutzung, je Wohnung verschieden — MFH kann KZV+WG+HV mischen). Real verifiziert: mietvertraege.einheit_id + buchungen.einheit_id → FiBu löst projekt aus Einheit auf, gemischte Häuser automatisch korrekt. objekte bekommt KEIN projekt_id mehr. Backfill: objekte.firma_id aus mandant (APART/CAMPUS→VVG, WIMUS→WIM); einheiten.projekt_id Default aus mandant-Projekt, dann Max-Gegenprüfung PFLICHT (gemischte Häuser nicht aus Altdaten erratbar). B2/B3/B4-FiBu/Hierarchie-Diagramm angepasst. |
| 2026-06-29 17:45 | Lese-Vorlauf (Report 1745): gesellschaften LEER (B1 No-Op), nur 10 objekte, marke 0/7 (Drop unkritisch), firmen 3 (typ NULL), DISTINCT Firmen=2 (VVG/WIM), AA+Campus=VVG bestätigt. DEV war nur Sample. |
| 2026-06-29 17:25 | v0.3.2 FILTER+AUSWERTUNG ergänzt (B5: Filter projekt/Kostenstelle + Tags, Finanzauswertung Projekt-Erfolg/steuerliche Sicht). |
| 2026-06-29 17:20 | v0.3.x Korrektur (Max): projekt_id ist NICHT „die Kostenstelle" — KS betrifft nur Ausgaben, Projekt umfasst Aufwand UND Ertrag (volle Erfolgsrechnung). Kostenstelle = Aufwands-Sicht (projekt_id + Aufwandskonto), keine eigene Spalte. Begriffsblock korrigiert. |
| 2026-06-29 17:15 | v0.3.1 KLR-Begriffe geschärft (Artikel zumfachwirt): Kostenart/Kostenstelle/Kostenträger getrennt; Tag (#22) ohne KLR-Bezug. |
| 2026-06-29 17:00 | v0.3.0 ATTRIBUT-MODELL (Max: „Projekt=Abteilung mit eigenen Bankkonten/CI/FiBu, kumuliert über Firma=steuerl. Subjekt"): vollständige Attribut-Aufteilung firma (steuerlich, real ✅ komplett) vs. projekt (Zugehörigkeit+CI real ✅; Bankkonten+FiBu-Teilbereich ➕ neu). B4-Design festgelegt: eigene Tabelle projekt_bankkonten + projekt_id-Kostenstellen-Tag an FiBu-Buchungen (KEINE separate Buchungskreis-Tabelle, steuerl. Subjekt bleibt Firma). Konsistenzregel projekt.firma_id == bankkonto/buchung.firma_id. Punkt #6 entschieden. |
| 2026-06-29 16:45 | v0.2.0 BEREINIGUNG (Max): gesellschaft_id→firma_id durchgehend (Ablösung, nicht Koexistenz); „Marke" komplett raus inkl. Spalte projekte.marke; Projekte können eigene Bankkonten/FiBu-Teilbereiche (neuer Schritt B4, Scope offen); Auflösungswurzel = firma (jur. Person/Privatperson), mandant entfällt ersatzlos. mandant→firma jetzt n:1 möglich (AA+Campus evtl. 1 Firma). Org-Modell-Block + Hierarchie ergänzt. |
| 2026-06-29 16:30 | v0.1.1: Backfill „mandant=firma nach FiBu", beide Achsen aus mandant. |
| 2026-06-29 16:10 | v0.1.0 Erstentwurf Phase B. |

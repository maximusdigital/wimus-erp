# Org Phase-B — Lese-Vorlauf (offene Punkte real ausgezählt, #21)

> READ-ONLY aus Live-Schema `wimus` via /pg/query. Roh + kurze Einschätzung. Extrahiert: System-UTC heute.

Katalog-Befund (existierende Tabellen): mandanten, gesellschaften, firmen, workspaces, projekte, objekte, finanzierungen, veraeusserungen, reinvestitionsruecklagen, intercompany

## A) Offener Punkt #5 — Mandanten & Gesellschaften (→ DISTINCT Firmen)

**mandanten**

```json
[
  {
    "id": "33333333-3333-3333-3333-333333333333",
    "name": "ALFA APARTMENTS",
    "kuerzel": "APART"
  },
  {
    "id": "22222222-2222-2222-2222-222222222222",
    "name": "ALFA CAMPUS",
    "kuerzel": "CAMPUS"
  },
  {
    "id": "44444444-4444-4444-4444-444444444444",
    "name": "ALFA DEVELOPMENT",
    "kuerzel": "DEV"
  },
  {
    "id": "11111111-1111-1111-1111-111111111111",
    "name": "WIMUS Hausverwaltung",
    "kuerzel": "WIMUS"
  }
]
```

**gesellschaften**

```json
[]
```

> → DISTINCT Firmen-Einschätzung aus name/typ ableiten (s. Report Rückfragen); n:1 mandant→firma möglich.


## B) Offener Punkt #1 — versteuerungsart-Werte

**versteuerungsart GROUP BY**

```json
[]
```

> → Mapping-Vorschlag versteuerungsart → besteuerungsart/umsatzsteuer_typ im Report (NICHT anwenden).


## C) Offener Punkt #7 — projekte.marke befüllt?

**marke count**

```json
[
  {
    "total": 7,
    "mit_marke": 0
  }
]
```

> → marke NICHT befüllt → Drop unkritisch.


## D) Bestandszahlen (Migrations-Umfang)

**objekte counts (vorhandene FK-Spalten: mandant_id, gesellschaft_id)**

```json
[
  {
    "total": 10,
    "mandant_id_nn": 10,
    "gesellschaft_id_nn": 0
  }
]
```

**gesellschaften counts (vorhandene FK-Spalten: —)**

```json
[
  {
    "total": 0
  }
]
```

**finanzierungen counts (vorhandene FK-Spalten: gesellschaft_id)**

```json
[
  {
    "total": 0,
    "gesellschaft_id_nn": 0
  }
]
```

**veraeusserungen counts (vorhandene FK-Spalten: gesellschaft_id)**

```json
[
  {
    "total": 0,
    "gesellschaft_id_nn": 0
  }
]
```

**reinvestitionsruecklagen counts (vorhandene FK-Spalten: gesellschaft_id)**

```json
[
  {
    "total": 0,
    "gesellschaft_id_nn": 0
  }
]
```

**intercompany counts (vorhandene FK-Spalten: leistende_gesellschaft_id, empfangende_gesellschaft_id)**

```json
[
  {
    "total": 0,
    "leistende_gesellschaft_id_nn": 0,
    "empfangende_gesellschaft_id_nn": 0
  }
]
```

**projekte GROUP BY ebene**

```json
[
  {
    "ebene": 0,
    "n": 5
  },
  {
    "ebene": 1,
    "n": 2
  }
]
```

**projekte ebene 0**

```json
[
  {
    "id": "b0000000-0000-4000-8000-000000000001",
    "kuerzel": "AAP",
    "name": "ALFA APARTMENTS",
    "firma_id": "a0000000-0000-4000-8000-000000000003"
  },
  {
    "id": "b0000000-0000-4000-8000-000000000002",
    "kuerzel": "ACA",
    "name": "ALFA CAMPUS",
    "firma_id": "a0000000-0000-4000-8000-000000000003"
  },
  {
    "id": "b0000000-0000-4000-8000-000000000005",
    "kuerzel": "ABHS21A",
    "name": "Ankauf BHS21A",
    "firma_id": "a0000000-0000-4000-8000-000000000001"
  },
  {
    "id": "b0000000-0000-4000-8000-000000000004",
    "kuerzel": "MFHSO",
    "name": "MFH Stuttgart-Ost",
    "firma_id": "a0000000-0000-4000-8000-000000000002"
  },
  {
    "id": "b0000000-0000-4000-8000-000000000003",
    "kuerzel": "WHV",
    "name": "WIMUS Hausverwaltung",
    "firma_id": "a0000000-0000-4000-8000-000000000002"
  }
]
```

**firmen**

```json
[
  {
    "id": "a0000000-0000-4000-8000-000000000001",
    "kuerzel": "MMP",
    "name": "Maxim Moser (privat)",
    "typ": null
  },
  {
    "id": "a0000000-0000-4000-8000-000000000002",
    "kuerzel": "WIM",
    "name": "WIMUS GmbH",
    "typ": null
  },
  {
    "id": "a0000000-0000-4000-8000-000000000003",
    "kuerzel": "VVG",
    "name": "WIMUS vvGmbH",
    "typ": null
  }
]
```

**workspaces**

```json
[
  {
    "id": "19277469-7ba2-41ac-bf3d-cca1d94a6d31",
    "kuerzel": "WG",
    "name": "WIMUS Gruppe"
  }
]
```


## E) B0-Vorbereitung — projekte-Ist (Baum)

**alle projekte (ebene, name)**

```json
[
  {
    "id": "b0000000-0000-4000-8000-000000000001",
    "kuerzel": "AAP",
    "name": "ALFA APARTMENTS",
    "typ": "kzv",
    "ebene": 0,
    "parent_projekt_id": null,
    "firma_id": "a0000000-0000-4000-8000-000000000003",
    "pfad": null
  },
  {
    "id": "b0000000-0000-4000-8000-000000000002",
    "kuerzel": "ACA",
    "name": "ALFA CAMPUS",
    "typ": "wg",
    "ebene": 0,
    "parent_projekt_id": null,
    "firma_id": "a0000000-0000-4000-8000-000000000003",
    "pfad": null
  },
  {
    "id": "b0000000-0000-4000-8000-000000000005",
    "kuerzel": "ABHS21A",
    "name": "Ankauf BHS21A",
    "typ": "ankauf",
    "ebene": 0,
    "parent_projekt_id": null,
    "firma_id": "a0000000-0000-4000-8000-000000000001",
    "pfad": null
  },
  {
    "id": "b0000000-0000-4000-8000-000000000004",
    "kuerzel": "MFHSO",
    "name": "MFH Stuttgart-Ost",
    "typ": "bauprojekt",
    "ebene": 0,
    "parent_projekt_id": null,
    "firma_id": "a0000000-0000-4000-8000-000000000002",
    "pfad": null
  },
  {
    "id": "b0000000-0000-4000-8000-000000000003",
    "kuerzel": "WHV",
    "name": "WIMUS Hausverwaltung",
    "typ": "hausverwaltung",
    "ebene": 0,
    "parent_projekt_id": null,
    "firma_id": "a0000000-0000-4000-8000-000000000002",
    "pfad": null
  },
  {
    "id": "b0000000-0000-4000-8000-000000000012",
    "kuerzel": "AAP-MONT",
    "name": "Monteure",
    "typ": "monteur",
    "ebene": 1,
    "parent_projekt_id": "b0000000-0000-4000-8000-000000000001",
    "firma_id": "a0000000-0000-4000-8000-000000000003",
    "pfad": null
  },
  {
    "id": "b0000000-0000-4000-8000-000000000011",
    "kuerzel": "AAP-TOUR",
    "name": "Touristen / KZV",
    "typ": "kzv",
    "ebene": 1,
    "parent_projekt_id": "b0000000-0000-4000-8000-000000000001",
    "firma_id": "a0000000-0000-4000-8000-000000000003",
    "pfad": null
  }
]
```

> → Prüfen: liegen MFHSO/ABHS21A fälschlich auf ebene 0? fehlt ALFA DEVELOPMENT als Top-Projekt? (Report)

## D2) objekte je Mandant (Nachtrag, B2-Planung)

```json
[
  {
    "mandant": "APART",
    "name": "ALFA APARTMENTS",
    "mandant_id": "33333333-3333-3333-3333-333333333333",
    "objekte": 3
  },
  {
    "mandant": "CAMPUS",
    "name": "ALFA CAMPUS",
    "mandant_id": "22222222-2222-2222-2222-222222222222",
    "objekte": 1
  },
  {
    "mandant": "WIMUS",
    "name": "WIMUS Hausverwaltung",
    "mandant_id": "11111111-1111-1111-1111-111111111111",
    "objekte": 6
  }
]
```

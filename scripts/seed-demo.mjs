/**
 * Demo-Seed für das wimus-Schema – macht die gebauten Workflows (BK, Forderungen,
 * Mahnlauf) demonstrierbar. Idempotent (feste UUIDs, upsert on_conflict=id).
 *
 *   node scripts/seed-demo.mjs
 *
 * Nutzt SUPABASE_SERVICE_ROLE_KEY (umgeht RLS). Nur Demo-Daten.
 */
import { readFileSync } from "node:fs"

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("="))
    .map((l) => {
      const i = l.indexOf("=")
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
    })
)
const url = env.NEXT_PUBLIC_SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY
const H = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
  "Content-Profile": "wimus",
  Prefer: "resolution=merge-duplicates,return=minimal",
}

async function upsert(table, rows) {
  const r = await fetch(`${url}/rest/v1/${table}?on_conflict=id`, {
    method: "POST",
    headers: H,
    body: JSON.stringify(rows),
  })
  const t = await r.text()
  console.log(`${r.status < 300 ? "✅" : "❌"} ${table} (${rows.length}) ${r.status} ${t.slice(0, 200)}`)
}

// Reale Objekte holen (id, mandant_id).
const objekteRes = await fetch(
  `${url}/rest/v1/objekte?select=id,kuerzel,mandant_id&order=kuerzel&limit=3`,
  { headers: { ...H, "Accept-Profile": "wimus" } }
)
const objekte = await objekteRes.json()
if (!Array.isArray(objekte) || objekte.length === 0) {
  console.error("Keine Objekte gefunden – Abbruch.")
  process.exit(1)
}
const mandant = objekte[0].mandant_id
const heute = "2026-06-26"
const u = (p, n) =>
  `${(p + "000000").slice(0, 8)}-0000-4000-8000-${String(n).padStart(12, "0")}`

// --- Einheiten (2 je Objekt, mit Fläche) ---
const einheiten = []
objekte.forEach((o, oi) => {
  for (let i = 1; i <= 2; i++) {
    einheiten.push({
      id: u("e1", oi * 10 + i),
      objekt_id: o.id,
      kuerzel: `${o.kuerzel}-W${i}`,
      bezeichnung: `Wohnung ${i}`,
      typ: "wohnung",
      flaeche: 60 + i * 15,
      verwendungszweck_code: `${o.kuerzel}W${i}`,
      aktiv: true,
    })
  }
})
await upsert("einheiten", einheiten)

// --- Kontakte (Mieter) ---
const mieterNamen = [
  ["Anna", "Becker"],
  ["Bernd", "Schmidt"],
  ["Clara", "Wagner"],
  ["David", "Hoffmann"],
  ["Eva", "Krüger"],
  ["Felix", "Braun"],
]
const kontakte = mieterNamen.map(([v, n], i) => ({
  id: u("c1", i + 1),
  mandant_id: mandant,
  kontakt_typ: "person",
  anrede: i % 2 ? "Herr" : "Frau",
  vorname: v,
  nachname: n,
  email: `${v.toLowerCase()}.${n.toLowerCase()}@example.com`,
  ist_mieter: true,
  dsgvo_datenweitergabe: true,
  aktiv: true,
}))
await upsert("kontakte", kontakte)

// --- Mietverträge (je Einheit ein Mieter) ---
const mietvertraege = einheiten.map((e, i) => ({
  id: u("d1", i + 1),
  mandant_id: mandant,
  einheit_id: e.id,
  mieter_id: kontakte[i % kontakte.length].id,
  vertragstyp: "V01",
  status: "aktiv",
  mietbeginn: "2024-01-01",
  grundmiete: 700 + (i % 3) * 80,
  bk_pauschale: 120 + (i % 3) * 10,
}))
await upsert("mietvertraege", mietvertraege)

// --- Forderungen (2 überfällig → Mahnlauf, 1 aktuell) ---
const forderungen = [
  {
    id: u("f1", 1),
    mandant_id: mandant,
    kontakt_id: mietvertraege[0].mieter_id,
    mietvertrag_id: mietvertraege[0].id,
    einheit_id: mietvertraege[0].einheit_id,
    forderung_typ: "miete",
    betrag: 820,
    faellig_am: "2026-05-01",
    status: "offen",
  },
  {
    id: u("f1", 2),
    mandant_id: mandant,
    kontakt_id: mietvertraege[1].mieter_id,
    mietvertrag_id: mietvertraege[1].id,
    einheit_id: mietvertraege[1].einheit_id,
    forderung_typ: "bk_nachzahlung",
    betrag: 340,
    faellig_am: "2026-05-20",
    status: "offen",
  },
  {
    id: u("f1", 3),
    mandant_id: mandant,
    kontakt_id: mietvertraege[2].mieter_id,
    mietvertrag_id: mietvertraege[2].id,
    einheit_id: mietvertraege[2].einheit_id,
    forderung_typ: "miete",
    betrag: 780,
    faellig_am: "2026-07-01",
    status: "offen",
  },
]
await upsert("forderungen", forderungen)

// --- BK-Arten ---
const bkArten = [
  { id: u("a1", 1), mandant_id: mandant, bezeichnung: "Allgemeinstrom", kategorie: null, standard_schluessel: "flaeche", umlagefaehig: true, aktiv: true },
  { id: u("a1", 2), mandant_id: mandant, bezeichnung: "Müllabfuhr", kategorie: null, standard_schluessel: "einheit", umlagefaehig: true, aktiv: true },
  { id: u("a1", 3), mandant_id: mandant, bezeichnung: "Hausmeister", kategorie: null, standard_schluessel: "flaeche", umlagefaehig: true, aktiv: true },
]
await upsert("bk_arten", bkArten)

// --- Abrechnungseinheit für Objekt 0 + Mitglieder + Positionen ---
const obj0 = objekte[0]
const ae = {
  id: u("ae", 1),
  mandant_id: mandant,
  objekt_id: obj0.id,
  bezeichnung: `BK ${obj0.kuerzel} (Gesamt)`,
  typ: "bk_gruppe",
  standard_schluessel: "flaeche",
  aktiv: true,
}
await upsert("abrechnungseinheiten", [ae])

const obj0Einheiten = einheiten.filter((e) => e.objekt_id === obj0.id)
const mitglieder = obj0Einheiten.map((e, i) => {
  const mv = mietvertraege.find((m) => m.einheit_id === e.id)
  return {
    id: u("90", i + 1),
    abrechnungseinheit_id: ae.id,
    einheit_id: e.id,
    mietvertrag_id: mv?.id ?? null,
    intern_abgerechnet: false,
    aktiv: true,
  }
})
await upsert("abrechnungseinheit_mitglieder", mitglieder)

const positionen = [
  { id: u("80", 1), mandant_id: mandant, objekt_id: obj0.id, bk_art_id: bkArten[0].id, abrechnungseinheit_id: ae.id, betrag_brutto: 480, umlagefaehig: true, abrechnungsperiode: "2025" },
  { id: u("80", 2), mandant_id: mandant, objekt_id: obj0.id, bk_art_id: bkArten[1].id, abrechnungseinheit_id: ae.id, betrag_brutto: 360, umlagefaehig: true, abrechnungsperiode: "2025" },
  { id: u("80", 3), mandant_id: mandant, objekt_id: obj0.id, bk_art_id: bkArten[2].id, abrechnungseinheit_id: ae.id, betrag_brutto: 1200, umlagefaehig: true, abrechnungsperiode: "2025" },
]
await upsert("kostenverteilung_positionen", positionen)

console.log("\nDemo-Seed fertig.")

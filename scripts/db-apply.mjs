// =====================================================================
// WIMUS ERP – Migrations-Apply über postgres-meta (/pg/query)
//
// Spielt eine Migrations-SQL-Datei über den HTTP-Endpoint der self-hosted
// Supabase (postgres-meta hinter Kong) ein — funktioniert AUCH wenn der direkte
// Postgres-Port (5432) von außen zu ist. Service-Role-Key = Voll-SQL-Zugang.
//
// ⚠️ SCHREIBEND. Läuft bewusst unter `ask` in .claude/settings.local.json, damit
//    Max jeden Einspiel-Lauf bestätigt (kein stilles DDL). Lesen/Verifizieren
//    läuft separat (read-only SELECTs), nicht über dieses Skript.
//
// Aufruf:
//   node scripts/db-apply.mjs 028            # Präfix-Match in supabase/migrations
//   node scripts/db-apply.mjs 024_suche_trigram.sql
//   node scripts/db-apply.mjs path/zu/datei.sql
//
// Transaktional: BEGIN … COMMIT um die Datei; bei Fehler rollt Postgres zurück.
// Migrationen sind idempotent (IF NOT EXISTS / ON CONFLICT) → erneuter Lauf safe.
// =====================================================================
import { readFileSync, readdirSync, existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, "..")
const migrationsDir = join(root, "supabase", "migrations")

// --- Migration auflösen (analog db-push.mjs) ---
function resolve(step) {
  if (!step) return null
  if (existsSync(step)) return [step, step]
  const direct = join(migrationsDir, step.endsWith(".sql") ? step : `${step}.sql`)
  if (existsSync(direct)) return [step, direct]
  const match = readdirSync(migrationsDir)
    .filter((f) => f.startsWith(step) && f.endsWith(".sql"))
    .sort()
  if (match.length === 1) return [match[0], join(migrationsDir, match[0])]
  if (match.length > 1) {
    console.error(`Mehrdeutig: ${step} → ${match.join(", ")}. Bitte eindeutig angeben.`)
    process.exit(1)
  }
  return null
}

const arg = process.argv[2]
const resolved = resolve(arg)
if (!resolved) {
  console.error(`Migration nicht gefunden: ${arg ?? "(kein Argument)"}`)
  console.error(`Aufruf: node scripts/db-apply.mjs <nummer|dateiname|pfad>`)
  process.exit(1)
}
const [label, path] = resolved

// --- Env laden (.env.local) ---
const env = {}
const envPath = join(root, ".env.local")
for (const line of readFileSync(envPath, "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "")
}
const base = (env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "")
const key = env.SUPABASE_SERVICE_ROLE_KEY
if (!base || !key) {
  console.error("FEHLER: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY fehlen in .env.local.")
  process.exit(1)
}

async function pgQuery(query) {
  const res = await fetch(`${base}/pg/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: key, Authorization: `Bearer ${key}` },
    body: JSON.stringify({ query }),
  })
  let body
  try { body = await res.json() } catch { body = await res.text() }
  return { ok: res.ok, status: res.status, body }
}

const sql = readFileSync(path, "utf8")
console.log(`▶ Apply ${label}`)
console.log(`  Datei: ${path}`)
console.log(`  Ziel : ${base}/pg/query (postgres-meta, Service-Role)`)

const wrapped = `BEGIN;\n${sql}\nCOMMIT;`
const r = await pgQuery(wrapped)

if (r.ok && !(r.body && r.body.error)) {
  console.log(`✓ ${label} erfolgreich eingespielt (HTTP ${r.status}).`)
} else {
  const msg = r.body && r.body.error ? r.body.error : JSON.stringify(r.body)
  console.error(`✗ ${label} FEHLGESCHLAGEN (HTTP ${r.status}) – Transaktion zurückgerollt.`)
  console.error(`  ${msg}`)
  process.exitCode = 1
}

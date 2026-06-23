// =====================================================================
// WIMUS ERP – Migrations-Runner (self-hosted Supabase)
//
// Führt SQL-Dateien transaktional gegen DATABASE_URL aus.
//
// Aufruf (Node >= 20):
//   node --env-file=.env.local scripts/db-push.mjs
//
// Optional nur Schema oder nur Seed:
//   node --env-file=.env.local scripts/db-push.mjs schema
//   node --env-file=.env.local scripts/db-push.mjs seed
// =====================================================================
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import pg from 'pg'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const migrationsDir = join(root, 'supabase', 'migrations')

const FILES = {
  schema: join(migrationsDir, '001_initial_schema.sql'),
  seed: join(root, 'supabase', 'seed.sql'),
}

/**
 * Löst einen Schritt zu einer SQL-Datei auf:
 *   - bekannte Aliase (schema, seed)
 *   - exakter Dateiname / Pfad
 *   - Präfix-Match in supabase/migrations (z.B. "003" → 003_kzv_felder.sql)
 *   - "all" → alle Migrationen 0xx in Reihenfolge
 */
function resolveStep(step) {
  if (FILES[step]) return [[step, FILES[step]]]
  if (step === 'all') {
    return readdirSync(migrationsDir)
      .filter((f) => /^\d+.*\.sql$/.test(f))
      .sort()
      .map((f) => [f, join(migrationsDir, f)])
  }
  if (existsSync(step)) return [[step, step]]
  const direct = join(migrationsDir, step.endsWith('.sql') ? step : `${step}.sql`)
  if (existsSync(direct)) return [[step, direct]]
  const match = readdirSync(migrationsDir)
    .filter((f) => f.startsWith(step) && f.endsWith('.sql'))
    .sort()
  if (match.length > 0) return match.map((f) => [f, join(migrationsDir, f)])
  return null
}

const arg = process.argv[2]
const requested = arg ? [arg] : ['schema', 'seed']
const steps = []
for (const s of requested) {
  const resolved = resolveStep(s)
  if (!resolved) {
    console.error(`Unbekannter Schritt: ${s} (erlaubt: schema, seed, all, oder Migrationsname wie 003)`)
    process.exit(1)
  }
  steps.push(...resolved)
}

let connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('FEHLER: DATABASE_URL nicht gesetzt (in .env.local eintragen).')
  process.exit(1)
}

// Optional: über SSH-Tunnel auf server-lokalen Postgres. Host/Port werden auf
// 127.0.0.1:<TUNNEL_LOCAL_PORT> umgebogen, Passwort/DB bleiben erhalten.
if (process.env.TUNNEL_LOCAL_PORT) {
  const u = new URL(connectionString)
  u.hostname = '127.0.0.1'
  u.port = process.env.TUNNEL_LOCAL_PORT
  connectionString = u.toString()
  console.log(`Tunnel-Modus: verbinde über 127.0.0.1:${process.env.TUNNEL_LOCAL_PORT}`)
}

// Self-hosted Postgres: SSL anbieten, aber Zertifikat nicht hart erzwingen.
// Im Tunnel-Modus ist der Transport bereits per SSH verschlüsselt -> SSL aus,
// da der container-interne Postgres oft kein TLS anbietet.
const noSsl = process.env.TUNNEL_LOCAL_PORT || process.env.NO_SSL
const client = new pg.Client({
  connectionString,
  ssl: noSsl ? false : { rejectUnauthorized: false },
})

async function runFile(label, path) {
  const sql = readFileSync(path, 'utf8')
  console.log(`\n▶ ${label}: ${path}`)
  await client.query('BEGIN')
  try {
    await client.query(sql)
    await client.query('COMMIT')
    console.log(`✓ ${label} erfolgreich eingespielt.`)
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(`✗ ${label} fehlgeschlagen – Transaktion zurückgerollt.`)
    console.error(`  ${err.message}`)
    throw err
  }
}

async function report() {
  const tables = await client.query(
    `select count(*)::int as n from information_schema.tables
     where table_schema = 'public'`
  )
  const mand = await client.query('select count(*)::int as n from public.mandanten')
  const obj = await client.query('select count(*)::int as n from public.objekte')
  console.log('\n── Stand nach Migration ──')
  console.log(`  public-Tabellen: ${tables.rows[0].n}`)
  console.log(`  mandanten:       ${mand.rows[0].n}`)
  console.log(`  objekte:         ${obj.rows[0].n}`)
}

try {
  await client.connect()
  console.log('Verbunden mit Datenbank.')
  for (const [label, path] of steps) {
    await runFile(label, path)
  }
  await report()
} catch (err) {
  console.error('\n✗ Abbruch:', err.message)
  if (err.code) console.error('  code:', err.code)
  process.exitCode = 1
} finally {
  await client.end()
}

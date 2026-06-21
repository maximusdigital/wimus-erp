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
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import pg from 'pg'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const FILES = {
  schema: join(root, 'supabase', 'migrations', '001_initial_schema.sql'),
  seed: join(root, 'supabase', 'seed.sql'),
}

const arg = process.argv[2]
const steps = arg ? [arg] : ['schema', 'seed']

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
  for (const step of steps) {
    if (!FILES[step]) {
      console.error(`Unbekannter Schritt: ${step} (erlaubt: schema, seed)`)
      process.exit(1)
    }
    await runFile(step, FILES[step])
  }
  await report()
} catch (err) {
  console.error('\n✗ Abbruch:', err.message)
  if (err.code) console.error('  code:', err.code)
  process.exitCode = 1
} finally {
  await client.end()
}

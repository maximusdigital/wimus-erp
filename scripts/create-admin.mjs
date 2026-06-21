// =====================================================================
// WIMUS ERP – Admin-User anlegen + auf alle Mandanten verknüpfen
//
// Aufruf:
//   ADMIN_EMAIL=info@wimus.de ADMIN_PASSWORD='...' NO_SSL=1 \
//     node --env-file=.env.local scripts/create-admin.mjs
// =====================================================================
import pg from 'pg'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const email = process.env.ADMIN_EMAIL
const password = process.env.ADMIN_PASSWORD
const dbUrl = process.env.DATABASE_URL

for (const [k, v] of Object.entries({ NEXT_PUBLIC_SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: serviceKey, ADMIN_EMAIL: email, ADMIN_PASSWORD: password, DATABASE_URL: dbUrl })) {
  if (!v) { console.error(`FEHLER: ${k} nicht gesetzt.`); process.exit(1) }
}

const base = url.replace(/\/$/, '')
const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' }

async function findUserByEmail() {
  const res = await fetch(`${base}/auth/v1/admin/users?per_page=200`, { headers })
  if (!res.ok) throw new Error(`Userliste fehlgeschlagen: ${res.status} ${await res.text()}`)
  const data = await res.json()
  const list = Array.isArray(data) ? data : data.users || []
  return list.find(u => (u.email || '').toLowerCase() === email.toLowerCase()) || null
}

async function createUser() {
  const res = await fetch(`${base}/auth/v1/admin/users`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { name: 'max' } }),
  })
  if (res.ok) return (await res.json())
  const text = await res.text()
  // Bereits vorhanden -> bestehenden User holen
  if (res.status === 422 || res.status === 400 || /already/i.test(text)) {
    console.log('Hinweis: User existiert bereits – verwende bestehenden Datensatz.')
    const existing = await findUserByEmail()
    if (existing) return existing
  }
  throw new Error(`User-Anlage fehlgeschlagen: ${res.status} ${text}`)
}

const user = await createUser()
console.log(`Auth-User: ${user.email}  (id=${user.id})`)

const client = new pg.Client({ connectionString: dbUrl, ssl: process.env.NO_SSL ? false : { rejectUnauthorized: false } })
await client.connect()
try {
  const r = await client.query(
    `insert into public.user_mandanten (user_id, mandant_id, rolle)
     select $1::uuid, m.id, 'admin' from public.mandanten m
     on conflict (user_id, mandant_id) do nothing
     returning mandant_id`,
    [user.id]
  )
  const total = await client.query('select count(*)::int as n from public.user_mandanten where user_id = $1', [user.id])
  console.log(`Neu verknüpft: ${r.rowCount} | Mandanten gesamt für User: ${total.rows[0].n}`)
} finally {
  await client.end()
}

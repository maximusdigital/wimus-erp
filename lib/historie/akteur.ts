/**
 * Akteur-Quelle. WICHTIGE REALITÄT:
 * `SET LOCAL wimus.akteur_id` ist über supabase-js / PostgREST NICHT pro Request
 * setzbar (HTTP, keine persistente Session/Transaktion in der App-Hand). Deshalb:
 *  - Audit-Log: der Trigger liest `request.jwt.claims->>'sub'` (von PostgREST je
 *    Request gesetzt) = auth-User-UUID. Kein App-Code nötig — funktioniert automatisch.
 *  - Aktivitäts-Historie: der Akteur wird explizit an protokolliere() übergeben
 *    (akteurId), gelesen aus der Session via getAktuellerAkteur().
 * Die GUC `wimus.akteur_id` bleibt als Pfad offen für serverseitige Raw-SQL-/
 * Service-Kontexte (z.B. künftige DB-Funktionen), wird aktuell aber nicht gesetzt.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbClient = any

/** Aktueller auth-User als Akteur-UUID (oder null). */
export async function getAktuellerAkteur(client: DbClient): Promise<string | null> {
  try {
    const { data } = await client.auth.getUser()
    return data?.user?.id ?? null
  } catch {
    return null
  }
}

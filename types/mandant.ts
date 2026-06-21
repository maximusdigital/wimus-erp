/** Aktiver Mandant (Marke) – clientseitig nutzbarer Typ ohne Server-Imports. */
export type Mandant = {
  id: string
  name: string
  kuerzel: string | null
  farbe: string | null
}

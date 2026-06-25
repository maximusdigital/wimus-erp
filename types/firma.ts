/** Firma (Org-Ebene 2) – clientseitig nutzbarer Typ ohne Server-Imports. */
export type Firma = {
  id: string
  name: string
  kuerzel: string | null
  rechtsform: string | null
}

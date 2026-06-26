/**
 * E-Rechnungs-Weiche (Spec 0002 Decision 2026-06-25): ZUGFeRD/XRechnung-XML wird
 * deterministisch geparst (confidence 1.0), die KI/OCR übersprungen.
 *
 * Unterstützt die zwei deutschen Standardsyntaxen:
 *  - CII  (UN/CEFACT CrossIndustryInvoice) – ZUGFeRD & XRechnung-CII
 *  - UBL  (OASIS Invoice)                  – XRechnung-UBL
 *
 * Dependency-frei: gezielte Extraktion über Element-Local-Names (Namespace-
 * Präfix egal). Kein voller XML-Parser – nur die für die Kontierung nötigen
 * Felder. Unstrukturierte PDFs (kein erkanntes Wurzelelement) → null → OCR-Pfad.
 */

export type ErechnungFormat = "cii" | "ubl"

export type ErechnungDaten = {
  format: ErechnungFormat
  belegnummer: string | null
  belegdatum: string | null // ISO YYYY-MM-DD
  netto: number | null
  ust_betrag: number | null
  brutto: number | null
  lieferant_name: string | null
  lieferant_ustid: string | null
  /** Deterministischer Parse → volle Confidence. */
  confidence: 1.0
}

/** Erkennt, ob der Inhalt eine E-Rechnung (CII/UBL) ist. */
export function istErechnung(content: string | null | undefined): boolean {
  return erkenneFormat(content) !== null
}

function erkenneFormat(
  content: string | null | undefined
): ErechnungFormat | null {
  if (!content) return null
  if (/CrossIndustryInvoice/.test(content)) return "cii"
  // UBL-Rechnung: <Invoice> mit UBL-Namespace.
  if (
    /<(?:[\w.-]+:)?Invoice[\s>]/.test(content) &&
    /oasis:names:specification:ubl/.test(content)
  ) {
    return "ubl"
  }
  return null
}

/** Erstes Vorkommen eines Leaf-Elements per Local-Name (Präfix ignoriert). */
function tag(xml: string, name: string): string | null {
  const re = new RegExp(
    `<(?:[\\w.-]+:)?${name}\\b[^>]*>([\\s\\S]*?)</(?:[\\w.-]+:)?${name}>`,
    "i"
  )
  const m = xml.match(re)
  return m ? m[1].trim() : null
}

/** Inhalt eines (umschließenden) Block-Elements per Local-Name. */
function block(xml: string, name: string): string | null {
  const re = new RegExp(
    `<(?:[\\w.-]+:)?${name}\\b[^>]*>([\\s\\S]*?)</(?:[\\w.-]+:)?${name}>`,
    "i"
  )
  const m = xml.match(re)
  return m ? m[1] : null
}

function zahl(v: string | null): number | null {
  if (v == null || v.trim() === "") return null
  const n = Number(v.trim())
  return Number.isFinite(n) ? n : null
}

/** CII-Datum "102" = YYYYMMDD → ISO. UBL liefert bereits ISO. */
function isoDatum(v: string | null): string | null {
  if (!v) return null
  const t = v.trim()
  if (/^\d{8}$/.test(t)) return `${t.slice(0, 4)}-${t.slice(4, 6)}-${t.slice(6, 8)}`
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t
  return null
}

function parseCii(xml: string): ErechnungDaten {
  const doc = block(xml, "ExchangedDocument") ?? xml
  const seller = block(xml, "SellerTradeParty")
  // USt-ID liegt unter SpecifiedTaxRegistration (schemeID="VA"), nicht die erste ID.
  const sellerVat = seller ? block(seller, "SpecifiedTaxRegistration") : null

  return {
    format: "cii",
    belegnummer: tag(doc, "ID"),
    belegdatum: isoDatum(tag(doc, "DateTimeString")),
    netto: zahl(tag(xml, "TaxBasisTotalAmount")),
    ust_betrag: zahl(tag(xml, "TaxTotalAmount")),
    brutto: zahl(tag(xml, "GrandTotalAmount")),
    lieferant_name: seller ? tag(seller, "Name") : null,
    lieferant_ustid: sellerVat ? tag(sellerVat, "ID") : null,
    confidence: 1.0,
  }
}

function parseUbl(xml: string): ErechnungDaten {
  const supplier = block(xml, "AccountingSupplierParty")

  return {
    format: "ubl",
    belegnummer: tag(xml, "ID"),
    belegdatum: isoDatum(tag(xml, "IssueDate")),
    netto: zahl(tag(xml, "TaxExclusiveAmount")),
    ust_betrag: zahl(tag(xml, "TaxAmount")),
    brutto: zahl(tag(xml, "TaxInclusiveAmount") ?? tag(xml, "PayableAmount")),
    lieferant_name: supplier
      ? (tag(supplier, "RegistrationName") ?? tag(supplier, "Name"))
      : null,
    lieferant_ustid: supplier ? tag(supplier, "CompanyID") : null,
    confidence: 1.0,
  }
}

/**
 * Parst eine E-Rechnung. Gibt null zurück, wenn kein E-Rechnungsformat erkannt
 * wird (→ Aufrufer schickt den Beleg in den OCR-Pfad).
 */
export function parseErechnung(
  content: string | null | undefined
): ErechnungDaten | null {
  const format = erkenneFormat(content)
  if (!format || !content) return null
  return format === "cii" ? parseCii(content) : parseUbl(content)
}

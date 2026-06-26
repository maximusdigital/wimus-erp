import { describe, expect, it } from "vitest"

import { istErechnung, parseErechnung } from "@/lib/utils/erechnung"

// Spec 0002 / 60_tests – E-Rechnungs-Weiche
// Verkürzte, aber strukturtreue CII- (ZUGFeRD/XRechnung) und UBL-Beispiele.

const CII = `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocument>
    <ram:ID>RE-2025-0042</ram:ID>
    <ram:IssueDateTime><udt:DateTimeString format="102">20260315</udt:DateTimeString></ram:IssueDateTime>
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:ID>GLN-400</ram:ID>
        <ram:Name>Stadtwerke Stuttgart GmbH</ram:Name>
        <ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">DE147802687</ram:ID></ram:SpecifiedTaxRegistration>
      </ram:SellerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:TaxBasisTotalAmount>100.00</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="EUR">19.00</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>119.00</ram:GrandTotalAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`

const UBL = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:ID>RG-2026-0007</cbc:ID>
  <cbc:IssueDate>2026-04-01</cbc:IssueDate>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>Reinigung Müller e.K.</cbc:RegistrationName>
        <cbc:CompanyID>DE811111111</cbc:CompanyID>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:LegalMonetaryTotal>
    <cbc:TaxExclusiveAmount currencyID="EUR">200.00</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="EUR">238.00</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="EUR">238.00</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="EUR">38.00</cbc:TaxAmount>
  </cac:TaxTotal>
</Invoice>`

describe("istErechnung", () => {
  it("erkennt CII", () => expect(istErechnung(CII)).toBe(true))
  it("erkennt UBL", () => expect(istErechnung(UBL)).toBe(true))
  it("unstrukturiertes PDF/Text → false (OCR-Pfad)", () => {
    expect(istErechnung("Rechnung Nr. 5 über 119 EUR brutto")).toBe(false)
    expect(istErechnung(null)).toBe(false)
  })
})

describe("parseErechnung CII", () => {
  const d = parseErechnung(CII)!
  it("Format + Confidence 1.0", () => {
    expect(d.format).toBe("cii")
    expect(d.confidence).toBe(1.0)
  })
  it("Belegnummer aus ExchangedDocument (nicht Seller-ID)", () => {
    expect(d.belegnummer).toBe("RE-2025-0042")
  })
  it("Datum 102 (YYYYMMDD) → ISO", () => {
    expect(d.belegdatum).toBe("2026-03-15")
  })
  it("Beträge", () => {
    expect(d.netto).toBe(100)
    expect(d.ust_betrag).toBe(19)
    expect(d.brutto).toBe(119)
  })
  it("Lieferant + USt-ID aus Steuerregistrierung", () => {
    expect(d.lieferant_name).toBe("Stadtwerke Stuttgart GmbH")
    expect(d.lieferant_ustid).toBe("DE147802687")
  })
})

describe("parseErechnung UBL", () => {
  const d = parseErechnung(UBL)!
  it("Format", () => expect(d.format).toBe("ubl"))
  it("Belegnummer + Datum (bereits ISO)", () => {
    expect(d.belegnummer).toBe("RG-2026-0007")
    expect(d.belegdatum).toBe("2026-04-01")
  })
  it("Beträge (netto/ust/brutto)", () => {
    expect(d.netto).toBe(200)
    expect(d.ust_betrag).toBe(38)
    expect(d.brutto).toBe(238)
  })
  it("Lieferant + USt-ID", () => {
    expect(d.lieferant_name).toBe("Reinigung Müller e.K.")
    expect(d.lieferant_ustid).toBe("DE811111111")
  })
})

it("kein E-Rechnungsformat → null", () => {
  expect(parseErechnung("nur text")).toBeNull()
})

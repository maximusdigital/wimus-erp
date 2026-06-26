import { describe, expect, it, vi } from "vitest"

import { verarbeiteBeleg } from "@/lib/fibu/beleg-pipeline"
import type { Kontierungsregel } from "@/lib/utils/fibu"
import type { BelegExtraktion } from "@/lib/integrations/mistral"

const HEUTE = "2026-06-26"

const REGELN: Kontierungsregel[] = [
  { id: "r1", match: "reinigung", soll_konto: "4250", ust_satz: 19, steuerschluessel: "9", prioritaet: 10 },
  { id: "r2", match: "stadtwerke", soll_konto: "4240", ust_satz: 19, steuerschluessel: "9", prioritaet: 10 },
]

const CII = `<rsm:CrossIndustryInvoice xmlns:rsm="x">
  <rsm:ExchangedDocument><ram:ID>RE-1</ram:ID>
    <ram:IssueDateTime><udt:DateTimeString format="102">20260315</udt:DateTimeString></ram:IssueDateTime>
  </rsm:ExchangedDocument>
  <ram:SellerTradeParty><ram:Name>Stadtwerke Stuttgart</ram:Name>
    <ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">DE147802687</ram:ID></ram:SpecifiedTaxRegistration>
  </ram:SellerTradeParty>
  <ram:TaxBasisTotalAmount>100.00</ram:TaxBasisTotalAmount>
  <ram:TaxTotalAmount>19.00</ram:TaxTotalAmount>
  <ram:GrandTotalAmount>119.00</ram:GrandTotalAmount>
</rsm:CrossIndustryInvoice>`

const ocrSpy = vi.fn(async () => "OCR-TEXT")

describe("verarbeiteBeleg – E-Rechnungs-Pfad", () => {
  it("parst ohne OCR/KI, confidence 1.0, kontiert über Lieferant", async () => {
    const ocr = vi.fn(async () => "")
    const extrahiere = vi.fn(async () => ({}) as BelegExtraktion)
    const r = await verarbeiteBeleg(
      { content: CII },
      { heute: HEUTE, regeln: REGELN },
      { ocr, extrahiere }
    )
    expect(ocr).not.toHaveBeenCalled()
    expect(extrahiere).not.toHaveBeenCalled()
    expect(r.quelle).toBe("erechnung")
    expect(r.confidence_ocr).toBe(1)
    expect(r.brutto).toBe(119)
    expect(r.soll_konto).toBe("4240") // Stadtwerke → r2
    expect(r.review_flag).toBe(false)
  })

  it("Betrag über Schwelle → kein Auto-Buchen, freigabe_offen", async () => {
    const big = CII.replace(/119\.00/, "5000.00").replace(/100\.00/, "4201.68").replace(/19\.00/, "798.32")
    const r = await verarbeiteBeleg(
      { content: big },
      { heute: HEUTE, regeln: REGELN },
      { ocr: ocrSpy, extrahiere: vi.fn() as never }
    )
    expect(r.auto_buchbar).toBe(false)
    expect(r.status).toBe("freigabe_offen")
  })
})

describe("verarbeiteBeleg – OCR-Pfad (KI gemockt)", () => {
  const guteExtraktion: BelegExtraktion = {
    belegnummer: "RG-7",
    belegdatum: "2026-02-01",
    netto: 100,
    ust_betrag: 19,
    ust_satz: 19,
    brutto: 119,
    lieferant_name: "Müller Reinigung",
    lieferant_ustid: null,
    iban: null,
    gewerk: "Reinigung",
    k1: "AS125",
    confidence: 0.97,
  }

  it("OCR → Extraktion → Kontierung (Gewerk Reinigung → 4250)", async () => {
    const ocr = vi.fn(async () => "Rechnung Müller Reinigung 119 EUR")
    const extrahiere = vi.fn(async () => guteExtraktion)
    const r = await verarbeiteBeleg(
      { dataUrl: "data:image/png;base64,AAAA" },
      { heute: HEUTE, regeln: REGELN },
      { ocr, extrahiere }
    )
    expect(ocr).toHaveBeenCalledOnce()
    expect(r.quelle).toBe("ocr")
    expect(r.soll_konto).toBe("4250")
    expect(r.review_flag).toBe(false) // keine Defekte
    // OCR-Confidence (0.9) < Auto-Schwelle (0.95) → Mensch bestätigt (Suggest not Autobook)
    expect(r.auto_buchbar).toBe(false)
    expect(r.status).toBe("freigabe_offen")
  })

  it("unstimmige Beträge → review_flag, nicht auto", async () => {
    const ocr = vi.fn(async () => "text")
    const extrahiere = vi.fn(async () => ({ ...guteExtraktion, ust_betrag: 7 }))
    const r = await verarbeiteBeleg(
      { dataUrl: "data:image/png;base64,AAAA" },
      { heute: HEUTE, regeln: REGELN },
      { ocr, extrahiere }
    )
    expect(r.review_flag).toBe(true)
    expect(r.review_gruende.join(" ")).toMatch(/USt|brutto/)
  })

  it("fehlende Kontierungsregel → review_flag", async () => {
    const ocr = vi.fn(async () => "text")
    const extrahiere = vi.fn(async () => ({ ...guteExtraktion, gewerk: "Notarkosten", lieferant_name: "Notar X" }))
    const r = await verarbeiteBeleg(
      { dataUrl: "data:image/png;base64,AAAA" },
      { heute: HEUTE, regeln: REGELN },
      { ocr, extrahiere }
    )
    expect(r.soll_konto).toBeNull()
    expect(r.review_flag).toBe(true)
  })

  it("OCR ohne Text → review_flag", async () => {
    const ocr = vi.fn(async () => "")
    const extrahiere = vi.fn(async () => ({ ...guteExtraktion, confidence: 0 }))
    const r = await verarbeiteBeleg(
      { dataUrl: "data:application/pdf;base64,AAAA" },
      { heute: HEUTE, regeln: REGELN },
      { ocr, extrahiere }
    )
    expect(r.review_flag).toBe(true)
    expect(r.review_gruende).toContain("OCR ohne Text")
  })
})

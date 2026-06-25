"use client"

import { useRouter } from "next/navigation"
import { ChevronLeft, Printer } from "lucide-react"

import { Button } from "@/components/ui/button"

/**
 * A4-Druck-Layout (Design 0001 / 40_design). Legt sich als weiße Seite über die
 * App; die Toolbar wird im Druck ausgeblendet (print:hidden). Für Reports/PDFs.
 */
export function PrintLayout({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  const router = useRouter()
  return (
    <div className="fixed inset-0 z-[100] overflow-auto bg-white text-[#111] print:static">
      <div className="flex items-center justify-between gap-2 border-b bg-muted/40 px-4 py-2 print:hidden">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ChevronLeft />
          <span>Zurück</span>
        </Button>
        <span className="text-sm font-medium text-foreground">{title}</span>
        <Button size="sm" onClick={() => window.print()}>
          <Printer />
          <span>Drucken / PDF</span>
        </Button>
      </div>
      <div className="mx-auto max-w-[800px] p-8 text-sm print:p-0">{children}</div>
    </div>
  )
}

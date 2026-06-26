"use client"

import { Printer } from "lucide-react"

import { Button } from "@/components/ui/button"

/** Löst den Browser-Druckdialog aus (PDF via „Als PDF speichern"). */
export function PrintButton({ label = "Drucken / PDF" }: { label?: string }) {
  return (
    <Button variant="outline" onClick={() => window.print()} className="print:hidden">
      <Printer />
      <span>{label}</span>
    </Button>
  )
}

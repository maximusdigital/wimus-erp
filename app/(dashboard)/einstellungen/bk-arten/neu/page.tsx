import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import { BkArtForm } from "@/components/einstellungen/bk-art-form"

export const metadata = { title: "Neue BK-Kostenart" }

export default function NeueBkArtPage() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <Link
          href="/einstellungen/bk-arten"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Zurück zu BK-Kostenarten
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">
          Neue BK-Kostenart
        </h1>
      </div>
      <BkArtForm />
    </div>
  )
}

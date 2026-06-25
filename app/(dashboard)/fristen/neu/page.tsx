import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import { FristForm } from "@/components/fristen/frist-form"

export const metadata = {
  title: "Neue Frist",
}

export default function NeueFristPage() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <Link
          href="/fristen"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Zurück zu Fristen
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">Neue Frist</h1>
        <p className="text-muted-foreground text-sm">
          Frist erfassen und Erinnerungen konfigurieren.
        </p>
      </div>

      <div className="max-w-4xl">
        <FristForm />
      </div>
    </div>
  )
}

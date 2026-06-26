import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import { GesellschafterForm } from "@/components/fibu/gesellschafter-form"

export const metadata = {
  title: "Neuer Gesellschafter",
}

export default function NeuerGesellschafterPage() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <Link
          href="/fibu/gesellschafter"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Zurück zu Gesellschaftern
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">
          Neuer Gesellschafter
        </h1>
        <p className="text-muted-foreground text-sm">
          Gesellschafter erfassen – Beteiligungen werden danach im Detail
          zugeordnet.
        </p>
      </div>

      <div className="max-w-4xl">
        <GesellschafterForm />
      </div>
    </div>
  )
}

import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import { ObjektForm } from "@/components/objekte/objekt-form"

export const metadata = {
  title: "Neues Objekt",
}

export default function NeuesObjektPage() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <Link
          href="/objekte"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Zurück zu Objekte
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">
          Neues Objekt
        </h1>
        <p className="text-muted-foreground text-sm">
          Stammdaten für ein neues Objekt erfassen.
        </p>
      </div>

      <div className="max-w-4xl">
        <ObjektForm />
      </div>
    </div>
  )
}

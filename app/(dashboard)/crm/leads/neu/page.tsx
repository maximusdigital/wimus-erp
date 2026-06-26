import { LeadForm } from "@/components/crm/lead-form"

export const metadata = { title: "Neuer Lead" }

export default function NeuerLeadPage() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Lead erfassen</h1>
        <p className="text-sm text-muted-foreground">
          Schlanke Anfrage – Triage erfolgt in der Inbox.
        </p>
      </div>
      <LeadForm />
    </div>
  )
}

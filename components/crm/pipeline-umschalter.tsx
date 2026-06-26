"use client"

import { useRouter } from "next/navigation"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Pipeline } from "@/types/crm"

export function PipelineUmschalter({
  pipelines,
  aktivId,
}: {
  pipelines: Pipeline[]
  aktivId: string
}) {
  const router = useRouter()
  return (
    <Select value={aktivId} onValueChange={(v) => router.push(`/crm?pipeline=${v}`)}>
      <SelectTrigger className="w-56">
        <SelectValue>
          {(v) => pipelines.find((p) => p.id === v)?.name ?? "Pipeline"}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {pipelines.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {p.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

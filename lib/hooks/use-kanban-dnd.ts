"use client"

import * as React from "react"
import { arrayMove } from "@dnd-kit/sortable"
import type { DragEndEvent, DragOverEvent, DragStartEvent } from "@dnd-kit/core"

/**
 * Multi-Container-Sortable-Logik für Kanban-Boards (@dnd-kit).
 * Verwaltet `items` (Spalte → geordnete IDs) lokal für ruckelfreies Drag und ruft
 * `onPersist` genau einmal je Drop (Spaltenwechsel + neue Reihenfolge der Zielspalte).
 *
 * Datenagnostisch: arbeitet nur mit String-IDs + Spalten-Keys; das Rendering
 * (SortableContext/Cards) und die Persistenz liegen beim jeweiligen Board.
 */
export type KanbanItems = Record<string, string[]>

export function useKanbanDnd({
  containers,
  initialItems,
  isLocked,
  onPersist,
}: {
  containers: string[]
  initialItems: KanbanItems
  isLocked?: (id: string) => boolean
  onPersist: (args: { id: string; from: string; to: string; orderedIds: string[] }) => void
}) {
  const [items, setItems] = React.useState<KanbanItems>(initialItems)
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const itemsRef = React.useRef(items)
  const fromRef = React.useRef<string | null>(null)

  // itemsRef immer synchron zum State halten (für synchrone Berechnung in onDragEnd).
  const setBoth = React.useCallback((next: KanbanItems) => {
    itemsRef.current = next
    setItems(next)
  }, [])

  // Server-Daten geändert (neue Props) → lokalen Stand übernehmen.
  const initKey = React.useMemo(() => JSON.stringify(initialItems), [initialItems])
  React.useEffect(() => {
    itemsRef.current = initialItems
    setItems(initialItems)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initKey])

  const findContainer = React.useCallback(
    (id: string, src: KanbanItems): string | null =>
      containers.find((c) => src[c]?.includes(id)) ?? (containers.includes(id) ? id : null),
    [containers]
  )

  function onDragStart(e: DragStartEvent) {
    const id = String(e.active.id)
    if (isLocked?.(id)) return
    fromRef.current = findContainer(id, itemsRef.current)
    setActiveId(id)
  }

  function onDragOver(e: DragOverEvent) {
    const { active, over } = e
    if (!over) return
    const a = String(active.id)
    const o = String(over.id)
    const prev = itemsRef.current
    const ac = findContainer(a, prev)
    const oc = findContainer(o, prev)
    if (!ac || !oc || ac === oc) return
    const aItems = prev[ac] ?? []
    const oItems = prev[oc] ?? []
    const overIsContainer = containers.includes(o)
    const newIndex = overIsContainer ? oItems.length : Math.max(0, oItems.indexOf(o))
    setBoth({
      ...prev,
      [ac]: aItems.filter((x) => x !== a),
      [oc]: [...oItems.slice(0, newIndex), a, ...oItems.slice(newIndex)],
    })
  }

  function onDragEnd(e: DragEndEvent) {
    const a = String(e.active.id)
    const from = fromRef.current
    setActiveId(null)
    fromRef.current = null
    if (!e.over || !from) return
    const o = String(e.over.id)
    const prev = itemsRef.current
    const oc = findContainer(a, prev)
    if (!oc) return
    const list = prev[oc] ?? []
    const oldIndex = list.indexOf(a)
    const overIsContainer = containers.includes(o)
    const newIndex = overIsContainer ? list.length - 1 : list.indexOf(o)
    const finalList =
      oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex
        ? arrayMove(list, oldIndex, newIndex)
        : list
    setBoth({ ...prev, [oc]: finalList })
    onPersist({ id: a, from, to: oc, orderedIds: finalList })
  }

  return { items, activeId, onDragStart, onDragOver, onDragEnd }
}

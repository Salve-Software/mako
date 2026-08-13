import { useInput } from 'ink'
import { useCallback, useState } from 'react'
import type { FilterGroup } from '../components/filter-bar/index.js'

interface UseFilterChipsParams {
  groups: FilterGroup[]
  focusedGroupIndex: number
  focusedChipIndex: number
  isActive: boolean
}

interface UseFilterChipsResult {
  active: Record<string, Set<string>>
  toggle: (groupId: string, chipId: string) => void
}

/**
 * Owns which chips are toggled on per filter group. Focus position comes
 * from useSearchFilter (single source of truth for zone/position) — this
 * hook only reacts to Enter/Space to flip the chip under that focus, plus
 * `toggle()` for a mouse click on an arbitrary chip regardless of focus.
 */
export function useFilterChips({ groups, focusedGroupIndex, focusedChipIndex, isActive }: UseFilterChipsParams): UseFilterChipsResult {
  const [active, setActive] = useState<Record<string, Set<string>>>({})

  const toggle = useCallback((groupId: string, chipId: string) => {
    setActive((prev) => {
      const next = { ...prev }
      const set = new Set(next[groupId] ?? [])
      if (set.has(chipId)) set.delete(chipId)
      else set.add(chipId)
      next[groupId] = set
      return next
    })
  }, [])

  useInput((input, key) => {
    if (!key.return && input !== ' ') return

    const group = groups[focusedGroupIndex]
    const chip = group?.chips[focusedChipIndex]
    if (!group || !chip) return

    toggle(group.id, chip.id)
  }, { isActive })

  return { active, toggle }
}

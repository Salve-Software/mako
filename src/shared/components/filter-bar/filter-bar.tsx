/** @jsxRuntime automatic */
/** @jsxImportSource react */
import { Box, Text } from 'ink'
import { Clickable } from '../clickable/index.js'

export interface FilterChip {
  id: string
  label: string
  color?: string
}

export interface FilterGroup {
  id: string
  label: string
  chips: FilterChip[]
}

interface FilterBarProps {
  groups: FilterGroup[]
  active: Record<string, Set<string>>
  focusedGroupIndex: number
  focusedChipIndex: number
  onToggle?: (groupId: string, chipId: string) => void
}

export function FilterBar({ groups, active, focusedGroupIndex, focusedChipIndex, onToggle }: FilterBarProps) {
  return (
    <Box flexDirection="column">
      {groups.map((group, groupIndex) =>
        <Box key={group.id} gap={1}>
          <Text bold color="gray">{group.label.padEnd(7)}</Text>
          {group.chips.map((chip, chipIndex) => {
            const isOn = active[group.id]?.has(chip.id) ?? false
            const isFocused = groupIndex === focusedGroupIndex && chipIndex === focusedChipIndex
            const label = (
              <Text
                color={isOn ? chip.color ?? 'cyan' : 'gray'}
                dimColor={!isOn}
                inverse={isFocused}
              >
                {isOn ? '◉' : '○'} {chip.label}
              </Text>
            )
            return onToggle
              ?
              <Clickable key={chip.id} onClick={() => onToggle(group.id, chip.id)}>
                {label}
              </Clickable>
              : <Box key={chip.id}>{label}</Box>
          })}
        </Box>
      )}
    </Box>
  )
}

/** @jsxRuntime automatic */
/** @jsxImportSource react */
import { Box, Text } from 'ink'
import type { DOMElement } from 'ink'
import { forwardRef } from 'react'
import type { LogEvent } from '@salve-software/salvetron-types'
import { LogRow } from '../../../../../shared/components/log-row/index.js'

interface LogListProps {
  logs: LogEvent[]
  visibleRows: number
  selectedIndex: number
  scrollOffset: number
  showHeader?: boolean
  maxMessageWidth?: number
}

export const LogList = forwardRef<DOMElement, LogListProps>(function LogList(
  { logs, visibleRows, selectedIndex, scrollOffset, showHeader = true, maxMessageWidth }, ref,
) {
  const visible = logs.slice(scrollOffset, scrollOffset + visibleRows)

  return (
    <Box ref={ref} flexDirection="column">
      {showHeader ? <Text color="gray" dimColor>{logs.length} logs · ↑↓ navigate · click to select</Text> : null}
      {visible.map((log, i) => {
        const absoluteIndex = scrollOffset + i
        const isSelected = absoluteIndex === selectedIndex
        return (
          <Box key={i} gap={1}>
            <Text color="cyan">{isSelected ? '▶' : ' '}</Text>
            <LogRow log={log} maxMessageWidth={maxMessageWidth} />
          </Box>
        )
      })}
    </Box>
  )
})

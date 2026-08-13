/** @jsxRuntime automatic */
/** @jsxImportSource react */
import { Box, Text } from 'ink'
import type { DOMElement } from 'ink'
import { forwardRef } from 'react'
import type { NativeLogEvent } from '@salve-software/salvetron-types'
import { LogRow } from '../../../../../shared/components/log-row/index.js'

interface NativeLogListProps {
  logs: NativeLogEvent[]
  visibleRows: number
  selectedIndex: number
  scrollOffset: number
  showHeader?: boolean
  maxMessageWidth?: number
}

export const NativeLogList = forwardRef<DOMElement, NativeLogListProps>(function NativeLogList(
  { logs, visibleRows, selectedIndex, scrollOffset, showHeader = true, maxMessageWidth }, ref,
) {
  const visible = logs.slice(scrollOffset, scrollOffset + visibleRows)

  return (
    <Box ref={ref} flexDirection="column">
      {showHeader ? <Text color="gray" dimColor>{logs.length} native logs · ↑↓ navigate · click to select</Text> : null}
      {visible.map((log, i) => {
        const absoluteIndex = scrollOffset + i
        const isSelected = absoluteIndex === selectedIndex
        return (
          <Box key={i} gap={1}>
            <Text color="cyan">{isSelected ? '▶' : ' '}</Text>
            <Text color="gray" dimColor>[{log.source}]</Text>
            <LogRow log={log} maxMessageWidth={maxMessageWidth} />
          </Box>
        )
      })}
    </Box>
  )
})

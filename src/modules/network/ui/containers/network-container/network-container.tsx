/** @jsxRuntime automatic */
/** @jsxImportSource react */
import { Box, Text } from 'ink'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useTerminalSize } from '../../../../../shared/hooks/use-terminal-size.js'
import { useListNavigation } from '../../../../../shared/hooks/use-list-navigation.js'
import { useDetailPanel } from '../../../../../shared/hooks/use-detail-panel.js'
import { useSearchFilter } from '../../../../../shared/hooks/use-search-filter.js'
import { useFilterChips } from '../../../../../shared/hooks/use-filter-chips.js'
import { useClearConfirm } from '../../../../../shared/hooks/use-clear-confirm.js'
import { SearchBar } from '../../../../../shared/components/search-bar/index.js'
import { FilterBar } from '../../../../../shared/components/filter-bar/index.js'
import { useNetworkLogs, useNetworkStore } from '../../../store/network.store.js'
import { useSelectedDeviceId } from '../../../../../shared/store/device.store.js'
import { useIsDeviceSelectorOpen } from '../../../../../shared/store/device-selector.store.js'
import { NETWORK_FILTER_GROUPS, matchesNetworkLog } from '../../../library/filters.js'
import { NetworkTableHeader } from '../../components/network-table-header/index.js'
import { NetworkRow } from '../../components/network-row/index.js'
import { NetworkDetail } from '../../components/network-detail/index.js'
import { formatBody, formatPlainBody } from '../../../../../shared/utils/format-body.js'
import { buildCurlCommand } from '../../../../../shared/utils/build-curl-command.js'
import type { NetworkLog } from '@salve-software/salvetron-types'

const OVERHEAD_ROWS = 7
const DETAIL_FIXED_ROWS = 5
const MIN_LIST_ROWS = 4
const BAR_BORDER_ROWS = 2
const BAR_CHROME_COLS = 4
// Ink doesn't clip overflow by default: if computed content height ever
// exactly equals (or exceeds) the terminal's row count, the terminal
// scrolls to accommodate the last line, which silently shifts every mouse
// coordinate's row-1 reference (see getAbsoluteLayout). A fixed row-count
// budget like OVERHEAD_ROWS is inherently an estimate, so this margin keeps
// a safety buffer rather than relying on that estimate being exact.
const SAFETY_MARGIN_ROWS = 2

export function NetworkContainer() {
  const [cols, rows] = useTerminalSize()
  const allLogs = useNetworkLogs()
  const selectedDeviceId = useSelectedDeviceId()
  const logs = useMemo(
    () => selectedDeviceId ? allLogs.filter((log) => log.deviceId === selectedDeviceId) : allLogs,
    [allLogs, selectedDeviceId],
  )

  const isDeviceSelectorOpen = useIsDeviceSelectorOpen()
  const { isOpen, query, focusedGroupIndex, focusedChipIndex } = useSearchFilter({
    groups: NETWORK_FILTER_GROUPS,
    isActive: !isDeviceSelectorOpen,
  })
  const { active, toggle } = useFilterChips({
    groups: NETWORK_FILTER_GROUPS,
    focusedGroupIndex,
    focusedChipIndex,
    isActive: isOpen && focusedGroupIndex >= 0,
  })
  const { pending: clearPending } = useClearConfirm({
    onClear: () => useNetworkStore.getState().clear(),
    isActive: !isOpen && !isDeviceSelectorOpen,
  })

  const filtered = useMemo(
    () => logs.filter((log) => matchesNetworkLog(log, query, active)),
    [logs, query, active],
  )

  const barRows = isOpen ? BAR_BORDER_ROWS + 1 + NETWORK_FILTER_GROUPS.length + 1 : 0
  const clearRows = clearPending ? 1 : 0
  const availableRows = rows - OVERHEAD_ROWS - barRows - clearRows - SAFETY_MARGIN_ROWS
  const detailHeight = Math.max(DETAIL_FIXED_ROWS + 2, availableRows - MIN_LIST_ROWS)
  const bodyVisibleRows = detailHeight - DETAIL_FIXED_ROWS

  const bodyLinesRef = useRef<string[]>([])
  const selectedLogRef = useRef<NetworkLog | null>(null)

  const onCopyBody = useCallback(() => {
    const log = selectedLogRef.current
    return log ? formatPlainBody(log.responseBody) : ''
  }, [])
  const onCopyExtra = useCallback(() => {
    const log = selectedLogRef.current
    return log ? buildCurlCommand(log) : ''
  }, [])

  const { detailOpen, detailScrollOffset, resetDetailScroll, copyFeedback, copyBody, copyExtra, detailRef, openDetail } = useDetailPanel({
    linesRef: bodyLinesRef,
    visibleRows: bodyVisibleRows,
    scrollStep: 5,
    isActive: !isOpen && !isDeviceSelectorOpen,
    onCopyBody,
    onCopyExtra,
  })

  const listRows = detailOpen
    ? Math.max(MIN_LIST_ROWS, availableRows - detailHeight)
    : availableRows

  const { selectedIndex, scrollOffset, listRef } = useListNavigation({
    count: filtered.length,
    visibleRows: listRows,
    isActive: !isOpen && !isDeviceSelectorOpen,
    headerRows: 1,
    onRowClick: openDetail,
  })

  const selectedLog = filtered[selectedIndex] ?? null
  const bodyLines = formatBody(selectedLog?.responseBody)
  bodyLinesRef.current = bodyLines
  selectedLogRef.current = selectedLog

  useEffect(() => {
    resetDetailScroll()
  }, [selectedIndex, resetDetailScroll])

  const visible = filtered.slice(scrollOffset, scrollOffset + listRows)

  return (
    <Box flexDirection="column">
      {isOpen
        ?
        <Box flexDirection="column" borderStyle="single" borderColor="cyan" paddingX={1}>
          <SearchBar query={query} width={cols - BAR_CHROME_COLS} resultCount={filtered.length} totalCount={logs.length} />
          <FilterBar
            groups={NETWORK_FILTER_GROUPS}
            active={active}
            focusedGroupIndex={focusedGroupIndex}
            focusedChipIndex={focusedChipIndex}
            onToggle={toggle}
          />
        </Box>
        : null
      }
      <Box ref={listRef} flexGrow={1} flexDirection="column">
        <NetworkTableHeader />
        {visible.map((log, i) => {
          const absoluteIndex = scrollOffset + i
          return (
            <NetworkRow
              key={log.requestId}
              log={log}
              urlMaxWidth={cols - 30}
              isSelected={absoluteIndex === selectedIndex}
            />
          )
        })}
      </Box>
      <Text color="whiteBright" dimColor>/ search · x clear</Text>
      {clearPending ? <Text color="yellow">⚠ press x again to clear · esc to cancel</Text> : null}
      {detailOpen && selectedLog
        ?
        <NetworkDetail
          ref={detailRef}
          log={selectedLog}
          width={cols}
          bodyLines={bodyLines}
          bodyScrollOffset={detailScrollOffset}
          bodyVisibleRows={bodyVisibleRows}
          copyFeedback={copyFeedback}
          onCopy={copyBody}
          onCopyCurl={copyExtra}
        />
        : null
      }
    </Box>
  )
}

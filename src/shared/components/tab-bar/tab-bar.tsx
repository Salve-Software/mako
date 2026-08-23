/** @jsxRuntime automatic */
/** @jsxImportSource react */
import { Box, Text } from 'ink'
import { Clickable } from '../clickable/index.js'
import type { Tab } from '../../../app.js'

const LABELS: Record<Tab, string> = {
  dashboard: '1 Dashboard',
  'js-logs': '2 JS Logs',
  network: '3 Network',
  native: '4 Native',
}

interface TabBarProps {
  active: Tab
  onSelect: (tab: Tab) => void
}

export function TabBar({ active, onSelect }: TabBarProps) {
  return (
    <Box
      borderStyle="single"
      borderBottom={true}
      marginTop={1}
      borderColor="gray"
      borderTop={false}
      borderLeft={false}
      borderRight={false}
      gap={2}
      paddingX={1}
    >
      {(Object.keys(LABELS) as Tab[]).map((tab) =>
        <Clickable key={tab} onClick={() => onSelect(tab)}>
          <Text bold={tab === active} color={tab === active ? 'cyan' : 'gray'}>
            {LABELS[tab]}
          </Text>
        </Clickable>
      )}
      <Text color="gray" dimColor>  Tab to switch · click a tab</Text>
    </Box>
  )
}

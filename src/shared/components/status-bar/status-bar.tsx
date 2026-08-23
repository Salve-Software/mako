/** @jsxRuntime automatic */
/** @jsxImportSource react */
import { Box, Text } from 'ink'
import { useSelectedDevice, useConnectedDeviceCount } from '../../store/device.store.js'
import { useDeviceSelectorStore } from '../../store/device-selector.store.js'
import { Clickable } from '../clickable/index.js'

export function StatusBar() {
  const selected = useSelectedDevice()
  const connectedCount = useConnectedDeviceCount()
  const port = process.env.SALVETRON_PORT ?? '8765'
  const openDeviceSelector = () => useDeviceSelectorStore.getState().open()

  return (
    <Box
      borderStyle="single"
      borderColor="gray"
      borderTop={true}
      borderBottom={false}
      borderLeft={false}
      borderRight={false}
      paddingX={1}
    >
      {selected
        ?
        <>
          <Text color={selected.connected ? 'green' : 'gray'}>{selected.connected ? '● ' : '○ '}</Text>
          <Text>{selected.device.deviceName} ({selected.device.platform})</Text>
          <Text dimColor>  ·  {connectedCount} device{connectedCount === 1 ? '' : 's'} connected  ·  </Text>
          <Clickable onClick={openDeviceSelector}>
            <Text dimColor underline>d to switch</Text>
          </Clickable>
          <Text dimColor>  ·  port {port}</Text>
        </>
        :
        <>
          <Text color="gray">○ </Text>
          <Text color="gray">Waiting for connection on :{port}</Text>
        </>
      }
    </Box>
  )
}

/** @jsxRuntime automatic */
/** @jsxImportSource react */
import { Box } from 'ink'
import type { ReactNode } from 'react'
import { useClickable } from '../../hooks/use-clickable.js'
import type { MouseEvent } from '../../mouse/types.js'

interface ClickableProps {
  onClick: (event: MouseEvent) => void
  isActive?: boolean
  children: ReactNode
}

/** Wraps `children` in a click-detecting region. See `useClickable` for the hit-test. */
export function Clickable({ onClick, isActive = true, children }: ClickableProps) {
  const ref = useClickable(onClick, { isActive })
  return <Box ref={ref}>{children}</Box>
}

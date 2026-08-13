export type MouseButton = 'left' | 'middle' | 'right' | 'wheel-up' | 'wheel-down' | 'unknown'
export type MouseAction = 'press' | 'release' | 'drag' | 'wheel'

export interface MouseEvent {
  /** 1-based terminal column, matching the SGR mouse protocol. */
  x: number
  /** 1-based terminal row, matching the SGR mouse protocol. */
  y: number
  button: MouseButton
  action: MouseAction
  shift: boolean
  meta: boolean
  ctrl: boolean
}

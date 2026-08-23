import { useInput } from 'ink'
import type { DOMElement } from 'ink'
import { useState, useCallback, useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { copyToClipboard } from '../utils/clipboard.js'
import { useMouseWheel } from './use-mouse-wheel.js'

export interface CopyFeedback {
  kind: 'body' | 'extra'
  success: boolean
}

interface UseDetailPanelParams {
  linesRef: RefObject<string[]>
  visibleRows: number
  scrollStep?: number
  isActive?: boolean
  onCopyBody?: () => string
  onCopyExtra?: () => string
}

export interface UseDetailPanelResult {
  detailOpen: boolean
  detailScrollOffset: number
  resetDetailScroll: () => void
  copyFeedback: CopyFeedback | null
  copyBody: () => void
  copyExtra: () => void
  detailRef: RefObject<DOMElement | null>
  openDetail: () => void
}

const FEEDBACK_TIMEOUT_MS = 1500
type TimerHandle = ReturnType<typeof setTimeout>

export function useDetailPanel({
  linesRef,
  visibleRows,
  scrollStep = 1,
  isActive = true,
  onCopyBody,
  onCopyExtra,
}: UseDetailPanelParams): UseDetailPanelResult {
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailScrollOffset, setDetailScrollOffset] = useState(0)
  const [copyFeedback, setCopyFeedback] = useState<CopyFeedback | null>(null)
  const detailRef = useRef<DOMElement | null>(null)

  const feedbackTimeoutRef = useRef<TimerHandle | undefined>(undefined)

  const resetDetailScroll = useCallback(() => setDetailScrollOffset(0), [])
  const openDetail = useCallback(() => setDetailOpen(true), [])

  const showFeedback = useCallback((kind: CopyFeedback['kind'], success: boolean) => {
    clearTimeout(feedbackTimeoutRef.current)
    setCopyFeedback({ kind, success })
    feedbackTimeoutRef.current = setTimeout(() => {
      setCopyFeedback(null)
      feedbackTimeoutRef.current = undefined
    }, FEEDBACK_TIMEOUT_MS)
  }, [])

  const copyBody = useCallback(() => {
    if (!onCopyBody) return
    const text = onCopyBody()
    if (text.length > 0) showFeedback('body', copyToClipboard(text))
  }, [onCopyBody, showFeedback])

  const copyExtra = useCallback(() => {
    if (!onCopyExtra) return
    const text = onCopyExtra()
    if (text.length > 0) showFeedback('extra', copyToClipboard(text))
  }, [onCopyExtra, showFeedback])

  useEffect(() => {
    if (!detailOpen && copyFeedback) {
      clearTimeout(feedbackTimeoutRef.current)
      feedbackTimeoutRef.current = undefined
      setCopyFeedback(null)
    }
  }, [detailOpen, copyFeedback])

  useEffect(() => () => {
    clearTimeout(feedbackTimeoutRef.current)
  }, [])

  useInput((input, key) => {
    if (key.return) { setDetailOpen(o => !o); setDetailScrollOffset(0) }
    if (key.escape) { setDetailOpen(false) }
    if (input === '[') { setDetailScrollOffset(o => Math.max(0, o - scrollStep)) }
    if (input === ']') {
      const maxOffset = Math.max(0, linesRef.current.length - visibleRows)
      setDetailScrollOffset(o => Math.min(maxOffset, o + scrollStep))
    }
    if (input === 'c' && detailOpen) copyBody()
    if (input === 'u' && detailOpen) copyExtra()
  }, { isActive })

  useMouseWheel((direction) => {
    setDetailScrollOffset((o) => {
      if (direction === 'up') return Math.max(0, o - scrollStep)
      const maxOffset = Math.max(0, linesRef.current.length - visibleRows)
      return Math.min(maxOffset, o + scrollStep)
    })
  }, { isActive: isActive && detailOpen, ref: detailRef })

  return { detailOpen, detailScrollOffset, resetDetailScroll, copyFeedback, copyBody, copyExtra, detailRef, openDetail }
}

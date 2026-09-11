'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { Button } from './button'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  className?: string
  panelClassName?: string
  /** Optional footer (e.g. submit button). Rendered inside the panel. */
  footer?: React.ReactNode
}

export function Drawer({ open, onClose, title, children, className, panelClassName, footer }: DrawerProps) {
  const titleId = React.useId()
  const panelRef = React.useRef<HTMLDivElement>(null)
  const close = React.useEffectEvent(onClose)
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    setMounted(true)
  }, [])
  React.useEffect(() => {
    if (!open || !mounted) return
    const panel = panelRef.current
    if (!panel) return
    const prev = document.body.style.overflow
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null
    document.body.style.overflow = 'hidden'
    const focusable = () => Array.from(panel.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter(element => element.getClientRects().length > 0 && !element.closest('[inert]'))
    const initialFocus = focusable()[0] ?? panel
    initialFocus.focus()
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        close()
      }
      if (event.key !== 'Tab') return
      const items = focusable()
      const first = items[0]
      const last = items[items.length - 1]
      if (!first) { event.preventDefault(); panel?.focus(); return }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
        event.preventDefault(); last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus()
      }
    }
    function keepFocus(event: FocusEvent) {
      if (event.target instanceof Node && !panel?.contains(event.target)) (focusable()[0] ?? panel)?.focus()
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('focusin', keepFocus)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('focusin', keepFocus)
      if (trigger?.isConnected) trigger.focus()
    }
  }, [open, mounted])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  if (!mounted || typeof document === 'undefined') return null

  const content = (
    <div
      inert={!open}
      aria-hidden={!open}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className={cn(
        'fixed inset-0 z-50 flex justify-end',
        !open && 'pointer-events-none'
      )}
    >
      <div
        className={cn(
          'absolute inset-0 bg-black/50 transition-opacity',
          open ? 'opacity-100' : 'opacity-0'
        )}
        onClick={handleBackdropClick}
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          'relative h-dvh w-full max-w-lg bg-card border-l border-border shadow-xl flex flex-col transition-transform duration-200 ease-out',
          open ? 'translate-x-0' : 'translate-x-full',
          panelClassName
        )}
      >
        <div className="flex items-center justify-between shrink-0 border-b border-border px-6 py-5">
          <h2 id={titleId} className="text-lg font-semibold text-foreground">
            {title}
          </h2>
          <Button variant="ghost" className="h-8 w-8 p-0" onClick={onClose} aria-label="Close">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className={cn('flex-1 overflow-y-auto p-6', className)}>{children}</div>
        {footer && (
          <div className="shrink-0 border-t border-border px-6 py-5 flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(content, document.body)
}

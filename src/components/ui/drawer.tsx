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
  /** Optional footer (e.g. submit button). Rendered inside the panel. */
  footer?: React.ReactNode
}

export function Drawer({ open, onClose, title, children, className, footer }: DrawerProps) {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    setMounted(true)
  }, [])
  React.useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  if (!mounted || typeof document === 'undefined') return null

  const content = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
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
        className={cn(
          'relative w-full max-w-md bg-card border-l border-border shadow-xl flex flex-col transition-transform duration-200 ease-out',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex items-center justify-between shrink-0 border-b border-border px-4 py-3">
          <h2 id="drawer-title" className="text-sm font-semibold text-foreground">
            {title}
          </h2>
          <Button variant="ghost" className="h-8 w-8 p-0" onClick={onClose} aria-label="Close">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className={cn('flex-1 overflow-y-auto p-4', className)}>{children}</div>
        {footer && (
          <div className="shrink-0 border-t border-border px-4 py-3 flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(content, document.body)
}

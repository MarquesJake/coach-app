'use client'

import { useEffect, useRef } from 'react'
import { hasUnsavedRoleForm } from '@/lib/portals/form-exit'

export function ProfileExitGuard({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null)
  const allow = () => !root.current || !hasUnsavedRoleForm(root.current) || window.confirm('You have unsaved profile or material changes. Leave without saving them?')
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!root.current || !hasUnsavedRoleForm(root.current)) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [])
  return <div ref={root} onClickCapture={event => {
    const link = (event.target as Element).closest('a')
    if (!link || link.target === '_blank' || link.getAttribute('href')?.startsWith('#')) return
    if (!allow()) { event.preventDefault(); event.stopPropagation() }
  }} onSubmitCapture={event => {
    if ((event.target as HTMLFormElement).dataset.roleExit && !allow()) { event.preventDefault(); event.stopPropagation() }
  }}>{children}</div>
}

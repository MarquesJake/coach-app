'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { toastSuccess, toastError } from '@/lib/ui/toast'

const PARAM_KEYS = [
  'success',
  'error',
  'shortlist_success',
  'shortlist_error',
  'deliverable_success',
  'deliverable_error',
] as const

export function MandateToasts() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const done = useRef(false)

  useEffect(() => {
    if (done.current) return
    const next = new URLSearchParams(searchParams)
    let changed = false

    for (const key of PARAM_KEYS) {
      const value = next.get(key)
      if (!value) continue
      done.current = true
      const isError = key.includes('error')
      if (isError) toastError(value)
      else toastSuccess(value)
      next.delete(key)
      changed = true
    }

    if (changed) {
      const q = next.toString()
      router.replace(q ? `${pathname}?${q}` : pathname)
    }
  }, [pathname, router, searchParams])

  return null
}

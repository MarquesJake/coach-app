'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toastSuccess } from '@/lib/ui/toast'

/**
 * Subscribes to mandate and shortlist changes so the mandates list/board updates without refresh.
 */
export function RealtimeMandatesListSubscriber() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('mandates-list')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mandates',
        },
        () => {
          toastSuccess('Mandates updated')
          router.refresh()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mandate_shortlist',
        },
        () => {
          toastSuccess('Shortlist updated')
          router.refresh()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [router])

  return null
}

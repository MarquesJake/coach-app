'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toastSuccess } from '@/lib/ui/toast'

export function RealtimeMandateSubscriber({ mandateId }: { mandateId: string }) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`mandate-detail:${mandateId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mandates',
          filter: `id=eq.${mandateId}`,
        },
        () => {
          toastSuccess('Mandate updated')
          router.refresh()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mandate_shortlist',
          filter: `mandate_id=eq.${mandateId}`,
        },
        () => {
          toastSuccess('Shortlist updated')
          router.refresh()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_log',
        },
        (payload) => {
          const record = payload.new as { entity_type?: string; entity_id?: string }
          if (record?.entity_type === 'mandate' && record?.entity_id === mandateId) {
            toastSuccess('New activity')
            router.refresh()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [mandateId, router])

  return null
}

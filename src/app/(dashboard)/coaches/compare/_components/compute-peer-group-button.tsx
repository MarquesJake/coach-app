'use client'

import { useTransition } from 'react'
import { refreshSimilarityForCoachAction } from '@/app/(dashboard)/coaches/[id]/actions'
import { useRouter } from 'next/navigation'
import { toastSuccess, toastError } from '@/lib/ui/toast'

export function ComputePeerGroupButton({ coachId }: { coachId: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleClick() {
    startTransition(async () => {
      const result = await refreshSimilarityForCoachAction(coachId)
      if (result.ok) {
        toastSuccess('Peer group computed')
        router.refresh()
      } else {
        toastError(result.error ?? 'Failed to compute')
      }
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground hover:bg-surface/80 disabled:opacity-50"
    >
      {isPending ? 'Computing…' : 'Compute peer group'}
    </button>
  )
}

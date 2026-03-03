'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteMandateAction } from '../../actions'
import { toastSuccess, toastError } from '@/lib/ui/toast'

export function DeleteMandateButton({ mandateId }: { mandateId: string }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Delete this mandate? This cannot be undone.')) return
    setDeleting(true)
    const result = await deleteMandateAction(mandateId)
    setDeleting(false)
    if (!result.ok) {
      toastError(result.error)
      return
    }
    toastSuccess('Mandate deleted')
    router.push('/mandates')
  }

  return (
    <Button
      variant="outline"
      onClick={handleDelete}
      disabled={deleting}
      className="inline-flex items-center gap-2 px-3 h-9 border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
    >
      <Trash2 className="w-3.5 h-3.5" />
      {deleting ? 'Deleting…' : 'Delete mandate'}
    </Button>
  )
}

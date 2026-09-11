'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DeleteMandateDialog } from '@/components/mandates/delete-mandate-dialog'
import { toastSuccess } from '@/lib/ui/toast'

export function DeleteMandateButton({ mandateId }: { mandateId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  return (
    <>
    <Button
      variant="outline"
      onClick={() => setOpen(true)}
      className="inline-flex items-center gap-2 px-3 h-9 border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
    >
      <Trash2 className="w-3.5 h-3.5" />
      Delete mandate
    </Button>
    {open && <DeleteMandateDialog mandateId={mandateId} name="this" onClose={() => setOpen(false)} onDeleted={() => { toastSuccess('Mandate deleted'); router.push('/mandates'); router.refresh() }} />}
    </>
  )
}

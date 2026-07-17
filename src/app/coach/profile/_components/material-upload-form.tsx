'use client'

import { useState, useTransition } from 'react'
import { FileUp, Link2, LoaderCircle } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { addOwnCoachMaterialAction } from '../actions'

const inputClass =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 placeholder:text-slate-400 focus:border-emerald-800 focus:outline-none'

export function MaterialUploadForm({ coachId }: { coachId: string }) {
  const [file, setFile] = useState<File | null>(null)
  const [pending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)

  async function submit(formData: FormData) {
    const title = String(formData.get('title') ?? '').trim()
    const externalUrl = String(formData.get('external_url') ?? '').trim()
    const description = String(formData.get('description') ?? '').trim()
    if (!title || (!file && !externalUrl && !description)) {
      toast.error('Add a title and either a private file, secure link or useful description.')
      return
    }

    let storagePath: string | null = null
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        toast.error('Files must be 100 MB or smaller. Use a secure video link for larger files.')
        return
      }
      setUploading(true)
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
      storagePath = `${coachId}/${crypto.randomUUID()}-${safeName}`
      const { error } = await createClient()
        .storage
        .from('coach-private-materials')
        .upload(storagePath, file, { upsert: false })
      setUploading(false)
      if (error) {
        toast.error(error.message)
        return
      }
    }

    startTransition(async () => {
      const result = await addOwnCoachMaterialAction({
        title,
        materialType: String(formData.get('material_type') ?? 'other'),
        description: description || null,
        externalUrl: externalUrl || null,
        storagePath,
      })
      if (!result.ok) {
        if (storagePath) {
          await createClient().storage.from('coach-private-materials').remove([storagePath])
        }
        toast.error(result.error)
        return
      }
      toast.success('Material submitted for Coach First review')
      window.location.reload()
    })
  }

  return (
    <form action={submit} className="grid gap-3 sm:grid-cols-2">
      <input name="title" required placeholder="Material title" className={inputClass} />
      <select name="material_type" className={inputClass}>
        <option value="presentation">Coach presentation</option>
        <option value="methodology">Game model / methodology</option>
        <option value="training_video">Training session video</option>
        <option value="match_video">Match-plan or analysis video</option>
        <option value="analysis">Analysis document</option>
        <option value="reference_pack">Reference permissions / pack</option>
        <option value="media">Media / communication sample</option>
        <option value="other">Other football work</option>
      </select>
      <textarea name="description" rows={3} placeholder="What this shows, the context, and why it matters" className={`${inputClass} sm:col-span-2`} />
      <label className="flex min-h-20 cursor-pointer items-center gap-3 rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        <FileUp className="h-4 w-4 shrink-0 text-emerald-800" />
        <span>{file ? file.name : 'Private PDF, PowerPoint or video up to 100 MB'}</span>
        <input
          type="file"
          accept=".pdf,.ppt,.pptx,.mp4,.mov,.webm"
          className="sr-only"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
      </label>
      <label className="relative">
        <Link2 className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <input name="external_url" type="url" placeholder="Secure video or document link" className={`${inputClass} h-20 pl-9`} />
      </label>
      <div className="sm:col-span-2 flex justify-end">
        <button
          disabled={pending || uploading}
          className="inline-flex items-center gap-2 rounded-md bg-emerald-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {(pending || uploading) && <LoaderCircle className="h-4 w-4 animate-spin" />}
          {uploading ? 'Uploading privately' : pending ? 'Recording submission' : 'Submit material'}
        </button>
      </div>
    </form>
  )
}

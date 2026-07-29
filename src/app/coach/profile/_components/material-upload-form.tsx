'use client'

import { useState, useTransition } from 'react'
import { Upload } from 'tus-js-client'
import { FileUp, Link2, LoaderCircle } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import {
  addOwnCoachMaterialAction,
  beginOwnCoachMaterialUploadAction,
  completeOwnCoachMaterialUploadAction,
  failOwnCoachMaterialUploadAction,
} from '../actions'

const inputClass =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 placeholder:text-slate-400 focus:border-emerald-800 focus:outline-none'

const ALLOWED_FILE_TYPES = new Set([
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'video/mp4',
  'video/quicktime',
  'video/webm',
])

async function uploadPrivateMaterial(
  objectName: string,
  file: File,
  onProgress: (percent: number) => void
): Promise<string> {
  const supabase = createClient()
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error || !session) throw new Error('Your session expired. Sign in again before uploading.')

  const projectUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!)
  const storageHost = projectUrl.hostname.endsWith('.supabase.co')
    ? projectUrl.hostname.replace('.supabase.co', '.storage.supabase.co')
    : projectUrl.hostname
  const endpoint = `${projectUrl.protocol}//${storageHost}/storage/v1/upload/resumable`

  await new Promise<void>((resolve, reject) => {
    const upload = new Upload(file, {
      endpoint,
      retryDelays: [0, 1000, 3000, 5000, 10000],
      headers: {
        authorization: `Bearer ${session.access_token}`,
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
      metadata: {
        bucketName: 'coach-private-materials',
        objectName,
        contentType: file.type,
        cacheControl: '3600',
      },
      uploadSize: file.size,
      uploadDataDuringCreation: true,
      chunkSize: 6 * 1024 * 1024,
      removeFingerprintOnSuccess: true,
      onError: reject,
      onProgress: (uploaded, total) => onProgress(Math.round((uploaded / total) * 100)),
      onSuccess: () => resolve(),
    })

    upload.findPreviousUploads().then((previousUploads) => {
      if (previousUploads.length) upload.resumeFromPreviousUpload(previousUploads[0])
      upload.start()
    }).catch(reject)
  })

  return objectName
}

export function MaterialUploadForm() {
  const [file, setFile] = useState<File | null>(null)
  const [pending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  async function submit(formData: FormData) {
    const title = String(formData.get('title') ?? '').trim()
    const externalUrl = String(formData.get('external_url') ?? '').trim()
    const description = String(formData.get('description') ?? '').trim()
    if (!title || (!file && !externalUrl && !description)) {
      toast.error('Add a title and either a private file, secure link or useful description.')
      return
    }

    if (file) {
      if (!ALLOWED_FILE_TYPES.has(file.type)) {
        toast.error('Use a PDF, PowerPoint, MP4, MOV or WebM file.')
        return
      }
      if (file.size > 100 * 1024 * 1024) {
        toast.error('Files must be 100 MB or smaller. Use a secure video link for larger files.')
        return
      }
      setUploading(true)
      setUploadProgress(0)
      const reservation = await beginOwnCoachMaterialUploadAction({
        title,
        materialType: String(formData.get('material_type') ?? 'other'),
        description: description || null,
        externalUrl: externalUrl || null,
        originalFileName: file.name,
        mimeType: file.type,
        fileSizeBytes: file.size,
      })
      if (!reservation.ok) {
        setUploading(false)
        toast.error(reservation.error)
        return
      }
      const { material_id: materialId, storage_path: storagePath } = reservation.reservation
      try {
        await uploadPrivateMaterial(storagePath, file, setUploadProgress)
      } catch (error) {
        await createClient().storage.from('coach-private-materials').remove([storagePath])
        await failOwnCoachMaterialUploadAction(
          materialId,
          error instanceof Error ? error.message : 'Private upload failed'
        )
        setUploading(false)
        toast.error(error instanceof Error ? error.message : 'The upload could not be completed.')
        return
      }

      let completion: Awaited<ReturnType<typeof completeOwnCoachMaterialUploadAction>> = {
        ok: false,
        error: 'The uploaded object could not be verified.',
      }
      for (let attempt = 0; attempt < 3 && !completion.ok; attempt += 1) {
        if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 750 * attempt))
        completion = await completeOwnCoachMaterialUploadAction(materialId)
      }
      setUploading(false)
      if (!completion.ok) {
        toast.error(`${completion.error} Your upload is retained for secure recovery.`)
        window.location.reload()
        return
      }
      toast.success('Material uploaded privately and submitted for Coach First review')
      window.location.reload()
      return
    }

    startTransition(async () => {
      const result = await addOwnCoachMaterialAction({
        title,
        materialType: String(formData.get('material_type') ?? 'other'),
        description: description || null,
        externalUrl: externalUrl || null,
        storagePath: null,
        originalFileName: null,
        mimeType: null,
        fileSizeBytes: null,
      })
      if (!result.ok) {
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
        <span>{file ? `${file.name}${uploading ? ` · ${uploadProgress}%` : ''}` : 'Private PDF, PowerPoint or video up to 100 MB'}</span>
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

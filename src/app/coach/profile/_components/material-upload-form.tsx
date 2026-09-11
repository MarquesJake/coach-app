'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
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
      fingerprint: async () => `gaffa-private:${objectName}`,
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
  const [pending, setPending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [confirmationId, setConfirmationId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const inFlight = useRef(false)
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()

  async function submit(formData: FormData) {
    if (inFlight.current) return
    inFlight.current = true
    setPending(true)
    setMessage(null)
    try {
    if (confirmationId) {
      const result = await completeOwnCoachMaterialUploadAction(confirmationId)
      if (!result.ok) { setMessage(`${result.error} The uploaded file is retained; retry confirmation without submitting another copy.`); return }
      completeSubmission()
      return
    }
    const title = String(formData.get('title') ?? '').trim()
    const externalUrl = String(formData.get('external_url') ?? '').trim()
    const description = String(formData.get('description') ?? '').trim()
    if (!title || (!file && !externalUrl && !description)) {
      setMessage('Add a title and a file, a secure link or a short description.')
      return
    }

    if (file) {
      if (!ALLOWED_FILE_TYPES.has(file.type)) {
        setMessage('Use a PDF, PowerPoint, MP4, MOV or WebM file.')
        return
      }
      if (file.size > 100 * 1024 * 1024) {
        setMessage('Files must be 100 MB or smaller. Use a secure video link for larger files.')
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
        setMessage(reservation.error)
        return
      }
      const { material_id: materialId, storage_path: storagePath } = reservation.reservation
      try {
        await uploadPrivateMaterial(storagePath, file, setUploadProgress)
      } catch (error) {
        await Promise.allSettled([
          createClient().storage.from('coach-private-materials').remove([storagePath]),
          failOwnCoachMaterialUploadAction(materialId, 'Private upload interrupted'),
        ])
        setUploading(false)
        setMessage(error instanceof Error ? error.message : 'The upload could not be completed. Your form is retained for retry.')
        return
      }

      setConfirmationId(materialId)
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
        setMessage(`${completion.error} Your upload is retained. Retry upload confirmation without submitting another copy.`)
        return
      }
      completeSubmission()
      return
    }

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
        setMessage(result.error)
        return
      }
      completeSubmission()
    } catch {
      setMessage('Couldn’t confirm it was sent. Your details are kept — check your material list before sending again.')
    } finally {
      inFlight.current = false
      setPending(false)
      setUploading(false)
    }
  }

  function completeSubmission() {
    setConfirmationId(null)
    setFile(null)
    formRef.current?.reset()
    setMessage('Sent to Gaffa to review. Remember to save any profile changes before leaving.')
    toast.success('Material submitted for Gaffa review')
    router.refresh()
  }

  return (
    <form ref={formRef} onSubmit={event => { event.preventDefault(); void submit(new FormData(event.currentTarget)) }} aria-busy={pending} className="space-y-3">
      <fieldset disabled={pending || Boolean(confirmationId)} className="grid min-w-0 gap-3 sm:grid-cols-2">
      <label className="block text-xs font-semibold">Material title<input name="title" required className={`${inputClass} mt-1`} /></label>
      <label className="block text-xs font-semibold">Material type<select name="material_type" className={`${inputClass} mt-1`}>
        <option value="presentation">Coach presentation</option>
        <option value="methodology">Game model / methodology</option>
        <option value="training_video">Training session video</option>
        <option value="match_video">Match-plan or analysis video</option>
        <option value="analysis">Analysis document</option>
        <option value="reference_pack">Reference permissions / pack</option>
        <option value="media">Media / communication sample</option>
        <option value="other">Other football work</option>
      </select></label>
      <label className="block text-xs font-semibold sm:col-span-2">Context and description<textarea name="description" rows={3} placeholder="What this shows, the context, and why it matters" className={`${inputClass} mt-1`} /></label>
      <label className="flex min-h-20 cursor-pointer items-center gap-3 rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        <FileUp className="h-4 w-4 shrink-0 text-emerald-800" />
        <span className="min-w-0 break-words">{file ? `${file.name}${uploading ? ` · ${uploadProgress}%` : ''}` : 'Private PDF, PowerPoint or video up to 100 MB'}</span>
        <input
          type="file"
          accept=".pdf,.ppt,.pptx,.mp4,.mov,.webm"
          className="sr-only"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
      </label>
      <label className="relative">
        <span className="block text-xs font-semibold">Secure video or document link (optional)</span>
        <Link2 className="absolute left-3 top-9 h-4 w-4 text-slate-400" />
        <input name="external_url" type="url" placeholder="https://" className={`${inputClass} mt-1 min-h-14 pl-9`} />
      </label>
      </fieldset>
      {message && <p role="status" className="text-sm leading-6">{message}</p>}
      <div className="sm:col-span-2 flex justify-end">
        <button
          disabled={pending || uploading}
          className="inline-flex items-center gap-2 rounded-md bg-emerald-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {(pending || uploading) && <LoaderCircle className="h-4 w-4 animate-spin" />}
          {uploading ? `Uploading privately (${uploadProgress}%)` : pending ? 'Recording submission' : confirmationId ? 'Retry upload confirmation' : 'Submit material'}
        </button>
      </div>
    </form>
  )
}

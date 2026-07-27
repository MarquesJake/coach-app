'use client'

import {
  Children,
  type FormEventHandler,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react'
import { Check, ChevronLeft, ChevronRight, Cloud, Save } from 'lucide-react'
import { cn } from '@/lib/utils'

type Stage = {
  key: string
  label: string
  description: string
}

type DraftValue = string | string[]
type DraftRecord = Record<string, DraftValue>

function readForm(form: HTMLFormElement): DraftRecord {
  const values: DraftRecord = {}
  const data = new FormData(form)
  for (const [name, value] of Array.from(data.entries())) {
    if (value instanceof File || name === 'intent') continue
    const existing = values[name]
    if (existing === undefined) values[name] = value
    else values[name] = Array.isArray(existing) ? [...existing, value] : [existing, value]
  }
  return values
}

function restoreForm(form: HTMLFormElement, values: DraftRecord) {
  for (const [name, stored] of Object.entries(values)) {
    const fields = Array.from(
      form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
        `[name="${CSS.escape(name)}"]`
      )
    )
    for (const field of fields) {
      if (field instanceof HTMLInputElement && (field.type === 'checkbox' || field.type === 'radio')) {
        const selected = Array.isArray(stored) ? stored : [stored]
        field.checked = selected.includes(field.value)
      } else {
        field.value = Array.isArray(stored) ? stored[0] ?? '' : stored
      }
    }
  }
}

export function StagedAutosaveForm({
  action,
  stages,
  draftKey,
  saved,
  canEdit = true,
  children,
  submitLabel,
  saveLabel = 'Save progress',
  className,
}: {
  action: (formData: FormData) => void | Promise<void>
  stages: readonly Stage[]
  draftKey: string
  saved?: boolean
  canEdit?: boolean
  children: ReactNode
  submitLabel: string
  saveLabel?: string
  className?: string
}) {
  const formRef = useRef<HTMLFormElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [activeStage, setActiveStage] = useState(0)
  const [draftStatus, setDraftStatus] = useState<'idle' | 'restored' | 'saving' | 'saved'>('idle')
  const sections = Children.toArray(children)

  useEffect(() => {
    if (saved) {
      localStorage.removeItem(draftKey)
      return
    }
    const raw = localStorage.getItem(draftKey)
    if (!raw || !formRef.current) return
    try {
      const parsed = JSON.parse(raw) as { values?: DraftRecord; stage?: number }
      if (parsed.values) restoreForm(formRef.current, parsed.values)
      if (typeof parsed.stage === 'number') {
        setActiveStage(Math.max(0, Math.min(stages.length - 1, parsed.stage)))
      }
      setDraftStatus('restored')
    } catch {
      localStorage.removeItem(draftKey)
    }
  }, [draftKey, saved, stages.length])

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  const saveBrowserDraft: FormEventHandler<HTMLFormElement> = (event) => {
    if (!canEdit) return
    setDraftStatus('saving')
    if (timerRef.current) clearTimeout(timerRef.current)
    const form = event.currentTarget
    timerRef.current = setTimeout(() => {
      localStorage.setItem(draftKey, JSON.stringify({
        values: readForm(form),
        stage: activeStage,
        savedAt: new Date().toISOString(),
      }))
      setDraftStatus('saved')
    }, 350)
  }

  function moveTo(stage: number) {
    setActiveStage(stage)
    if (!formRef.current || !canEdit) return
    localStorage.setItem(draftKey, JSON.stringify({
      values: readForm(formRef.current),
      stage,
      savedAt: new Date().toISOString(),
    }))
    setDraftStatus('saved')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <form
      ref={formRef}
      action={action}
      onInput={saveBrowserDraft}
      className={cn('space-y-5', className)}
    >
      <nav aria-label="Form sections" className="overflow-x-auto border-b border-border">
        <div className="flex min-w-max gap-1">
          {stages.map((stage, index) => (
            <button
              key={stage.key}
              type="button"
              onClick={() => moveTo(index)}
              className={cn(
                'min-h-11 border-b-2 px-3 py-2 text-left text-xs font-semibold transition-colors',
                index === activeStage
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <span className="mr-2 tabular-nums text-muted-foreground">{index + 1}</span>
              {stage.label}
            </button>
          ))}
        </div>
      </nav>

      <div className="flex flex-col gap-2 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">{stages[activeStage]?.label}</h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{stages[activeStage]?.description}</p>
        </div>
        {canEdit && (
          <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground" aria-live="polite">
            {draftStatus === 'saving' ? <Cloud className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
            {draftStatus === 'restored'
              ? 'Unfinished browser draft restored'
              : draftStatus === 'saving'
                ? 'Saving browser draft'
                : draftStatus === 'saved'
                  ? 'Browser draft saved'
                  : 'Changes are kept on this device'}
          </p>
        )}
      </div>

      {sections.map((section, index) => (
        <div key={stages[index]?.key ?? index} hidden={index !== activeStage}>
          {section}
        </div>
      ))}

      {canEdit && (
        <div className="sticky bottom-3 z-10 flex flex-col gap-2 border border-border bg-card/95 p-3 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => moveTo(Math.max(0, activeStage - 1))}
            disabled={activeStage === 0}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-border px-3 text-sm font-medium text-foreground disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              name="intent"
              value="save"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-semibold text-foreground"
            >
              <Save className="h-4 w-4" />
              {saveLabel}
            </button>
            {activeStage < stages.length - 1 ? (
              <button
                type="button"
                onClick={() => moveTo(activeStage + 1)}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
              >
                Continue
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                name="intent"
                value="submit"
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
              >
                <Check className="h-4 w-4" />
                {submitLabel}
              </button>
            )}
          </div>
        </div>
      )}
    </form>
  )
}

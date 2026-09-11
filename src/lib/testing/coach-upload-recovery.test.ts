import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import { isValidElement, type ReactElement } from 'react'
import ts from 'typescript'

const require = createRequire(import.meta.url)
type Element = ReactElement<Record<string, unknown>>
function elements(value: unknown): Element[] {
  if (Array.isArray(value)) return value.flatMap(elements)
  if (!isValidElement<Record<string, unknown>>(value)) return []
  return [value, ...elements(value.props.children)]
}

function uploadForm(options: { reserveThrows?: boolean; metadataFails?: boolean; completionFails?: boolean }) {
  const slots: unknown[] = []
  let hook = 0
  const calls: string[] = []
  const refs: { current: unknown }[] = []
  const actions = {
    addOwnCoachMaterialAction: async () => { calls.push('add'); if (options.metadataFails) throw new Error('Network'); return { ok: true } },
    beginOwnCoachMaterialUploadAction: async () => { calls.push('reserve'); if (options.reserveThrows) throw new Error('Network'); return { ok: true, reservation: { material_id: 'material-1', storage_path: 'private/file' } } },
    completeOwnCoachMaterialUploadAction: async () => { calls.push('complete'); return options.completionFails ? { ok: false, error: 'Not yet confirmed' } : { ok: true } },
    failOwnCoachMaterialUploadAction: async () => {},
  }
  const modules: Record<string, unknown> = {
    react: { ...require('react'), useState(initial: unknown) {
      const index = hook++
      if (!(index in slots)) slots[index] = initial
      return [slots[index], (value: unknown) => { slots[index] = value }]
    }, useRef(initial: unknown) {
      const index = hook++
      if (!(index in slots)) { const ref = { current: initial }; slots[index] = ref; refs.push(ref) }
      return slots[index]
    } },
    'next/navigation': { useRouter: () => ({ refresh: () => calls.push('refresh') }) },
    sonner: { toast: { success() {} } },
    '@/lib/supabase/client': { createClient: () => ({ auth: { getSession: async () => ({ data: { session: { access_token: 'mock' } }, error: null }) } }) },
    '../actions': actions,
    'tus-js-client': { Upload: class {
      options: { onSuccess: () => void }
      constructor(_file: unknown, settings: { onSuccess: () => void }) { this.options = settings }
      async findPreviousUploads() { return [] }
      start() { calls.push('upload'); this.options.onSuccess() }
    } },
  }
  const code = ts.transpileModule(readFileSync(new URL('../../app/coach/profile/_components/material-upload-form.tsx', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText
  const exports: { MaterialUploadForm?: () => Element } = {}
  new Function('require', 'exports', 'FormData', 'process', 'setTimeout', code)(
    (id: string) => id in modules ? modules[id] : require(id), exports,
    class { get(name: string) { return ({ title: 'Session', description: 'Context', material_type: 'training_video' } as Record<string, string>)[name] ?? '' } },
    { env: { NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'mock' } },
    (callback: () => void) => callback(),
  )
  const render = () => { hook = 0; return elements(exports.MaterialUploadForm!()) }
  const button = () => render().find(element => element.type === 'button')!
  return {
    calls, button, render,
    selectFile() { (render().find(element => element.props.type === 'file')!.props.onChange as (event: unknown) => void)({ target: { files: [{ name: 'session.mp4', type: 'video/mp4', size: 100 }] } }) },
    async submit() {
      const form = render().find(element => element.type === 'form')!
      const ref = form.props.ref as { current: unknown }
      ref.current = { reset: () => calls.push('reset') }
      ;(form.props.onSubmit as (event: unknown) => void)({ preventDefault() {}, currentTarget: {} })
      await new Promise(resolve => setImmediate(resolve))
    },
  }
}

test('a failed metadata or reservation request retains inputs and always releases pending controls', async () => {
  for (const options of [{ metadataFails: true }, { reserveThrows: true }]) {
    const page = uploadForm(options)
    if (options.reserveThrows) page.selectFile()
    await page.submit()
    assert.equal(page.button().props.disabled, false)
    assert.ok(!page.calls.includes('reset'))
    assert.ok(!page.calls.includes('refresh'))
  }
})

test('unconfirmed uploaded files retry the same material ID without another reservation or upload', async () => {
  const options = { completionFails: true }
  const page = uploadForm(options)
  page.selectFile()
  await page.submit()
  assert.ok(elements(page.button()).some(element => Array.isArray(element.props.children) && element.props.children.includes('Retry upload confirmation')))
  assert.ok(!page.calls.includes('reset'))
  options.completionFails = false
  await page.submit()
  assert.equal(page.calls.filter(call => call === 'reserve').length, 1)
  assert.equal(page.calls.filter(call => call === 'upload').length, 1)
  assert.equal(page.calls.filter(call => call === 'reset').length, 1)
  assert.equal(page.calls.filter(call => call === 'refresh').length, 1)
})

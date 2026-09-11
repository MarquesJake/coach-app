import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { uiHarness, elements } from './ui-harness.ts'

class FixtureFormData extends FormData {
  constructor(values: Record<string, string | string[]>) {
    super()
    for (const [key, value] of Object.entries(values)) for (const item of Array.isArray(value) ? value : [value]) this.append(key, item)
  }
}

test('publication requires an explicit recipient and fee, retains the form on rejected transport', async () => {
  const harness = uiHarness(new URL('../../app/(dashboard)/mandates/[id]/pack/_components/publish-offer-form.tsx', import.meta.url), {
    '@/app/(dashboard)/dossier-orders/actions': { publishDossierOfferAction: async () => { throw new Error('Disconnected') } },
  }, { FormData: FixtureFormData, window: { confirm: () => true } })
  const render = () => elements(harness.render('PublishOfferForm', { mandateId: 'm', coachId: 'c', buyers: [{ id: 'club', name: 'Club' }] }))
  let nodes = render()
  assert.equal(nodes.find(node => node.type === 'select')?.props.defaultValue, '')
  const fee = nodes.find(node => node.props.name === 'price_pounds')!
  assert.equal(fee.props.required, true)
  assert.equal(fee.props.defaultValue, undefined)
  const form = nodes.find(node => node.type === 'form')!
  assert.equal(form.props.action, undefined, 'onSubmit prevents React action auto-reset after business failures')
  await (form.props.onSubmit as (event: unknown) => Promise<void>)({ preventDefault() {}, currentTarget: { buyer_organization_id: 'club', price_pounds: '0' } })
  nodes = render()
  assert.ok(nodes.some(node => node.props.role === 'alert'))
  assert.equal(nodes.find(node => node.type === 'fieldset')?.props.disabled, false)
  assert.ok(nodes.some(node => node.type === 'form'))
})

test('release requires deliberate files and preserves their selection when the request fails', async () => {
  let requests = 0
  const harness = uiHarness(new URL('../../app/(dashboard)/dossier-orders/_components/release-order-form.tsx', import.meta.url), {
    '../actions': { approveDossierOrderAction: async () => { requests++; throw new Error('Disconnected') } },
  }, { FormData: FixtureFormData })
  const render = () => elements(harness.render('ReleaseOrderForm', { orderId: 'order', coachId: 'coach', materials: [{ id: 'file', title: 'Fixture file', verification_status: 'verified', material_type: 'game_model' }] }))
  let nodes = render()
  let submit = nodes.find(node => node.type === 'form')!.props.onSubmit as (event: unknown) => Promise<void>
  assert.equal(nodes.find(node => node.props.name === 'material_id')?.props.checked, false)
  await submit({ preventDefault() {}, currentTarget: { order_id: 'order' } })
  assert.equal(requests, 0)
  const checkbox = render().find(node => node.props.name === 'material_id')!
  ;(checkbox.props.onChange as (event: unknown) => void)({ target: { checked: true } })
  nodes = render()
  submit = nodes.find(node => node.type === 'form')!.props.onSubmit as typeof submit
  await submit({ preventDefault() {}, currentTarget: { order_id: 'order', material_id: ['file'], access_days: '30' } })
  nodes = render()
  assert.equal(requests, 1)
  assert.equal(nodes.find(node => node.props.name === 'material_id')?.props.checked, true)
  assert.equal(nodes.find(node => node.type === 'fieldset')?.props.disabled, false)
  assert.ok(nodes.some(node => node.props.role === 'alert'))
})

test('coach agent editor does not submit unsupported confidence or invent a relationship score', () => {
  const source = readFileSync(new URL('../../app/(dashboard)/coaches/[id]/_components/coach-agents-section.tsx', import.meta.url), 'utf8')
  assert.ok(!source.includes('confidence:'))
  assert.ok(source.includes("relationship_strength: ''"))
  assert.ok(source.includes('Number(form.relationship_strength) : null'))
})

test('confirmed release and publication cannot be replayed even before React rerenders', async () => {
  for (const kind of ['release', 'publish'] as const) {
    let requests = 0
    const action = async () => { requests++; return { ok: true } }
    const file = kind === 'release' ? 'dossier-orders/_components/release-order-form.tsx' : 'mandates/[id]/pack/_components/publish-offer-form.tsx'
    const harness = uiHarness(new URL(`../../app/(dashboard)/${file}`, import.meta.url), {
      ...(kind === 'release' ? { '../actions': { approveDossierOrderAction: action } } : { '@/app/(dashboard)/dossier-orders/actions': { publishDossierOfferAction: action } }),
    }, { FormData: FixtureFormData, window: { confirm: () => true } })
    const name = kind === 'release' ? 'ReleaseOrderForm' : 'PublishOfferForm'
    const props = kind === 'release' ? { orderId: 'order', coachId: 'coach', materials: [] } : { mandateId: 'mandate', coachId: 'coach', buyers: [{ id: 'club', name: 'Club' }] }
    const nodes = elements(harness.render(name, props))
    const submit = nodes.find(node => node.type === 'form')!.props.onSubmit as (event: unknown) => Promise<void>
    const event = { preventDefault() {}, currentTarget: { order_id: 'order', material_id: ['file'], buyer_organization_id: 'club', price_pounds: '0' } }
    await submit(event)
    await submit(event)
    assert.equal(requests, 1, kind)
  }
})

test('assessment directory stacks its content on phones rather than clipping a fixed five-column row', () => {
  const source = readFileSync(new URL('../../app/(dashboard)/mandates/[id]/assessment/page.tsx', import.meta.url), 'utf8')
  assert.ok(source.includes('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-'))
  assert.ok(source.includes('Choose candidates'))
})

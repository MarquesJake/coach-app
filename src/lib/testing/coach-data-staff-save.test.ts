/* eslint-disable @typescript-eslint/no-explicit-any */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import { isValidElement } from 'react'
import ts from 'typescript'
const require = createRequire(import.meta.url)
function load(file: string, modules: Record<string, any>, form = false) {
  const source = readFileSync(new URL('../../app/(dashboard)/' + file, import.meta.url), 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText
  const exports: any = {}
  new Function('require', 'exports', 'FormData', 'confirm', code)((id: string) => id in modules ? modules[id] : id.startsWith('@/') || id.startsWith('.') || id.startsWith('next/') ? {} : require(id), exports, form ? class { constructor(value: any) { return value.data } } : FormData, () => true)
  return exports
}
function elements(value: any): any[] {
  if (Array.isArray(value)) return value.flatMap(elements)
  return isValidElement<any>(value) ? [value, ...elements(value.props.children), ...elements(value.props.footer)] : []
}
function mount(file: string, name: string, props: any, extra: Record<string, any>) {
  const slots: any[] = []; let cursor = 0; let refreshes = 0
  const react = { ...require('react'), useMemo: (fn: any) => fn(), useCallback: (fn: any) => fn, useId: () => 'test-form', useState(initial: any) { const i = cursor++; if (!(i in slots)) slots[i] = initial; return [slots[i], (v: any) => { slots[i] = v }] }, useRef(initial: any) { const i = cursor++; if (!(i in slots)) slots[i] = { current: initial }; return slots[i] } }
  const component = load(file, { react, 'next/navigation': { useRouter: () => ({ refresh: () => refreshes++ }) }, '@/components/ui/drawer': { Drawer: 'drawer' }, '@/components/ui/button': { Button: 'button' }, '@/components/source-confidence-fields': { SourceConfidenceFields: 'source-fields', IntelPill: 'pill' }, '@/lib/utils': { cn: () => '' }, '@/lib/ui/toast': { toastSuccess() {}, toastError() {} }, ...extra }, true)[name]
  return { render: () => { cursor = 0; return component(props) }, refreshes: () => refreshes }
}
function form(tree: any) { return elements(tree).find(e => e.type === 'form') }
function submit(element: any, data = new FormData()) { return element.props.onSubmit({ preventDefault() {}, currentTarget: { data } }) }
const dataFile = 'coaches/[id]/data/_components/coach-data-tab.tsx'
const staffFile = 'coaches/[id]/staff-network/_components/staff-network-section.tsx'
const dataProps = { coachId: 'coach', profile: null, externalProfile: null, recruitment: [], mediaEvents: [] }
const staffProps = { coachId: 'coach', history: [], staffMap: new Map(), allStaff: [{ id: 'a', full_name: 'A' }, { id: 'b', full_name: 'B' }] }
const byId = (tree: any, id: string) => elements(tree).find(e => e.props.id === id)
const button = (tree: any, label: string) => elements(tree).find(e => e.type === 'button' && e.props.children === label)
function deferred() { let resolve!: (v: any) => void; let reject!: (v: any) => void; const promise = new Promise<any>((a,b) => { resolve=a; reject=b }); return { promise, resolve, reject } }
for (const kind of ['recruitment', 'media']) {
  const field = kind === 'recruitment' ? 'player_name' : 'headline'
  const action = kind === 'recruitment' ? 'upsertRecruitmentAction' : 'upsertMediaEventAction'
  const deletion = kind === 'recruitment' ? 'deleteRecruitmentAction' : 'deleteMediaEventAction'
  const collection = kind === 'recruitment' ? 'recruitment' : 'mediaEvents'
  test(`${kind}: switching records remounts fields and targets the selected row`, async () => {
    let saved: any
    const page = mount(dataFile, 'CoachDataTab', { ...dataProps, [collection]: [{ id:'a', [field]:'A' }, { id:'b', [field]:'B' }] }, { '../../actions': { [action]: async (id: string, fd: FormData) => { saved=[id,fd.get('id'),fd.get(field)]; return {error:null} } } })
    assert.equal(byId(page.render(), `${kind}-form`), undefined)
    let edits=elements(page.render()).filter(e => e.type==='button' && e.props.children==='Edit'); edits[1].props.onClick()
    const first=byId(page.render(), `${kind}-form`); assert.equal(first.key,'a')
    const drawer=elements(page.render()).find(e => e.type==='drawer' && e.props.open); drawer.props.onClose()
    assert.equal(byId(page.render(), `${kind}-form`), undefined)
    edits=elements(page.render()).filter(e => e.type==='button' && e.props.children==='Edit'); edits[2].props.onClick()
    const second=byId(page.render(), `${kind}-form`); assert.equal(second.key,'b')
    assert.equal(elements(second).find(e => e.props.name===field).props.defaultValue,'B')
    const fd=new FormData(); fd.set(field,'B edited'); await submit(second,fd)
    assert.deepEqual(saved,['coach','b','B edited']); assert.equal(byId(page.render(),`${kind}-form`),undefined)
  })
  test(`${kind}: transport failures preserve editor, block double submits and allow retry`, async () => {
    const pending=deferred(); let calls=0
    const page=mount(dataFile,'CoachDataTab',dataProps,{'../../actions':{[action]:()=>{calls++;return calls===1?pending.promise:Promise.resolve({error:null})}}})
    button(page.render(),kind==='recruitment'?'Add':'Add event').props.onClick()
    const f=byId(page.render(),`${kind}-form`); const save=submit(f); await submit(f); assert.equal(calls,1)
    const tree=page.render(); assert.equal(elements(tree).find(e=>e.props.form===`${kind}-form`).props.disabled,true)
    elements(tree).find(e=>e.type==='drawer'&&e.props.open).props.onClose(); assert.ok(byId(page.render(),`${kind}-form`))
    pending.reject(Error('offline')); await save; assert.ok(elements(page.render()).some(e=>e.props.role==='alert'))
    await submit(byId(page.render(),`${kind}-form`)); assert.equal(calls,2); assert.equal(page.refreshes(),1)
  })
  test(`${kind}: failed delete keeps editor and shows error`,async()=>{
    const page=mount(dataFile,'CoachDataTab',{...dataProps,[collection]:[{id:'a',[field]:'A'}]},{'../../actions':{[deletion]:async()=>({error:'Denied'})}})
    elements(page.render()).filter(e=>e.type==='button'&&e.props.children==='Edit')[1].props.onClick()
    await button(page.render(),'Delete').props.onClick()
    assert.ok(byId(page.render(),`${kind}-form`)); assert.equal(page.refreshes(),0); assert.ok(elements(page.render()).some(e=>e.props.children==='Denied'))
  })
}
test('staff autofill clears A, ignores out-of-order replies, and blocks save while loading',async()=>{
  const a=deferred(),b=deferred(); let writes=0
  const page=mount(staffFile,'StaffNetworkSection',staffProps,{'../../actions':{getStaffLinkAutofillAction:(_c:string,id:string)=>id==='a'?a.promise:b.promise,upsertStaffHistoryAction:async()=>{writes++;return {error:null}}}})
  button(page.render(),'Add link').props.onClick()
  const choose=(id:string)=>elements(page.render()).find(e=>e.props.name==='staff_id').props.onChange({target:{value:id}})
  choose('a'); choose('b'); await submit(form(page.render())); assert.equal(writes,0)
  b.resolve({club_name:'B club'}); await new Promise(r=>setImmediate(r))
  assert.equal(elements(page.render()).find(e=>e.props.name==='club_name').props.defaultValue,'B club')
  a.resolve({club_name:'A club'}); await new Promise(r=>setImmediate(r))
  assert.equal(elements(page.render()).find(e=>e.props.name==='club_name').props.defaultValue,'B club')
  const key=form(page.render()).key
  choose('a'); assert.notEqual(form(page.render()).key,key); assert.equal(elements(page.render()).find(e=>e.props.name==='club_name').props.defaultValue,'')
})
test('staff failed save and delete preserve entries; repeated submit is blocked',async()=>{
  let calls=0;const pending=deferred()
  const page=mount(staffFile,'StaffNetworkSection',{...staffProps,history:[{id:'link',staff_id:'a',club_name:'A',times_worked_together:1}]},{'../../actions':{upsertStaffHistoryAction:()=>{calls++;return pending.promise},deleteStaffHistoryAction:async()=>({error:'Denied'})}})
  button(page.render(),'Edit').props.onClick(); const f=form(page.render());const save=submit(f);await submit(f);assert.equal(calls,1)
  pending.reject(Error('offline'));await save;assert.ok(form(page.render()));assert.ok(elements(page.render()).some(e=>e.props.role==='alert'))
  await button(page.render(),'Delete').props.onClick();assert.ok(form(page.render()));assert.ok(elements(page.render()).some(e=>e.props.children==='Denied'))
})
test('row actions reject zero affected rows and scope every mutation to coach and row',async()=>{
  const filters:any[]=[];let revalidations=0
  const db={auth:{getUser:async()=>({data:{user:{id:'u'}}})},from(table:string){const q:any={update:()=>q,delete:()=>q,select:()=>q,eq:(k:string,v:string)=>{filters.push([table,k,v]);return q},single:async()=>({error:{message:'No affected row'},data:null}),then:(resolve:any)=>resolve({error:null})};return q}}
  const actions=load('coaches/[id]/actions.ts',{'@/lib/supabase/server':{createServerSupabaseClient:async()=>db},'@/lib/db/coaches':{getCoachById:async()=>({data:{id:'coach'}})},'@/lib/source-confidence':{parseSourceConfidenceFromFormData:()=>({})},'next/cache':{revalidatePath:()=>revalidations++}})
  for(const [up,del,table] of [['upsertRecruitmentAction','deleteRecruitmentAction','coach_recruitment_history'],['upsertMediaEventAction','deleteMediaEventAction','coach_media_events'],['upsertStaffHistoryAction','deleteStaffHistoryAction','coach_staff_history']]){
    const fd=new FormData();fd.set('id','row');fd.set('staff_id','staff')
    assert.equal((await actions[up]('coach',fd)).error,'No affected row');assert.equal((await actions[del]('coach','row')).error,'No affected row')
    assert.ok(filters.some(([t,k,v])=>t===table&&k==='coach_id'&&v==='coach'));assert.ok(filters.some(([t,k,v])=>t===table&&k==='id'&&v==='row'))
  }
  assert.equal(revalidations,0)
  const fd=new FormData();fd.set('occurred_at','not a date');assert.equal((await actions.upsertMediaEventAction('coach',fd)).error,'Invalid date')
})
test('staff late autofill cannot populate a reopened drawer; failure releases saving',async()=>{
  const pending=deferred();let calls=0
  const page=mount(staffFile,'StaffNetworkSection',staffProps,{'../../actions':{getStaffLinkAutofillAction:()=>{calls++;return calls===1?pending.promise:Promise.reject(Error('offline'))}}})
  button(page.render(),'Add link').props.onClick()
  elements(page.render()).find(e=>e.props.name==='staff_id').props.onChange({target:{value:'a'}})
  elements(page.render()).find(e=>e.type==='drawer'&&e.props.open).props.onClose()
  button(page.render(),'Add link').props.onClick()
  pending.resolve({club_name:'Late A'});await new Promise(r=>setImmediate(r))
  assert.equal(elements(page.render()).find(e=>e.props.name==='club_name').props.defaultValue,'')
  elements(page.render()).find(e=>e.props.name==='staff_id').props.onChange({target:{value:'b'}})
  await new Promise(r=>setImmediate(r))
  assert.ok(elements(page.render()).some(e=>e.props.role==='alert'))
  assert.equal(elements(page.render()).find(e=>e.props.form==='staff-history-form').props.disabled,false)
})

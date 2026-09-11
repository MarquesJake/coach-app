'use client'

import { Printer } from 'lucide-react'

export function ShowcaseControls() {
  function expand(open: boolean) {
    document.querySelectorAll<HTMLDetailsElement>('#tottenham-showcase details').forEach(detail => { detail.open = open })
  }
  function print() {
    const details = [...document.querySelectorAll<HTMLDetailsElement>('#tottenham-showcase details')]
    const state = details.map(detail => detail.open)
    details.forEach(detail => { detail.open = true })
    const restore = () => details.forEach((detail, i) => { detail.open = state[i] })
    window.addEventListener('afterprint', restore, { once: true })
    window.print()
  }
  return <div className="flex flex-wrap gap-2 print:hidden">
    <button className="gaffa-action gaffa-action-secondary" onClick={() => expand(true)}>Expand dossiers</button>
    <button className="gaffa-action gaffa-action-secondary" onClick={() => expand(false)}>Collapse dossiers</button>
    <button className="gaffa-action gaffa-action-primary" onClick={print}><Printer className="h-4 w-4"/>Print / save PDF</button>
  </div>
}

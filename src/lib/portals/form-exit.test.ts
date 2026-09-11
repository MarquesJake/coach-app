import assert from 'node:assert/strict'
import { test } from 'node:test'
import { hasUnsavedRoleForm } from './form-exit.ts'

function changed(controls: object[]) {
  return hasUnsavedRoleForm({ querySelectorAll: () => controls } as unknown as ParentNode)
}

test('saved render values do not prompt, but text edits and restored device drafts do', () => {
  assert.equal(changed([{ tagName: 'TEXTAREA', value: 'Saved', defaultValue: 'Saved' }]), false)
  assert.equal(changed([{ tagName: 'TEXTAREA', value: 'Device draft', defaultValue: 'Saved' }]), true)
  assert.equal(changed([{ tagName: 'INPUT', type: 'hidden', value: 'new-id', defaultValue: 'old-id' }]), false)
})

test('checkboxes, selected files and changed options are retained-work warnings', () => {
  assert.equal(changed([{ tagName: 'INPUT', type: 'checkbox', checked: true, defaultChecked: false }]), true)
  assert.equal(changed([{ tagName: 'INPUT', type: 'file', files: [{}] }]), true)
  assert.equal(changed([{ tagName: 'SELECT', options: [{ selected: true, defaultSelected: false }, { selected: false, defaultSelected: false }] }]), false)
  assert.equal(changed([{ tagName: 'SELECT', options: [{ selected: false, defaultSelected: false }, { selected: true, defaultSelected: false }] }]), true)
})

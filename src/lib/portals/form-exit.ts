/** Compare live controls with their saved render defaults, including restored device drafts. */
export function hasUnsavedRoleForm(root: ParentNode): boolean {
  const controls = root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('form input, form textarea, form select')
  return Array.from(controls).some(control => {
    if (control.tagName === 'SELECT') {
      return Array.from((control as HTMLSelectElement).options).some((option, index, options) =>
        option.selected !== (option.defaultSelected || (!options.some(item => item.defaultSelected) && index === 0)))
    }
    if (control.tagName === 'INPUT') {
      const input = control as HTMLInputElement
      if (['hidden', 'submit', 'button'].includes(input.type)) return false
      if (input.type === 'file') return Boolean(input.files?.length)
      if (['checkbox', 'radio'].includes(input.type)) return input.checked !== input.defaultChecked
    }
    return control.value !== (control as HTMLInputElement | HTMLTextAreaElement).defaultValue
  })
}

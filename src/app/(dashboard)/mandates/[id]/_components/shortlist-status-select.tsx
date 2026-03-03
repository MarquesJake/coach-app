'use client'

import { ConfigSelect } from '@/components/ui/config-select'
import type { ConfigOption } from '@/app/(dashboard)/config/actions'

export function ShortlistStatusSelect({
  options,
  defaultValue = '',
}: {
  options: ConfigOption[]
  defaultValue?: string
}) {
  return (
    <ConfigSelect
      options={options}
      configTable="config_pipeline_stages"
      configLabel="pipeline stages"
      name="status"
      defaultValue={defaultValue}
      placeholder="Select or type status..."
      required
      aria-label="Shortlist status"
    />
  )
}

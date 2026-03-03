import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getConfigList } from '@/lib/db/config'
import { ConfigCrud } from '../_components/ConfigCrud'

export default async function ConfigFormationPresetsPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: items } = await getConfigList(user.id, 'config_formation_presets')

  return (
    <ConfigCrud
      table="config_formation_presets"
      title="Formation presets"
      backHref="/config"
      initialItems={items}
      extraFields={[
        { key: 'formation', label: 'Formation' },
        { key: 'notes', label: 'Notes' },
      ]}
    />
  )
}

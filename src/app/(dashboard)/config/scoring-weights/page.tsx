import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getConfigList } from '@/lib/db/config'
import { ConfigCrud } from '../_components/ConfigCrud'

export const metadata = { title: 'Scoring weights · Config' }


export default async function ConfigScoringWeightsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: items, error } = await getConfigList(user.id, 'config_scoring_weights')

  return (
    <ConfigCrud
      table="config_scoring_weights"
      title="Scoring weights"
      backHref="/config"
      initialItems={items}
      loadError={Boolean(error)}
      extraFields={[
        { key: 'key', label: 'Key', required: true },
        { key: 'weight', label: 'Weight', type: 'number', required: true },
      ]}
    />
  )
}

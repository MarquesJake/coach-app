import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getConfigList } from '@/lib/db/config'
import { ConfigCrud } from '../_components/ConfigCrud'

export const metadata = { title: 'Reputation tiers · Config' }


export default async function ConfigReputationTiersPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: items, error } = await getConfigList(user.id, 'config_reputation_tiers')

  return (
    <ConfigCrud
      table="config_reputation_tiers"
      title="Reputation tiers"
      backHref="/config"
      initialItems={items}
      loadError={Boolean(error)}
    />
  )
}

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getConfigList } from '@/lib/db/config'
import { ConfigCrud } from '../_components/ConfigCrud'

export const metadata = { title: 'Build preference · Config' }


export default async function ConfigBuildPreferencePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: items, error } = await getConfigList(user.id, 'config_build_preferences')

  return (
    <ConfigCrud
      table="config_build_preferences"
      title="Build preference list"
      backHref="/config"
      initialItems={items}
      loadError={Boolean(error)}
    />
  )
}

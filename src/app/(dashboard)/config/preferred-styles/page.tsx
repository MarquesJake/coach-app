import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getConfigList } from '@/lib/db/config'
import { ConfigCrud } from '../_components/ConfigCrud'

export const metadata = { title: 'Preferred styles · Config' }


export default async function ConfigPreferredStylesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: items, error } = await getConfigList(user.id, 'config_preferred_styles')

  return (
    <ConfigCrud
      table="config_preferred_styles"
      title="Preferred styles list"
      backHref="/config"
      initialItems={items}
      loadError={Boolean(error)}
    />
  )
}

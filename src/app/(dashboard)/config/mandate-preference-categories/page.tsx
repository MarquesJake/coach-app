import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getConfigList } from '@/lib/db/config'
import { ConfigCrud } from '../_components/ConfigCrud'

export default async function ConfigMandatePreferenceCategoriesPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: items } = await getConfigList(user.id, 'config_mandate_preference_categories')

  return (
    <ConfigCrud
      table="config_mandate_preference_categories"
      title="Mandate preference categories"
      backHref="/config"
      initialItems={items}
    />
  )
}

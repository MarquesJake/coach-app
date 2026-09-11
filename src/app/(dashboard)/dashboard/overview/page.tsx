import { redirect } from 'next/navigation'

export const metadata = { title: 'Overview · Today' }


export default function DashboardOverviewPage() {
  redirect('/dashboard')
}

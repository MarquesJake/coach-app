// The page in this folder is a client component and cannot export metadata,
// so the title lives on this server layout instead.
export const metadata = { title: 'Coaches' }

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}

import { prisma } from '@/lib/db'
import { toMenuView } from '@/lib/menu-view'
import { MenuScreen } from '@/components/menu/MenuScreen'

export const dynamic = 'force-dynamic'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>
}) {
  const { t } = await searchParams

  // Read straight from the database: a server component fetching its own API
  // route would be a pointless round trip.
  const categories = await prisma.menuCategory.findMany({
    orderBy: { sort: 'asc' },
    include: { items: { where: { available: true }, orderBy: { sort: 'asc' } } },
  })

  return <MenuScreen categories={toMenuView(categories)} tableParam={t ?? null} />
}

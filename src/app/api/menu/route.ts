import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const categories = await prisma.menuCategory.findMany({
    orderBy: { sort: 'asc' },
    include: {
      items: { where: { available: true }, orderBy: { sort: 'asc' } },
    },
  })

  return NextResponse.json({ categories })
}

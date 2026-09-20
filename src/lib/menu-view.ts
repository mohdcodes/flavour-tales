import type { MenuVariant } from '@/data/menu'

/** The shape the server hands to client components. Prisma rows are not serialisable as-is. */
export interface MenuItemView {
  id: string
  slug: string
  name: string
  description: string | null
  basePrice: number
  variants: MenuVariant[] | null
}

export interface MenuCategoryView {
  id: string
  slug: string
  name: string
  subtitle: string | null
  items: MenuItemView[]
}

type PrismaCategory = {
  id: string
  slug: string
  name: string
  subtitle: string | null
  items: {
    id: string
    slug: string
    name: string
    description: string | null
    basePrice: number
    variants: unknown
  }[]
}

export function toMenuView(categories: PrismaCategory[]): MenuCategoryView[] {
  return categories.map((category) => ({
    id: category.id,
    slug: category.slug,
    name: category.name,
    subtitle: category.subtitle,
    items: category.items.map((item) => ({
      id: item.id,
      slug: item.slug,
      name: item.name,
      description: item.description,
      basePrice: item.basePrice,
      variants: (item.variants as MenuVariant[] | null) ?? null,
    })),
  }))
}

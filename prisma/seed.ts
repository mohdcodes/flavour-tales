import { PrismaClient, Prisma } from '@prisma/client'
import { MENU } from '../src/data/menu'

const prisma = new PrismaClient()

// Idempotent, so it can run on every deploy.
async function main() {
  for (const [categoryIndex, category] of MENU.entries()) {
    const saved = await prisma.menuCategory.upsert({
      where: { slug: category.slug },
      create: {
        slug: category.slug,
        name: category.name,
        subtitle: category.subtitle,
        sort: categoryIndex,
      },
      update: {
        name: category.name,
        subtitle: category.subtitle,
        sort: categoryIndex,
      },
    })

    for (const [itemIndex, item] of category.items.entries()) {
      await prisma.menuItem.upsert({
        where: { slug: item.slug },
        create: {
          slug: item.slug,
          name: item.name,
          description: item.description,
          basePrice: item.basePrice,
          variants: (item.variants ?? undefined) as Prisma.InputJsonValue | undefined,
          sort: itemIndex,
          categoryId: saved.id,
        },
        update: {
          name: item.name,
          description: item.description,
          basePrice: item.basePrice,
          variants: (item.variants ?? undefined) as Prisma.InputJsonValue | undefined,
          sort: itemIndex,
          categoryId: saved.id,
        },
      })
    }
  }

  const categories = await prisma.menuCategory.count()
  const items = await prisma.menuItem.count()
  console.log(`Seeded ${categories} categories and ${items} items.`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

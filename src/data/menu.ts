export interface MenuVariant {
  key: string
  label: string
  price: number
}

export interface MenuItemSeed {
  slug: string
  name: string
  description?: string
  /** Price when no variant is chosen. When variants exist this equals variants[0].price. */
  basePrice: number
  variants?: MenuVariant[]
}

export interface MenuCategorySeed {
  slug: string
  name: string
  subtitle?: string
  items: MenuItemSeed[]
}

const steamOrFry = (steam: number, fry: number): MenuVariant[] => [
  { key: 'steam', label: 'Steam', price: steam },
  { key: 'fry', label: 'Fry', price: fry },
]

const steamOrPantoss = (steam: number, pantoss: number): MenuVariant[] => [
  { key: 'steam', label: 'Steam', price: steam },
  { key: 'pantoss', label: 'Pantoss', price: pantoss },
]

/**
 * Item slugs are category-qualified: three different categories each contain an
 * item named "Cheese Corn Momos" at three different prices, so an unqualified
 * slug would collide.
 *
 * Source: the flavor&tales Google Business menu plus a photograph of the
 * in-store board (January 2026). The board carries variant price columns that
 * the Google listing drops.
 */
export const MENU: MenuCategorySeed[] = [
  {
    slug: 'steam-momos',
    name: 'Steam Momos',
    items: [
      {
        slug: 'steam-veg-momos',
        name: 'Veg Momos',
        basePrice: 70,
        variants: steamOrFry(70, 80),
      },
      {
        slug: 'steam-cheese-corn-momos',
        name: 'Cheese Corn Momos',
        basePrice: 90,
        variants: steamOrFry(90, 110),
      },
      {
        slug: 'steam-paneer-momos',
        name: 'Paneer Momos',
        basePrice: 90,
        variants: steamOrFry(90, 110),
      },
      {
        slug: 'steam-veg-cheese-momos',
        name: 'Veg Cheese Momos',
        basePrice: 100,
        variants: steamOrFry(100, 110),
      },
    ],
  },
  {
    slug: 'pantoss-momos',
    name: 'Pantoss Momos',
    items: [
      { slug: 'pantoss-veg-momos', name: 'Veg Pantoss Momos', basePrice: 80 },
      { slug: 'pantoss-paneer-momos', name: 'Paneer Pantoss Momos', basePrice: 115 },
      { slug: 'pantoss-veg-cheese-momos', name: 'Veg Cheese Pantoss Momos', basePrice: 115 },
      { slug: 'pantoss-cheese-corn-momos', name: 'Cheese Corn Momos', basePrice: 115 },
    ],
  },
  {
    slug: 'crispy-momos',
    name: 'Crispy Momos',
    items: [
      { slug: 'crispy-veg-momos', name: 'Veg Crispy Momos', basePrice: 110 },
      { slug: 'crispy-cheese-corn-momos', name: 'Cheese Corn Momos', basePrice: 130 },
      { slug: 'crispy-paneer-momos', name: 'Paneer Crispy Momos', basePrice: 130 },
      { slug: 'crispy-cheese-momos', name: 'Cheese Crispy Momos', basePrice: 130 },
    ],
  },
  {
    slug: 'chefs-special',
    name: "Chef's Special",
    subtitle: 'Millet Momos',
    items: [
      {
        slug: 'ragi-veg-momos',
        name: 'Ragi Veg Momos',
        basePrice: 150,
        variants: steamOrPantoss(150, 165),
      },
      {
        slug: 'ragi-paneer-momos',
        name: 'Ragi Paneer Momos',
        basePrice: 180,
        variants: steamOrPantoss(180, 195),
      },
    ],
  },
  {
    slug: 'cheese-corner',
    name: 'Cheese Corner',
    items: [
      {
        slug: 'corn-cheese-samosa-3',
        name: 'Corn Cheese Samosa',
        description: '3 pieces',
        basePrice: 55,
      },
      {
        slug: 'corn-cheese-samosa-6',
        name: 'Corn Cheese Samosa',
        description: '6 pieces',
        basePrice: 105,
      },
    ],
  },
  {
    slug: 'maggie',
    name: 'Maggie',
    items: [
      { slug: 'classic-maggie', name: 'Classic Maggie', basePrice: 50 },
      { slug: 'double-masala-maggie', name: 'Double Masala Maggie', basePrice: 60 },
      { slug: 'veg-butter-maggie', name: 'Veg Butter Maggie', basePrice: 70 },
      { slug: 'cheese-maggie', name: 'Cheese Maggie', basePrice: 90 },
    ],
  },
  {
    slug: 'desert',
    name: 'Desert',
    items: [
      { slug: 'classic-brownie', name: 'Classic Brownie', basePrice: 100 },
      { slug: 'lotus-biscoff', name: 'Lotus Biscoff', basePrice: 120 },
      { slug: 'cookie-dough', name: 'Cookie Dough', basePrice: 130 },
      {
        slug: 'brownie-ice-cream',
        name: 'Brownie with Ice-Cream',
        description: 'Vanilla or choco chip',
        basePrice: 140,
      },
    ],
  },
  {
    slug: 'combos',
    name: "Combo's",
    items: [
      { slug: 'combo-maggie-veg-steam', name: 'Maggie + Veg Steam Momos', basePrice: 90 },
      {
        slug: 'combo-masala-maggie-veg-fried',
        name: 'Double Masala Maggie + Veg Fried Momos',
        basePrice: 100,
      },
      {
        slug: 'combo-cheese-maggie-samosa',
        name: 'Cheese Maggie + Cheese Corn Samosa',
        basePrice: 110,
      },
      {
        slug: 'combo-chefs-cheese-platter',
        name: "Chef's Special Cheese Platter",
        description: 'Corn cheese samosa (2) + cheese fry momos (3) + cheese maggie (1)',
        basePrice: 140,
      },
    ],
  },
]

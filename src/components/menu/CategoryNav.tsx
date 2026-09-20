'use client'

import { useEffect, useRef, useState } from 'react'
import type { MenuCategoryView } from '@/lib/menu-view'

export function CategoryNav({ categories }: { categories: MenuCategoryView[] }) {
  const [active, setActive] = useState(categories[0]?.slug ?? '')
  const navRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sections = categories
      .map((category) => document.getElementById(category.slug))
      .filter((element): element is HTMLElement => element !== null)

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting)
        if (visible) setActive(visible.target.id)
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 },
    )

    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [categories])

  // Keep the active chip in view as the page scrolls past sections.
  useEffect(() => {
    navRef.current
      ?.querySelector(`[data-slug="${active}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [active])

  return (
    <div className="sticky top-0 z-20 -mx-5 bg-paper/90 px-5 py-2.5 backdrop-blur">
      <div
        ref={navRef}
        className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {categories.map((category) => {
          const isActive = category.slug === active
          return (
            <button
              key={category.slug}
              type="button"
              data-slug={category.slug}
              onClick={() =>
                document
                  .getElementById(category.slug)
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
              className={[
                'shrink-0 rounded-pill px-3.5 py-1.5 font-display text-[0.8rem] font-semibold whitespace-nowrap transition-colors',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600',
                isActive ? 'bg-violet-600 text-white' : 'bg-violet-100 text-violet-700',
              ].join(' ')}
            >
              {category.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}

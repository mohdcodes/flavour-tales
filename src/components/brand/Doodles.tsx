/**
 * Traced from the flavor&tales menu board: white single-weight strokes, rounded
 * caps, no fills. Every path uses currentColor so a doodle inherits colour from
 * its container and can be tinted anywhere it is used.
 */

export type DoodleName =
  | 'dumpling'
  | 'steam'
  | 'star'
  | 'sparkle'
  | 'bowl'
  | 'brownie'
  | 'noodles'
  | 'samosa'

const PATHS: Record<DoodleName, string[]> = {
  dumpling: [
    'M8.5 34.5c0-9.6 6.9-17.4 15.5-17.4s15.5 7.8 15.5 17.4',
    'M6 34.5h36',
    'M15.4 23.6c2.2 3 3 7.4 2.6 10.9',
    'M24 18.2c1.1 4.6 1.4 11.2 1.1 16.3',
    'M32.6 23.6c-2.2 3-3 7.4-2.6 10.9',
  ],
  steam: [
    'M16 37c-3.2-4 3.2-6.4 0-10.4s3.2-6.4 0-10.4',
    'M24 34c-3.2-4.4 3.2-7 0-11.4s3.2-7 0-11.4',
    'M32 37c-3.2-4 3.2-6.4 0-10.4s3.2-6.4 0-10.4',
  ],
  star: ['M24 6.5c2.1 9.4 8 15.3 17.5 17.5C32 26.2 26.1 32.1 24 41.5c-2.1-9.4-8-15.3-17.5-17.5C16 21.8 21.9 15.9 24 6.5z'],
  sparkle: ['M24 14c1.3 5.6 4.4 8.7 10 10-5.6 1.3-8.7 4.4-10 10-1.3-5.6-4.4-8.7-10-10 5.6-1.3 8.7-4.4 10-10z'],
  bowl: [
    'M7 21.5h34',
    'M9 21.5c1.1 9.8 7 16.9 15 16.9s13.9-7.1 15-16.9',
    'M27.5 7.5 39 18',
    'M31.5 5.5 41 16.5',
  ],
  brownie: [
    'M11.5 20.5 24 14l12.5 6.5L24 27z',
    'M11.5 20.5v9.2L24 36.2l12.5-6.5v-9.2',
    'M24 27v9.2',
  ],
  noodles: [
    'M9 30c4.2-5.4 9.4 5.4 13.6 0s9.4 5.4 13.6 0',
    'M9 36.5c4.2-5.4 9.4 5.4 13.6 0s9.4 5.4 13.6 0',
    'M30 8v14',
    'M25.5 6v7',
    'M34.5 6v7',
  ],
  samosa: ['M24 11 39 37H9z', 'M24 11v26', 'M16 26h16'],
}

export function Doodle({
  name,
  className,
  style,
}: {
  name: DoodleName
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      style={style}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}

// Fixed offsets, not random: the layout must be identical between the server
// and client render.
const SCATTER: { name: DoodleName; top: string; left: string; size: string; rotate: number }[] = [
  { name: 'dumpling', top: '-8%', left: '4%', size: 'h-20 w-20', rotate: -14 },
  { name: 'star', top: '12%', left: '78%', size: 'h-10 w-10', rotate: 8 },
  { name: 'steam', top: '46%', left: '26%', size: 'h-14 w-14', rotate: -6 },
  { name: 'sparkle', top: '68%', left: '62%', size: 'h-8 w-8', rotate: 22 },
  { name: 'noodles', top: '58%', left: '86%', size: 'h-16 w-16', rotate: -18 },
  { name: 'samosa', top: '74%', left: '10%', size: 'h-12 w-12', rotate: 12 },
]

export function DoodleField({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ''}`}
    >
      {SCATTER.map((item) => (
        <Doodle
          key={`${item.name}-${item.left}`}
          name={item.name}
          className={`absolute ${item.size} opacity-[0.14]`}
          style={{
            top: item.top,
            left: item.left,
            transform: `rotate(${item.rotate}deg)`,
          }}
        />
      ))}
    </div>
  )
}

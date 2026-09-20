/**
 * Only shows in the desktop gutters. Without it the app reads as a stretched
 * phone screen floating on flat paper.
 */
export function AppBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 hidden bg-violet-100/50 md:block"
    >
      <svg className="h-full w-full text-violet-600/25" aria-hidden="true">
        <defs>
          <pattern
            id="ft-doodle-tile"
            width="160"
            height="160"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-8)"
          >
            <g
              fill="none"
              stroke="currentColor"
              strokeWidth={1.4}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* dumpling */}
              <path d="M14 58c0-9.6 6.9-17.4 15.5-17.4S45 48.4 45 58" />
              <path d="M11 58h37" />
              <path d="M21 47c2.2 3 3 7.4 2.6 10.9" />
              <path d="M38 47c-2.2 3-3 7.4-2.6 10.9" />
              {/* sparkle */}
              <path d="M112 26c1.3 5.6 4.4 8.7 10 10-5.6 1.3-8.7 4.4-10 10-1.3-5.6-4.4-8.7-10-10 5.6-1.3 8.7-4.4 10-10z" />
              {/* steam */}
              <path d="M40 132c-3.2-4 3.2-6.4 0-10.4s3.2-6.4 0-10.4" />
              <path d="M52 128c-3.2-4.4 3.2-7 0-11.4s3.2-7 0-11.4" />
              {/* samosa */}
              <path d="M118 96l11 19h-22z" />
              <path d="M118 96v19" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#ft-doodle-tile)" />
      </svg>
    </div>
  )
}

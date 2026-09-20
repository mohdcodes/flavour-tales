/**
 * A plate of momos with steam pouring off them. Same hand-drawn line-art
 * vocabulary as the menu board, so a wait still looks like flavor&tales rather
 * than like a spinner.
 *
 * The momos are always fully drawn. An earlier version traced itself in stroke
 * by stroke and got caught half-finished, which read as broken.
 *
 * Pure SVG + CSS (keyframes live in globals.css), so this stays a server
 * component and costs nothing on the client.
 */
export function MomoLoader({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={`momo-loader ${className ?? ''}`}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {/* steam, rising off the back momo */}
      <g strokeWidth={2}>
        <g data-steam style={{ animationDelay: '0s' }}>
          <path d="M15.5 22c-3.2-3 3.2-5.6 0-8.6" />
        </g>
        <g data-steam style={{ animationDelay: '0.7s' }}>
          <path d="M24 20c-3.6-3.4 3.6-6.2 0-9.6" />
        </g>
        <g data-steam style={{ animationDelay: '1.4s' }}>
          <path d="M32.5 22c-3.2-3 3.2-5.6 0-8.6" />
        </g>
      </g>

      <g strokeWidth={1.8}>
        {/* back momo, sitting higher than the front pair */}
        <g data-bob style={{ animationDelay: '0.3s' }}>
          <path d="M16.5 31.6c0-4.3 3.4-7.8 7.5-7.8s7.5 3.5 7.5 7.8" />
          <path d="M16.5 31.6h15" />
          <path d="M20.6 25.7c.6 2 .8 4.1.6 5.9" />
          <path d="M27.4 25.7c-.6 2-.8 4.1-.6 5.9" />
        </g>

        {/* front-left momo */}
        <g data-bob style={{ animationDelay: '0s' }}>
          <path d="M6 38.4c0-4.1 3.2-7.5 7.2-7.5s7.2 3.4 7.2 7.5" />
          <path d="M9.6 32.6c.4 2.2.5 4.1.4 5.8" />
          <path d="M16.8 32.6c-.4 2.2-.5 4.1-.4 5.8" />
        </g>

        {/* front-right momo */}
        <g data-bob style={{ animationDelay: '0.6s' }}>
          <path d="M27.6 38.4c0-4.1 3.2-7.5 7.2-7.5s7.2 3.4 7.2 7.5" />
          <path d="M31.2 32.6c.4 2.2.5 4.1.4 5.8" />
          <path d="M38.4 32.6c-.4 2.2-.5 4.1-.4 5.8" />
        </g>

        {/* the plate */}
        <path d="M4.5 38.4h39" />
        <path d="M9 38.4c2.6 3 7.2 4.6 15 4.6s12.4-1.6 15-4.6" />
      </g>
    </svg>
  )
}

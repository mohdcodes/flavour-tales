import path from 'node:path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  // This app sits inside the Cosmo repo but is not part of its pnpm workspace.
  // Without this, Next walks up, finds the Cosmo lockfile, and traces the wrong
  // root into the standalone bundle.
  outputFileTracingRoot: path.resolve(process.cwd()),
}

export default nextConfig

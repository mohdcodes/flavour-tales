// Prisma's client does not read .env at runtime (only the CLI does), and Vitest
// does not load it either. Node 24 can do it without a dependency.
try {
  process.loadEnvFile('.env')
} catch {
  // No .env present — CI and pure unit tests do not need one.
}

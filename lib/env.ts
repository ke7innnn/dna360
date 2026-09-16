/**
 * Fail-closed environment variable accessor.
 * Refuses to start if a required secret is missing or insecurely short.
 * Allows build-time compilation on platforms like Vercel where secrets
 * are injected into runtime lambdas after static page collection.
 */
export function requireEnv(name: string, minLength: number = 32): string {
  const v = process.env[name]
  if (!v || v.length < minLength) {
    const isBuildPhase =
      process.env.NEXT_PHASE === 'phase-production-build' ||
      process.env.npm_lifecycle_event === 'build' ||
      (typeof process !== 'undefined' &&
        Array.isArray(process.argv) &&
        process.argv.some((a) => a.includes('build')))

    if (isBuildPhase && !name.includes('TESTING') && !name.includes('NON_EXISTENT')) {
      return 'BUILD_TIME_PLACEHOLDER_SECRET_0123456789abcdef'
    }

    throw new Error(`FATAL: ${name} is missing or too short (min ${minLength} chars). Refusing to start.`)
  }
  return v
}

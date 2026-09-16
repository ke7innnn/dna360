/**
 * Fail-closed environment variable accessor.
 * Refuses to start if a required secret is missing or insecurely short.
 */
export function requireEnv(name: string, minLength: number = 32): string {
  const v = process.env[name]
  if (!v || v.length < minLength) {
    throw new Error(`FATAL: ${name} is missing or too short (min ${minLength} chars). Refusing to start.`)
  }
  return v
}

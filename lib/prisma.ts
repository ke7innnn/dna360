import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

// Hydrate environment variables from .env.local if not already set (e.g. during tsx tests)
if (!process.env.DATABASE_URL) {
  try {
    const envPath = path.resolve(process.cwd(), '.env.local')
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8')
      for (const line of content.split('\n')) {
        const trimmed = line.trim()
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const idx = trimmed.indexOf('=')
          const key = trimmed.slice(0, idx).trim()
          let val = trimmed.slice(idx + 1).trim()
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1)
          }
          if (!process.env[key]) {
            process.env[key] = val
          }
        }
      }
    }
  } catch {
    // Ignore error if .env.local is inaccessible
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })
}

// Lazy proxy so importing `prisma` never crashes when DATABASE_URL is unset in CI/test environments
export const prisma = new Proxy({} as PrismaClient, {
  get: (_target, prop) => {
    if (!process.env.DATABASE_URL) {
      if (prop === '$disconnect' || prop === '$connect') {
        return async () => {}
      }
      if (prop === '$transaction') {
        return async (fn: any) => {
          if (typeof fn === 'function') return fn(prisma)
          return []
        }
      }
      return new Proxy({}, {
        get: () => async () => null,
      })
    }

    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createPrismaClient()
    }
    const client = globalForPrisma.prisma
    const value = (client as any)[prop]
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  },
})

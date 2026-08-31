import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, it, expect, vi } from 'vitest'
import {
  generateFixture,
  HEALTHY_CONFIG,
  fixtureToUploadedFiles,
} from '../fixtures/generator'
import { processUploadedFiles } from '../pipeline/process-archive'

const srcRoot = join(process.cwd(), 'src')

const FORBIDDEN_PATTERNS = [
  /\bfetch\s*\(/,
  /\bXMLHttpRequest\b/,
  /\bnavigator\.sendBeacon\b/,
  /\bnew\s+WebSocket\b/,
  /\baxios\b/,
  /\bposthog\b/i,
  /\bsentry\b/i,
  /\bsegment\b/i,
  /\bgtag\s*\(/,
  /\bgoogle-analytics\b/i,
  /\bmixpanel\b/i,
  /\bhotjar\b/i,
  /\bamplitude\b/i,
  /\bbugsnag\b/i,
  /\brollbar\b/i,
  /\bdatadog\b/i,
  /\bnewrelic\b/i,
]

function collectSourceFiles(dir: string): string[] {
  const entries = readdirSync(dir)
  const files: string[] = []

  for (const entry of entries) {
    const fullPath = join(dir, entry)
    const stat = statSync(fullPath)
    if (stat.isDirectory()) {
      files.push(...collectSourceFiles(fullPath))
      continue
    }
    if (/\.(ts|tsx)$/.test(entry) && !entry.endsWith('.test.ts') && !entry.endsWith('.test.tsx')) {
      files.push(fullPath)
    }
  }

  return files
}

describe('local processing privacy guarantees', () => {
  it('application source contains no network or telemetry APIs', () => {
    const files = collectSourceFiles(srcRoot)
    const violations: string[] = []

    for (const file of files) {
      const content = readFileSync(file, 'utf8')
      const rel = relative(srcRoot, file)

      for (const pattern of FORBIDDEN_PATTERNS) {
        if (pattern.test(content)) {
          violations.push(`${rel}: matched ${pattern}`)
        }
      }
    }

    expect(violations, violations.join('\n')).toEqual([])
  })

  it('archive processing does not call fetch', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    try {
      const fixture = generateFixture(HEALTHY_CONFIG)
      const files = fixtureToUploadedFiles(fixture)
      await processUploadedFiles(files)
      expect(fetchSpy).not.toHaveBeenCalled()
    } finally {
      vi.unstubAllGlobals()
    }
  })
})

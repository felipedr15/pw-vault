import { PASSWORD_GROUPS } from './constants'

function randomIndex(maxExclusive: number): number {
  const limit = Math.floor(256 / maxExclusive) * maxExclusive
  const byte = new Uint8Array(1)
  do { crypto.getRandomValues(byte) } while (byte[0] >= limit)
  return byte[0] % maxExclusive
}

function shuffleSecure(values: string[]): string[] {
  const shuffled = [...values]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = randomIndex(index + 1)
    ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
  }
  return shuffled
}

export function generatePassword(length: number): string {
  const safeLength = Math.max(length, PASSWORD_GROUPS.length)
  const chars = PASSWORD_GROUPS.join('')
  const required = PASSWORD_GROUPS.map((group) => group[randomIndex(group.length)])
  const remaining = Array.from({ length: safeLength - required.length }, () => chars[randomIndex(chars.length)])
  return shuffleSecure([...required, ...remaining]).join('')
}

export function normalizeHeader(value: string): string {
  return value.toLowerCase().replace(/\s+/g, '').trim()
}

export function toText(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value).trim()
}

export function getPasswordStrength(value: string): { label: string; score: number } {
  if (!value) return { label: 'Empty', score: 0 }
  let score = 0
  if (value.length >= 10) score += 1
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1
  if (/\d/.test(value)) score += 1
  if (/[^A-Za-z0-9]/.test(value)) score += 1
  return { label: ['Weak', 'Fair', 'Good', 'Strong'][Math.max(0, score - 1)], score }
}

export function getPasswordAge(updatedAt: string): number {
  return Math.floor((Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24))
}

export function getFaviconUrl(website: string): string {
  try {
    const url = new URL(website.startsWith('http') ? website : `https://${website}`)
    return `https://www.google.com/s2/favicons?sz=32&domain=${url.hostname}`
  } catch {
    return ''
  }
}

export async function lazyLoadXLSX() {
  const { read, utils } = await import('xlsx')
  return { read, utils }
}

export async function copyToClipboard(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value)
    setTimeout(() => navigator.clipboard.writeText('').catch(() => {}), 30_000)
    return true
  } catch {
    return false
  }
}

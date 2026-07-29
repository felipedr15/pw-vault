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

export function guessIconUrl(title: string, website: string): string {
  if (website) return getFaviconUrl(website)
  // Try to guess a domain from the title
  const clean = title.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim()
  if (!clean) return ''
  // Common brand mappings
  const brandMap: Record<string, string> = {
    'amazon': 'amazon.com', 'att': 'att.com', 'at&t': 'att.com',
    'apple': 'apple.com', 'bank of america': 'bankofamerica.com',
    'capital one': 'capitalone.com', 'capitalone': 'capitalone.com',
    'chase': 'chase.com', 'costco': 'costco.com',
    'discord': 'discord.com', 'disney': 'disney.com', 'disney+': 'disney.com',
    'dropbox': 'dropbox.com', 'ebay': 'ebay.com',
    'facebook': 'facebook.com', 'github': 'github.com',
    'gmail': 'gmail.com', 'google': 'google.com',
    'hulu': 'hulu.com', 'instagram': 'instagram.com',
    'linkedin': 'linkedin.com', 'microsoft': 'microsoft.com',
    'netflix': 'netflix.com', 'outlook': 'outlook.com',
    'paypal': 'paypal.com', 'pinterest': 'pinterest.com',
    'reddit': 'reddit.com', 'spotify': 'spotify.com',
    'steam': 'steampowered.com', 'target': 'target.com',
    'tiktok': 'tiktok.com', 'twitch': 'twitch.tv',
    'twitter': 'twitter.com', 'x': 'x.com',
    'uber': 'uber.com', 'venmo': 'venmo.com',
    'verizon': 'verizon.com', 'walmart': 'walmart.com',
    'wells fargo': 'wellsfargo.com', 'whatsapp': 'whatsapp.com',
    'yahoo': 'yahoo.com', 'youtube': 'youtube.com',
    'zoom': 'zoom.us', 'tmobile': 'tmobile.com', 't-mobile': 'tmobile.com',
    'spectrum': 'spectrum.net', 'comcast': 'xfinity.com', 'xfinity': 'xfinity.com',
    'usaa': 'usaa.com', 'citi': 'citi.com', 'citibank': 'citi.com',
    'schwab': 'schwab.com', 'fidelity': 'fidelity.com',
    'robinhood': 'robinhood.com', 'coinbase': 'coinbase.com',
  }
  // Check exact match first
  const lower = title.toLowerCase().trim()
  if (brandMap[lower]) return getFaviconUrl(brandMap[lower])
  // Check if title contains a known brand
  for (const [brand, domain] of Object.entries(brandMap)) {
    if (lower.includes(brand)) return getFaviconUrl(domain)
  }
  // Last resort: try title as a domain directly (e.g. "hbo" → hbo.com)
  const slug = clean.replace(/\s+/g, '')
  return `https://www.google.com/s2/favicons?sz=32&domain=${slug}.com`
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

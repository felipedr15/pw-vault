import type { EncryptedBlob, VaultPayload } from '../types'

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunkSize = 0x8000
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.slice(index, index + chunkSize))
  }
  return btoa(binary)
}

export function base64ToBytes(value: string): Uint8Array {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0))
}

export function bytesToBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.slice().buffer
}

export async function deriveKey(masterPassword: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(masterPassword),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: 250000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function deriveBiometricWrappingKey(secret: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey('raw', bytesToBuffer(secret), { name: 'HKDF' }, false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      salt: encoder.encode('password-vault-biometric-v1'),
      info: encoder.encode('master-password-wrap'),
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function encryptVault(masterPassword: string, payload: VaultPayload): Promise<string> {
  const encoder = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(masterPassword, salt)
  const plaintext = encoder.encode(JSON.stringify(payload))
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext)
  return JSON.stringify({
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    data: bytesToBase64(new Uint8Array(encrypted)),
    version: 1,
  })
}

export async function decryptVault(masterPassword: string, vaultBlob: string): Promise<VaultPayload> {
  const parsed = JSON.parse(vaultBlob) as EncryptedBlob
  if (!parsed.salt) throw new Error('Missing vault salt.')
  const salt = base64ToBytes(parsed.salt)
  const iv = base64ToBytes(parsed.iv)
  const data = base64ToBytes(parsed.data)
  const key = await deriveKey(masterPassword, salt)
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    data as BufferSource,
  )
  return JSON.parse(new TextDecoder().decode(decrypted))
}

export async function wrapMasterPassword(secret: Uint8Array, masterPassword: string): Promise<EncryptedBlob> {
  const encoder = new TextEncoder()
  const key = await deriveBiometricWrappingKey(secret)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(masterPassword))
  return { iv: bytesToBase64(iv), data: bytesToBase64(new Uint8Array(encrypted)), version: 1 }
}

export async function unwrapMasterPassword(secret: Uint8Array, wrapped: EncryptedBlob): Promise<string> {
  const key = await deriveBiometricWrappingKey(secret)
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: bytesToBuffer(base64ToBytes(wrapped.iv)) },
    key,
    bytesToBuffer(base64ToBytes(wrapped.data)),
  )
  return new TextDecoder().decode(decrypted)
}

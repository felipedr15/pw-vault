import type { PrfResults, WebAuthnVaultCredential } from '../types'
import { base64ToBytes, bytesToBase64, bytesToBuffer, unwrapMasterPassword, wrapMasterPassword } from './crypto'
import { WEBAUTHN_KEY } from './constants'

export function getStoredWebAuthnCredential(): WebAuthnVaultCredential | null {
  const stored = localStorage.getItem(WEBAUTHN_KEY)
  if (!stored) return null
  try {
    const parsed = JSON.parse(stored) as Partial<WebAuthnVaultCredential>
    if (!parsed.credentialId || !parsed.prfSalt || !parsed.wrappedMasterPassword) return null
    return parsed as WebAuthnVaultCredential
  } catch { return null }
}

export async function getWebAuthnPrfSecret(credentialId: Uint8Array, prfSalt: Uint8Array): Promise<Uint8Array | null> {
  const assertion = await navigator.credentials.get?.({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      allowCredentials: [{ id: bytesToBuffer(credentialId), type: 'public-key' }],
      timeout: 60000,
      userVerification: 'required',
      extensions: { prf: { eval: { first: bytesToBuffer(prfSalt) } } },
    } as PublicKeyCredentialRequestOptions,
  })
  const results = assertion ? ((assertion as PublicKeyCredential).getClientExtensionResults() as PrfResults) : null
  const prfSecret = results?.prf?.results?.first
  return prfSecret ? new Uint8Array(prfSecret) : null
}

export async function registerWebAuthn(displayName: string, masterPassword: string): Promise<boolean> {
  try {
    if (!window.PublicKeyCredential) return false
    const prfSalt = crypto.getRandomValues(new Uint8Array(32))
    const credential = await navigator.credentials.create?.({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: { name: 'Password Vault' },
        user: { id: crypto.getRandomValues(new Uint8Array(16)), name: displayName, displayName },
        pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
        timeout: 60000,
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          residentKey: 'required',
          userVerification: 'required',
          requireResidentKey: true,
        },
        extensions: { prf: { eval: { first: bytesToBuffer(prfSalt) } } },
      } as PublicKeyCredentialCreationOptions,
    })
    if (!credential) return false
    const credentialId = new Uint8Array((credential as PublicKeyCredential).rawId)
    const secret = await getWebAuthnPrfSecret(credentialId, prfSalt)
    if (!secret) return false
    const wrappedMasterPassword = await wrapMasterPassword(secret, masterPassword)
    localStorage.setItem(
      WEBAUTHN_KEY,
      JSON.stringify({
        credentialId: bytesToBase64(credentialId),
        prfSalt: bytesToBase64(prfSalt),
        wrappedMasterPassword,
        timestamp: Date.now(),
        version: 2,
      } satisfies WebAuthnVaultCredential),
    )
    return true
  } catch { return false }
}

export async function unlockMasterPasswordWithWebAuthn(): Promise<string | null> {
  try {
    if (!window.PublicKeyCredential) return null
    const stored = getStoredWebAuthnCredential()
    if (!stored) return null
    const secret = await getWebAuthnPrfSecret(base64ToBytes(stored.credentialId), base64ToBytes(stored.prfSalt))
    if (!secret) return null
    return await unwrapMasterPassword(secret, stored.wrappedMasterPassword)
  } catch { return null }
}

export function isWebAuthnAvailable(): boolean {
  return !!window.PublicKeyCredential && !!getStoredWebAuthnCredential()
}

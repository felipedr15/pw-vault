export type VaultItem = {
  id: string
  title: string
  username: string
  password: string
  website: string
  notes: string
  tags: string[]
  updatedAt: string
}

export type VaultPayload = {
  items: VaultItem[]
}

export type EncryptedBlob = {
  salt?: string
  iv: string
  data: string
  version: number
}

export type WebAuthnVaultCredential = {
  credentialId: string
  prfSalt: string
  wrappedMasterPassword: EncryptedBlob
  timestamp: number
  version: number
}

export type PrfResults = AuthenticationExtensionsClientOutputs & {
  prf?: {
    enabled?: boolean
    results?: {
      first?: ArrayBuffer
    }
  }
}

export type SortOrder = 'alpha' | 'recent'

export type SyncConfig = {
  workerUrl: string
  token: string
  username: string
}

export type ModalMode = 'view' | 'add' | 'edit' | 'change-password' | null

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export type EntryFormData = {
  title: string
  username: string
  password: string
  website: string
  notes: string
  tags: string[]
}

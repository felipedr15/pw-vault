export const STORAGE_KEY = 'password_vault_blob_v1'
export const WEBAUTHN_KEY = 'password_vault_webauthn'
export const SYNC_KEY = 'password_vault_sync_v1'
export const THEME_KEY = 'password_vault_theme'

export const PASSWORD_GROUPS = [
  'ABCDEFGHJKLMNPQRSTUVWXYZ',
  'abcdefghijkmnpqrstuvwxyz',
  '23456789',
  '!@#$%&*?',
]

export const TAG_OPTIONS = ['Bills', 'Banking', 'Work', 'Personal', 'Social', 'Shopping']

export const isPhone = window.matchMedia('(pointer: coarse)').matches

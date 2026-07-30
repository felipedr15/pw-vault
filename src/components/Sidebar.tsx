import { useState } from 'react'
import type { ChangeEvent } from 'react'
import type { BeforeInstallPromptEvent, SyncConfig } from '../types'
import type { Theme } from '../hooks/useTheme'
import { TAG_OPTIONS } from '../lib/constants'

type SidebarProps = {
  selectedCategory: string
  onSelectCategory: (category: string) => void
  categoryCounts: Record<string, number>
  itemCount: number
  syncConfig: SyncConfig | null
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error'
  onSyncPush: () => void
  onSyncDisconnect: () => void
  onSyncOpen: () => void
  syncOpen: boolean
  webauthnAvailable: boolean
  onRegisterBiometric: () => void
  onExcelImport: () => void
  onExport: () => void
  onRestore: () => void
  onLock: () => void
  onChangePassword: () => void
  theme: Theme
  toggleTheme: () => void
  installPrompt: BeforeInstallPromptEvent | null
  onInstall: () => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
  backupFileRef: React.RefObject<HTMLInputElement | null>
  onExcelFileChange: (e: ChangeEvent<HTMLInputElement>) => void
  onBackupFileChange: (e: ChangeEvent<HTMLInputElement>) => void
}

export function Sidebar({
  selectedCategory,
  onSelectCategory,
  categoryCounts,
  itemCount,
  syncConfig,
  syncStatus,
  onSyncPush,
  onSyncDisconnect,
  onSyncOpen,
  syncOpen,
  webauthnAvailable,
  onRegisterBiometric,
  onExcelImport,
  onExport,
  onRestore,
  onLock,
  onChangePassword,
  theme,
  toggleTheme,
  installPrompt,
  onInstall,
  fileInputRef,
  backupFileRef,
  onExcelFileChange,
  onBackupFileChange,
}: SidebarProps) {
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h1>Password Vault</h1>
        {installPrompt && (
          <button type="button" className="secondary small" onClick={onInstall}>Install</button>
        )}
        <button
          type="button"
          className="settings-gear"
          onClick={() => setSettingsOpen((v) => !v)}
          aria-label="Toggle settings"
          aria-expanded={settingsOpen}
        >
          ⚙️
        </button>
      </div>

      <nav className="sidebar-nav">
        <button
          type="button"
          className={`nav-item ${selectedCategory === 'all' ? 'active' : ''}`}
          onClick={() => onSelectCategory('all')}
        >
          <span>All Items</span>
          <span className="nav-count">{itemCount}</span>
        </button>
        {TAG_OPTIONS.map((tag) => (
          <button
            key={tag}
            type="button"
            className={`nav-item ${selectedCategory === tag ? 'active' : ''}`}
            onClick={() => onSelectCategory(tag)}
          >
            <span>{tag}</span>
            {categoryCounts[tag] ? <span className="nav-count">{categoryCounts[tag]}</span> : null}
          </button>
        ))}
      </nav>

      <div className={`sidebar-footer ${settingsOpen ? 'settings-visible' : ''}`}>
        <div className="sync-bar">
          {syncConfig ? (
            <div className="sync-info">
              <span className={`sync-dot sync-dot--${syncStatus}`} />
              <span className="sync-user">{syncConfig.username}</span>
              <button type="button" className="secondary small" onClick={onSyncPush}>Sync</button>
              <button type="button" className="secondary small danger-text" onClick={onSyncDisconnect}>Disconnect</button>
            </div>
          ) : (
            <button type="button" className="secondary small full-width" onClick={onSyncOpen}>
              {syncOpen ? 'Cancel Sync Setup' : 'Enable Cloud Sync'}
            </button>
          )}
        </div>
        <div className="sidebar-actions">
          {!webauthnAvailable && (
            <button type="button" className="secondary small" onClick={onRegisterBiometric}>Set up Biometric</button>
          )}
          <button type="button" className="secondary small" onClick={onExcelImport}>Import Excel</button>
          <button type="button" className="secondary small" onClick={onExport}>Export</button>
          <button type="button" className="secondary small" onClick={onRestore}>Restore</button>
          <button type="button" className="secondary small" onClick={onChangePassword}>Change Password</button>
          <button type="button" className="secondary small" onClick={onLock}>Lock now</button>
          <button type="button" className="theme-toggle" onClick={toggleTheme}>
            <span className="theme-toggle-icon">{theme === 'dark' ? '☀️' : '🌙'}</span>
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={onExcelFileChange} className="hidden" />
      <input ref={backupFileRef} type="file" accept=".json" onChange={onBackupFileChange} className="hidden" />
    </aside>
  )
}

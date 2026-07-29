import { useEffect } from 'react'

export function useAutoLock(isLocked: boolean, lockMinutes: number, onLock: () => void) {
  useEffect(() => {
    if (isLocked) return
    const timeoutMs = lockMinutes * 60 * 1000
    let timeout = window.setTimeout(onLock, timeoutMs)
    const resetLockTimer = () => {
      clearTimeout(timeout)
      timeout = window.setTimeout(onLock, timeoutMs)
    }
    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll']
    events.forEach((eventName) => window.addEventListener(eventName, resetLockTimer, { passive: true }))
    return () => {
      clearTimeout(timeout)
      events.forEach((eventName) => window.removeEventListener(eventName, resetLockTimer))
    }
  }, [isLocked, lockMinutes, onLock])
}

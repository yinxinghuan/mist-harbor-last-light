import { useCallback, useEffect, useRef, useState } from 'react'
import { callAigramAPI, getTelegramId, isInAigramNow, postAigramAPI, type AigramResponse } from '../runtime/bridge'
import { getGameUuid } from '../runtime/game-id'
import { waitForAigramIdentity } from '../runtime/identity-ready'

interface SaveRow { user_id: string; resource_data: string }

/**
 * Platform save bootstrap with a user-scoped local fallback.
 * Story Session becomes authoritative once a session has been enrolled.
 */
export function useGameSave<T>(gameId: string) {
  const [savedData, setSavedData] = useState<T | null | undefined>(undefined)
  const [playerId, setPlayerId] = useState<string | null | undefined>(undefined)
  const pending = useRef<T | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sessionId = getGameUuid()

  useEffect(() => {
    const controller = new AbortController()
    void waitForAigramIdentity({ signal: controller.signal }).then((id) => {
      if (!controller.signal.aborted) setPlayerId(id)
    })
    return () => controller.abort()
  }, [])

  const key = `${gameId}-save:${playerId ? `user:${encodeURIComponent(playerId)}` : 'guest'}`
  const canSync = Boolean(playerId && sessionId)

  useEffect(() => {
    if (playerId === undefined) return
    let cancelled = false
    setSavedData(undefined)
    ;(async () => {
      if (canSync && sessionId && playerId) {
        try {
          const response = await callAigramAPI<AigramResponse<SaveRow[]>>(
            `/note/aigram/ai/game/get/data/list?session_id=${encodeURIComponent(sessionId)}`,
          )
          const mine = (Array.isArray(response?.data) ? response.data : [])
            .find((row) => String(row.user_id) === playerId)
          if (mine?.resource_data) {
            const parsed = JSON.parse(mine.resource_data) as T
            if (!cancelled) setSavedData(parsed)
            return
          }
        } catch { /* use user-scoped local fallback */ }
      }
      try {
        const local = alteruLocalStorage.getItem(key)
        if (local) {
          if (!cancelled) setSavedData(JSON.parse(local) as T)
          return
        }
      } catch { /* empty */ }
      if (!cancelled) setSavedData(null)
    })()
    return () => { cancelled = true }
  }, [canSync, key, playerId, sessionId])

  const flush = useCallback(() => {
    const value = pending.current
    pending.current = null
    timer.current = null
    if (value && canSync && sessionId && isInAigramNow() && getTelegramId() === playerId) {
      postAigramAPI('/note/aigram/ai/game/save/data', {
        session_id: sessionId,
        resource_data: JSON.stringify(value),
      })
    }
  }, [canSync, playerId, sessionId])

  const persist = useCallback((value: T) => {
    const stamped = { ...(value as object), _lastActive: Date.now() } as T
    try { alteruLocalStorage.setItem(key, JSON.stringify(stamped)) } catch { /* quota */ }
    if (canSync && isInAigramNow() && getTelegramId() === playerId) {
      pending.current = stamped
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(flush, 1000)
    }
  }, [canSync, flush, key, playerId])

  useEffect(() => () => {
    if (timer.current) {
      clearTimeout(timer.current)
      flush()
    }
  }, [flush])

  const clear = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
    pending.current = null
    try { alteruLocalStorage.removeItem(key) } catch { /* ignore */ }
    if (canSync && sessionId && isInAigramNow() && getTelegramId() === playerId) {
      postAigramAPI('/note/aigram/ai/game/save/data', { session_id: sessionId, resource_data: '' })
    }
    setSavedData(null)
  }, [canSync, key, playerId, sessionId])

  return {
    savedData,
    loaded: playerId !== undefined && savedData !== undefined,
    hasSave: savedData != null,
    persist,
    clear,
    playerId,
  }
}

// Game event reporting through the platform-owned Aigram bridge.
// Keep this adapter aligned with /Users/yin/code/games/shared/runtime/useGameEvent.ts.

import { useCallback } from 'react'
import { isInAigramNow, postAigramAPI } from './bridge'
import { getGameUuid } from './game-id'

export interface UseGameEvent {
  trigger: (event: string, configJson?: object | string) => void
  canEmit: boolean
}

export function useGameEvent(): UseGameEvent {
  const sessionId = getGameUuid()
  const canEmit = isInAigramNow() && Boolean(sessionId)

  const trigger = useCallback((event: string, configJson?: object | string) => {
    if (!isInAigramNow() || !sessionId || !event) return
    const body: { session_id: string; event: string; config_json?: string } = {
      session_id: sessionId,
      event,
    }
    if (configJson != null) body.config_json = typeof configJson === 'string' ? configJson : JSON.stringify(configJson)
    postAigramAPI('/note/aigram/ai/game/record/play', body)
  }, [sessionId])

  return { trigger, canEmit }
}

import { api_origin, getTelegramId, isInAigramNow } from './bridge'

const GUEST_TELEGRAM_ID = '__alteru_guest__'
export const IDENTITY_SYNC_RELEASE = 'alteru-identity-sync-20260822'

export async function waitForAigramIdentity(options: {
  pollMs?: number
  timeoutMs?: number
  signal?: AbortSignal
} = {}): Promise<string | null> {
  document.documentElement.dataset.identitySync = IDENTITY_SYNC_RELEASE
  const read = () => {
    const id = getTelegramId()
    return isInAigramNow() && id && id !== GUEST_TELEGRAM_ID ? id : null
  }
  const immediate = read()
  if (immediate) return immediate
  if (!api_origin) return null
  const pollMs = Math.max(50, options.pollMs ?? 250)
  const deadline = Date.now() + Math.max(0, options.timeoutMs ?? 10_000)
  while (!options.signal?.aborted && Date.now() < deadline) {
    await new Promise<void>((resolve) => window.setTimeout(resolve, pollMs))
    const id = read()
    if (id) return id
  }
  return null
}

import { resolveCartridge } from '../src/story/cartridges'
import { aigramAdapter } from '../src/story/adapters/aigram'
import { executeStoryTurn } from '../src/story/engine/executeTurn'
import { createPrologRuleResolver } from '../src/story/engine/prologRuleClient'
import { normalizeSave } from '../src/story/useStoryEngine'
import { createStorySessionRuntime } from './storySessionRuntime'

const runtime = createStorySessionRuntime({
  gameId: 'mist-harbor-last-light',
  resolveCartridge: locale => resolveCartridge(null, locale),
  normalizeSave,
  executeTurn: executeStoryTurn as any,
  generator: aigramAdapter,
  createDomainResolver: (env: any, context: { sessionId: string; actorId: string }) => {
    const baseUrl = typeof env.RULE_SERVICE_URL === 'string' ? env.RULE_SERVICE_URL.trim() : ''
    const token = typeof env.RULE_SERVICE_TOKEN === 'string' ? env.RULE_SERVICE_TOKEN.trim() : ''
    const required = env.RULE_SERVICE_REQUIRED === 'true'
    if (!baseUrl || !token) {
      if (required) throw new Error('RULE_SERVICE_CONFIGURATION_REQUIRED')
      return undefined
    }
    return createPrologRuleResolver({ baseUrl, token, ...context })
  },
})

export const StorySessionAuthority = runtime.StorySessionAuthority

export async function handleApi(request: Request, env: any) {
  const url = new URL(request.url)
  if (url.pathname.startsWith('/api/story/')) return runtime.handleStoryApi(request, env)
  if (request.method === 'GET' && url.pathname === '/api/health') return Response.json({
    ok: true,
    game: 'mist-harbor-last-light',
    story_session: 'alteru-user-id-v1-experimental+anonymous-capability-v1',
    rule_service: env.RULE_SERVICE_URL && env.RULE_SERVICE_TOKEN ? 'configured' : 'local-fallback',
    rule_service_required: env.RULE_SERVICE_REQUIRED === 'true',
  })
  return new Response('Not Found', { status: 404 })
}

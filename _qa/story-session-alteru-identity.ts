import assert from 'node:assert/strict'
import { createStorySessionRuntime } from '../worker/storySessionRuntime'

const owners: Array<{ owner: string; authorization: string | null; userId: string | null }> = []
const runtime = createStorySessionRuntime({
  gameId: 'mist-harbor-last-light',
  resolveCartridge: () => ({}),
  normalizeSave: (save: any) => save,
  executeTurn: async ({ save }: any) => ({ save, source: 'fixture' }),
  generator: {},
})
const env = {
  STORY_SESSIONS: {
    idFromName(name: string) { assert.equal(name, 'authority-v1'); return name },
    get() {
      return {
        async fetch(request: Request) {
          owners.push({
            owner: request.headers.get('X-Story-Owner') ?? '',
            authorization: request.headers.get('Authorization'),
            userId: request.headers.get('X-AlterU-User-ID'),
          })
          return Response.json({ ok: true })
        },
      }
    },
  },
}

async function route(headers: HeadersInit) {
  return runtime.handleStoryApi(new Request('https://game.example/api/story/sessions', { headers }), env)
}

assert.equal((await route({})).status, 401)
assert.equal((await route({ 'X-AlterU-User-ID': '__alteru_guest__' })).status, 401)
assert.equal((await route({ 'X-AlterU-User-ID': 'bad user/id' })).status, 401)

assert.equal((await route({ 'X-AlterU-User-ID': 'alteru-user-a' })).status, 200)
assert.equal((await route({ 'X-AlterU-User-ID': 'alteru-user-a' })).status, 200)
assert.equal((await route({ 'X-AlterU-User-ID': 'alteru-user-b' })).status, 200)
const capabilityA = 'A'.repeat(43)
const capabilityB = 'B'.repeat(43)
assert.equal((await route({ Authorization: `Bearer ${capabilityA}` })).status, 200)
assert.equal((await route({ Authorization: `Bearer ${capabilityA}` })).status, 200)
assert.equal((await route({ Authorization: `Bearer ${capabilityB}` })).status, 200)

for (const forwarded of owners) {
  assert.match(forwarded.owner, /^[a-f0-9]{64}$/)
  assert.equal(forwarded.authorization, null, 'raw capability must not reach the authority')
  assert.equal(forwarded.userId, null, 'raw AlterU user id must not reach the authority')
}
assert.equal(owners[0]!.owner, owners[1]!.owner, 'same AlterU user must resolve to the same owner')
assert.notEqual(owners[0]!.owner, owners[2]!.owner, 'different AlterU users must be isolated')
assert.equal(owners[3]!.owner, owners[4]!.owner, 'same guest capability must resolve to the same owner')
assert.notEqual(owners[3]!.owner, owners[5]!.owner, 'different guest capabilities must be isolated')
assert.notEqual(owners[0]!.owner, owners[3]!.owner, 'platform and guest namespaces must not collide')

const health = await runtime.handleStoryApi(new Request('https://game.example/api/story/health'), env)
const healthBody = await health.json() as { identity_mode?: string }
assert.equal(healthBody.identity_mode, 'alteru-user-id-v1-experimental+anonymous-capability-v1')

console.log(JSON.stringify({
  ok: true,
  productionWrites: false,
  checks: [
    'auth-required', 'reserved-guest-rejected', 'invalid-user-id-rejected',
    'same-user-stable-owner', 'cross-user-isolation', 'guest-capability-isolation',
    'identity-namespace-separation', 'raw-identifiers-stripped', 'health-contract',
  ],
}))

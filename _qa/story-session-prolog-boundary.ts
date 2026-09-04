import assert from 'node:assert/strict'
import { mistHarborLastLight } from '../src/story/cartridges/mistHarborLastLight'
import { createInitialSave } from '../src/story/engine/reducer'
import { createPrologRuleResolver } from '../src/story/engine/prologRuleClient'
import { createStorySessionLab } from '../server/storySessionLab'
import { StorySessionClient, createStorySessionHttpTransport } from '../src/story/session/storySessionClient'

let mismatch = false
let ruleCalls = 0
let lastRequestId = ''
const domainResolver = createPrologRuleResolver({
  baseUrl: 'http://127.0.0.1:8080',
  token: 'qa-rule-service-token-that-is-longer-than-thirty-two-bytes',
  sessionId: 'qa-story-session',
  actorId: 'qa-story-owner',
  fetcher: async (_input, init) => {
    ruleCalls += 1
    const body = JSON.parse(String(init?.body))
    lastRequestId = body.request_id
    const effects = [
      { type: 'fact', id: 'lantern-taken', value: true },
      { type: 'inventory', action: 'add', item_id: 'storm-lantern', count: 1 },
      { type: 'objective', value: 'not-authoritative-copy' },
    ]
    if (mismatch) effects.push({ type: 'stat', id: 'trust', delta: 99 })
    return Response.json({ ok: true, request_id: body.request_id, game_id: body.game_id, ruleset_version: 1,
      result: { status: 'accepted', rule_id: body.action_id, effects, reasons: [], next_action_ids: ['inspect-main-relay'] } })
  },
})

const service = createStorySessionLab({
  cartridge: mistHarborLastLight,
  actorTokens: { token: 'owner' },
  domainResolver,
  generator: { async send(): Promise<never> { throw new Error('MODEL_MUST_NOT_RUN_FOR_DOMAIN_ACTION') } },
})

try {
  const { baseUrl } = await service.listen()
  const client = new StorySessionClient(createStorySessionHttpTransport({ apiBase: baseUrl, headers: () => ({ Authorization: 'Bearer token' }) }))
  const initial = createInitialSave(mistHarborLastLight)
  const first = await client.enroll(initial, 'prolog-success-session')
  const pending = client.prepare(first, first.snapshot.choices[0]!.label, 'prolog-action-success')
  const committed = await client.submit(pending)
  assert.equal(lastRequestId, pending.action_id)
  assert.equal(ruleCalls, 1)
  assert.equal(committed.events[0]?.source, 'domain')
  assert.equal(committed.snapshot.facts['lantern-taken'], true)
  assert.equal(committed.snapshot.inventory.some(item => item.id === 'storm-lantern'), true)

  mismatch = true
  const second = await client.enroll(createInitialSave(mistHarborLastLight), 'prolog-mismatch-session')
  const invalid = client.prepare(second, second.snapshot.choices[0]!.label, 'prolog-action-mismatch')
  await assert.rejects(client.submit(invalid), { code: 'RULE_SERVICE_MISMATCH' })
  assert.deepEqual(await client.read(second.session_id), second)
  assert.equal(service.committedCount(), 1, 'mismatched rule effects must not commit')

  console.log(JSON.stringify({ ok: true, liveModelCalled: false, productionWrites: false, checks: [
    'story-action-id-reused-as-rule-request-id', 'rule-decision-precedes-authoritative-commit',
    'local-manifest-supplies-safe-payload', 'mismatched-effect-zero-write', 'domain-action-never-calls-model',
  ] }, null, 2))
} finally { await service.close() }

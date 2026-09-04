import assert from 'node:assert/strict'
import { mistHarborLastLight } from '../src/story/cartridges/mistHarborLastLight'
import { createInitialSave } from '../src/story/engine/reducer'
import { createPrologRuleResolver, projectRuleState } from '../src/story/engine/prologRuleClient'

const token = 'qa-rule-service-token-that-is-longer-than-thirty-two-bytes'
const initial = createInitialSave(mistHarborLastLight)
const projected = projectRuleState(initial, mistHarborLastLight)
assert.deepEqual(Object.keys(projected).sort(), ['characters', 'facts', 'inventory', 'location', 'stats'])
assert.equal(JSON.stringify(projected).includes('你接过夜班'), false)
assert.equal(JSON.stringify(projected).includes('blocks'), false)
assert.equal(projected.location, 'signal-station')

let calls = 0
let received: Record<string, any> | undefined
const accepted = createPrologRuleResolver({
  baseUrl: 'http://127.0.0.1:8080', token, sessionId: 'qa-session', actorId: 'qa-actor',
  fetcher: async (_input, init) => {
    calls += 1
    received = JSON.parse(String(init?.body))
    return Response.json({
      ok: true,
      request_id: received!.request_id,
      game_id: 'mist-harbor-last-light',
      ruleset_version: 1,
      result: {
        status: 'accepted', rule_id: 'take-storm-lantern', reasons: [],
        effects: [
          { type: 'fact', id: 'lantern-taken', value: true },
          { type: 'inventory', action: 'add', item_id: 'storm-lantern', count: 1 },
          { type: 'objective', value: 'server-copy-is-not-trusted' },
        ],
        next_action_ids: ['inspect-main-relay'],
      },
    })
  },
})
const resolution = await accepted({ save: initial, cartridge: mistHarborLastLight, action: initial.choices[0]!.label, requestId: 'stable-action-1' })
assert.equal(resolution?.status, 'accepted')
assert.equal(resolution?.ruleId, 'take-storm-lantern')
assert.equal(resolution?.effects[2]?.type, 'objective')
assert.equal(received?.state.blocks, undefined)
assert.equal(received?.state.objective, undefined)
assert.equal(received?.action_id, 'take-storm-lantern')
assert.equal(received?.session_id, 'qa-session')
assert.equal(received?.actor_id, 'qa-actor')

const repeated = structuredClone(initial)
repeated.facts['lantern-taken'] = true
const rejected = createPrologRuleResolver({
  baseUrl: 'http://localhost:8080', token, sessionId: 'qa-session', actorId: 'qa-actor',
  fetcher: async (_input, init) => {
    const body = JSON.parse(String(init?.body))
    return Response.json({ ok: true, request_id: body.request_id, game_id: body.game_id, ruleset_version: 1,
      result: { status: 'rejected', rule_id: body.action_id, reasons: ['storm_lantern_already_taken'], effects: [], next_action_ids: [] } })
  },
})
assert.equal((await rejected({ save: repeated, cartridge: mistHarborLastLight, action: initial.choices[0]!.label, requestId: 'stable-action-2' }))?.status, 'rejected')

const unknown = await accepted({ save: initial, cartridge: mistHarborLastLight, action: '观察窗框上的雨水', requestId: 'stable-action-3' })
assert.equal(unknown, undefined)
assert.equal(calls, 1, 'ungoverned prose never reaches the rule service')

const mismatched = createPrologRuleResolver({
  baseUrl: 'http://127.0.0.1:8080', token, sessionId: 'qa-session', actorId: 'qa-actor',
  fetcher: async (_input, init) => {
    const body = JSON.parse(String(init?.body))
    return Response.json({ ok: true, request_id: body.request_id, game_id: body.game_id, ruleset_version: 1,
      result: { status: 'accepted', rule_id: body.action_id, reasons: [], next_action_ids: [], effects: [
        { type: 'fact', id: 'lantern-taken', value: true },
        { type: 'inventory', action: 'add', item_id: 'storm-lantern', count: 1 },
        { type: 'objective' },
        { type: 'stat', id: 'trust', delta: 99 },
      ] } })
  },
})
await assert.rejects(mismatched({ save: initial, cartridge: mistHarborLastLight, action: initial.choices[0]!.label, requestId: 'stable-action-4' }), /RULE_SERVICE_MISMATCH/)
assert.throws(() => createPrologRuleResolver({ baseUrl: 'http://public.example.com', token, sessionId: 'qa-session', actorId: 'qa-actor' }), /RULE_SERVICE_CONFIGURATION_REQUIRED/)
assert.throws(() => createPrologRuleResolver({ baseUrl: 'https://rules.example.com', token: 'short', sessionId: 'qa-session', actorId: 'qa-actor' }), /RULE_SERVICE_CONFIGURATION_REQUIRED/)

console.log(JSON.stringify({ ok: true, checks: [
  'bounded-state-projection', 'stable-rule-id', 'localized-payload-stays-local', 'accepted-and-rejected-match',
  'ungoverned-prose-bypasses-prolog', 'extra-effect-fails-closed', 'https-or-loopback-only', 'server-token-required',
  'story-session-and-actor-identity-forwarded',
] }, null, 2))

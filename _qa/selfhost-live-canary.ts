import assert from 'node:assert/strict'
import { mistHarborLastLight } from '../src/story/cartridges/mistHarborLastLight'
import { createInitialSave } from '../src/story/engine/reducer'
import { createStorySessionHttpTransport, StorySessionClient } from '../src/story/session/storySessionClient'

const base = (process.env.SELFHOST_BASE
  ?? 'https://game.aiwaves.tech/8a51d15e-7c00-4e27-bc63-25624ee75ac1').replace(/\/$/, '')
const runId = crypto.randomUUID()
const ownerA = `qa-release-${runId}`
const ownerB = `qa-foreign-${runId}`
const headersA = () => ({ 'X-AlterU-User-ID': ownerA })
const client = new StorySessionClient(createStorySessionHttpTransport({ apiBase: base, headers: headersA, timeoutMs: 30_000 }))

const healthResponse = await fetch(`${base}/api/health`)
assert.equal(healthResponse.status, 200)
const health = await healthResponse.json() as Record<string, unknown>
assert.equal(health.rule_service, 'configured')
assert.equal(health.rule_service_required, true)

const initial = createInitialSave(mistHarborLastLight)
const enrollmentId = `enroll-${runId}`
let head = await client.enroll(initial, enrollmentId)
const enrollmentReplay = await client.enroll(initial, enrollmentId)
assert.equal(enrollmentReplay.session_id, head.session_id)
assert.equal(enrollmentReplay.version, head.version)

const premature = client.prepare(head, '用提灯照开继电器室的窄门', `premature-${runId}`)
head = await client.submit(premature)
assert.equal(head.events.at(-1)?.source, 'domain')
assert.equal(head.snapshot.facts['lantern-uses'], 0)

const first = client.prepare(head, '拿起风暴提灯并试亮', `take-lantern-${runId}`)
const staleVersion = first.expected_version
head = await client.submit(first)
const firstVersion = head.version
const firstReplay = await client.submit(first)
assert.equal(firstReplay.version, firstVersion)
assert.equal(firstReplay.cursor, head.cursor)
assert.equal(firstReplay.events.filter((event) => event.action_id === first.action_id).length, 1)

const staleResponse = await fetch(`${base}/api/story/sessions/${encodeURIComponent(head.session_id)}/turns`, {
  method: 'POST',
  headers: { ...headersA(), 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action_id: `stale-${runId}`,
    expected_version: staleVersion,
    ruleset_version: 1,
    input: { type: 'free-input', text: '检查主控继电器为什么熄灭' },
  }),
})
assert.equal(staleResponse.status, 409)
assert.equal((await staleResponse.json() as Record<string, unknown>).code, 'VERSION_CONFLICT')

for (const action of [
  '检查主控继电器为什么熄灭',
  '问林芮继电器室的备用线在哪里',
  '用提灯照开继电器室的窄门',
  '取下仍然干燥的绝缘铜线',
  '沿值班图板标记返回信号站',
  '打开通往下码头的检修门',
  '请安雅带你取回石缝里的镜片',
  '沿信号站外梯登上聚光室',
  '用铜线、镜片和林芮的接线夹完成修复',
]) {
  head = await client.submit(client.prepare(head, action, `turn-${head.version}-${runId}`))
  assert.equal(head.events.at(-1)?.source, 'domain')
}

assert.equal(head.snapshot.facts['signal-repaired'], true)
assert.equal(head.snapshot.stats.signal, 6)
assert.equal(head.snapshot.stats.trust, 3)
assert.equal(head.snapshot.sessionEnded, true)
assert.equal(head.snapshot.inventory.some((item) => item.id === 'insulated-wire'), false)
assert.equal(head.snapshot.inventory.some((item) => item.id === 'fresnel-fragment'), false)

const reread = await client.read(head.session_id, 0)
assert.equal(reread.version, head.version)
assert.equal(reread.cursor, head.cursor)
assert.equal(reread.events.length, head.cursor)
const directory = await client.list(20)
assert.equal(directory.sessions.some((entry) => entry.session_id === head.session_id), true)

const foreignResponse = await fetch(`${base}/api/story/sessions/${encodeURIComponent(head.session_id)}`, {
  headers: { 'X-AlterU-User-ID': ownerB },
})
assert.equal(foreignResponse.status, 404)
assert.equal((await foreignResponse.json() as Record<string, unknown>).code, 'SESSION_NOT_FOUND')

console.log(JSON.stringify({
  ok: true,
  base,
  sessionId: head.session_id,
  finalVersion: head.version,
  finalCursor: head.cursor,
  signal: head.snapshot.stats.signal,
  trust: head.snapshot.stats.trust,
  completed: head.snapshot.sessionEnded,
  checks: [
    'worker-rule-service-configured',
    'enrollment-idempotency',
    'prolog-rejection-committed-once',
    'action-replay-idempotency',
    'stale-version-conflict',
    'ten-action-prolog-campaign',
    'atomic-item-consumption',
    'durable-reread-and-directory',
    'cross-owner-isolation',
  ],
}, null, 2))

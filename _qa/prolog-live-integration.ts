import assert from 'node:assert/strict'
import { mistHarborLastLight } from '../src/story/cartridges/mistHarborLastLight'
import { executeStoryTurn } from '../src/story/engine/executeTurn'
import { createInitialSave } from '../src/story/engine/reducer'
import { createPrologRuleResolver } from '../src/story/engine/prologRuleClient'

const baseUrl = process.env.RULE_SERVICE_URL ?? 'http://127.0.0.1:18000'
const token = process.env.RULE_SERVICE_TOKEN ?? 'loopback-qa-token-not-for-production-0000000000'
const sessionId = `live-prolog-${Date.now()}`
const actorId = 'alteru-owner-0123456789abcdef0123456789abcdef'
const resolver = createPrologRuleResolver({ baseUrl, token, sessionId, actorId, timeoutMs: 8_000 })
const generator = { async send(): Promise<never> { throw new Error('MODEL_MUST_NOT_RUN_FOR_GOVERNED_ACTION') } }

async function commit(save: ReturnType<typeof createInitialSave>, action: string) {
  process.stderr.write(`[prolog-live] ${action}\n`)
  const executed = await executeStoryTurn({
    save,
    cartridge: mistHarborLastLight,
    action,
    generator,
    requestId: `live-${save.scene}-${Date.now()}`,
    domainResolver: resolver,
  })
  assert.equal(executed.source, 'domain')
  return executed.save
}

let save = createInitialSave(mistHarborLastLight)

const premature = await commit(save, '用提灯照开继电器室的窄门')
assert.equal(premature.facts['lantern-uses'], 0)
assert.equal(premature.location, save.location)

for (const action of [
  '拿起风暴提灯并试亮',
  '检查主控继电器为什么熄灭',
  '问林芮继电器室的备用线在哪里',
  '用提灯照开继电器室的窄门',
  '取下仍然干燥的绝缘铜线',
  '沿值班图板标记返回信号站',
  '打开通往下码头的检修门',
  '请安雅带你取回石缝里的镜片',
  '沿信号站外梯登上聚光室',
  '用铜线、镜片和林芮的接线夹完成修复',
]) save = await commit(save, action)

assert.equal(save.facts['signal-repaired'], true)
assert.equal(save.stats.signal, 6)
assert.equal(save.stats.trust, 3)
assert.equal(save.sessionEnded, true)
assert.equal(save.inventory.some(item => item.id === 'insulated-wire'), false)
assert.equal(save.inventory.some(item => item.id === 'fresnel-fragment'), false)

console.log(JSON.stringify({
  ok: true,
  server: baseUrl,
  sessionId,
  signal: save.stats.signal,
  trust: save.stats.trust,
  completed: save.sessionEnded,
  checks: [
    'real-swi-prolog-decision',
    'story-session-state-hydration',
    'precondition-rejection',
    'ten-action-campaign',
    'atomic-item-consumption',
    'checkpoint-completion',
  ],
}, null, 2))

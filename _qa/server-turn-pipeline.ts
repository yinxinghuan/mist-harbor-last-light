import assert from 'node:assert/strict'
import { mistHarborLastLight } from '../src/story/cartridges/mistHarborLastLight'
import { executeStoryTurn } from '../src/story/engine/executeTurn'
import { createInitialSave } from '../src/story/engine/reducer'

const initial = createInitialSave(mistHarborLastLight)
const initialJson = JSON.stringify(initial)
let domainModelCalls = 0
const domain = await executeStoryTurn({
  save: initial,
  cartridge: mistHarborLastLight,
  action: '拿起风暴提灯并试亮',
  generator: { async send(): Promise<never> { domainModelCalls += 1; throw new Error('MODEL_MUST_NOT_RUN') } },
})
assert.equal(domain.source, 'domain')
assert.equal(domainModelCalls, 0)
assert.equal(domain.save.scene, initial.scene + 1)
assert.equal(domain.save.facts['lantern-taken'], true)
assert.equal(domain.save.inventory.some(item => item.id === 'storm-lantern' && item.count === 1), true)
assert.equal(domain.save.stats.signal, initial.stats.signal)
assert.equal(JSON.stringify(initial), initialJson, 'server pipeline must not mutate its input snapshot')

let modelCalls = 0
const model = await executeStoryTurn({
  save: initial,
  cartridge: mistHarborLastLight,
  action: '检查值守卡边缘的水渍',
  generator: {
    async send() {
      modelCalls += 1
      return {
        content: [
          '你把值守卡移到黄铜灯下，水渍边缘露出一道与控制台熔断位置相同的焦痕。林芮确认这张卡在故障发生时贴近过主控台。',
          '[state: value="确认值守卡焦痕与故障位置的关系"]',
          '[scene_location: location="旧港信号站"]',
          '[choices: "请林芮核对焦痕方向"|"比较值守卡与控制台位置"]',
        ].join('\n'),
      }
    },
  },
})
assert.equal(model.source, 'model')
assert.equal(modelCalls, 1)
assert.equal(model.save.scene, initial.scene + 1)
assert.equal(model.save.objective, '确认值守卡焦痕与故障位置的关系')
assert.ok(model.save.choices.length >= 1)

console.log(JSON.stringify({
  ok: true,
  checks: [
    'server-compatible-pure-turn-pipeline',
    'domain-action-bypasses-model',
    'authoritative-effects-commit-together',
    'input-snapshot-remains-immutable',
    'model-proposal-validates-before-commit',
  ],
}, null, 2))

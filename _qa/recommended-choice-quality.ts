import assert from 'node:assert/strict'
import { filterGroundedChoices } from '../src/story/engine/continuity'
import { listCartridges } from '../src/story/cartridges/index'
import { createInitialSave } from '../src/story/engine/reducer'
import { parseStoryProtocol } from '../src/story/engine/protocol'
import { canonicalizeTurnMetadata, isGenericSuggestedChoice, repeatsCurrentAction, repeatsCurrentObjective } from '../src/story/engine/turnConsistency'

const cartridge = listCartridges('zh')[0]

for (const label of [
  '和同伴商量怎么办',
  '观察新变化',
  '等待',
  '继续当前任务',
  '换一种方式处理当前局面',
]) assert.equal(isGenericSuggestedChoice(label, 'zh'), true, `generic Chinese suggestion must be rejected: ${label}`)

for (const label of [
  'Discuss what to do with the companions',
  'Observe what changed',
  'Wait and see',
  'Continue the current task',
  'Try another way',
]) assert.equal(isGenericSuggestedChoice(label, 'en'), true, `generic English suggestion must be rejected: ${label}`)

for (const label of [
  '把货箱推到破损门闩后',
  '隔着仓门要求营救者撤退',
  '询问巡逻员为何封锁桥面',
]) assert.equal(isGenericSuggestedChoice(label, 'zh'), false, `concrete Chinese action must remain: ${label}`)

for (const label of [
  'Push the cargo behind the broken latch',
  'Demand through the warehouse door that the rescuers withdraw',
  'Ask the patrol officer why the bridge is sealed',
]) assert.equal(isGenericSuggestedChoice(label, 'en'), false, `concrete English action must remain: ${label}`)

assert.equal(repeatsCurrentAction('再次检查仓门', '检查仓门', 'zh'), true)
assert.equal(repeatsCurrentAction('继续检查仓门', '检查仓门', 'zh'), true)
assert.equal(repeatsCurrentAction('Retry checking the warehouse door', 'Check the warehouse door', 'en'), true)
assert.equal(repeatsCurrentAction('Push cargo behind the warehouse door', 'Check the warehouse door', 'en'), false)
assert.equal(repeatsCurrentObjective('选择一条路，找到今晚愿意停留的地方', '选择一条路，找到今晚愿意停留的地方', 'zh'), true)
assert.equal(repeatsCurrentObjective('沿炊烟前往灰瓦村', '选择一条路，找到今晚愿意停留的地方', 'zh'), false)

const groundedSave = createInitialSave(cartridge)
groundedSave.characters = [{
  id: 'qa-guide', name: '玛拉', role: '向导', vitality: 8, stress: 3, skills: [],
  status: 'known', origin: 'generated', updatedAtScene: 0,
}]
groundedSave.blocks.push({ id: 'qa-guide-claim', kind: 'dialogue', speaker: '玛拉', text: '她说自己亲眼见过那处异常，但没有带你过去。' })
assert.equal(filterGroundedChoices([
  { id: 'qa-follow-up', label: '质疑玛拉，要求她带你去看她提到的异常' },
], groundedSave, cartridge).length, 1, 'a paraphrased future action grounded by a known speaker must survive')

const arrival = parseStoryProtocol(`你已经抵达灰瓦村方向，村口停着一辆断轴货车。
[map_update: new_location="灰瓦村方向" connected_to="旧十字路口"]
[scene_location: location="灰瓦村方向"]
[choices: "检查村口的断轴货车"|"返回旧十字路口"]`, 'zh')
const arrivalChoices = canonicalizeTurnMetadata(
  createInitialSave(cartridge), arrival, cartridge, undefined, '沿炊烟去东面的灰瓦村',
).parsed.commands.find((command) => command.type === 'choices')
assert.deepEqual(arrivalChoices?.type === 'choices' ? arrivalChoices.choices : [], ['检查村口的断轴货车'],
  'after arriving, keep local action and suppress immediate backtrack when both exist')

console.log(JSON.stringify({ ok: true, checks: ['generic-placeholder-filter', 'concrete-action-preserved', 'immediate-repeat-filter', 'objective-is-not-an-action', 'paraphrased-future-action', 'arrival-backtrack-suppression', 'zh-en'] }))

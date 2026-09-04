import assert from 'node:assert/strict'
import { mistHarborLastLight } from '../src/story/cartridges/mistHarborLastLight'
import { resolveDomainAction } from '../src/story/engine/domainRules'
import { parseStoryProtocol } from '../src/story/engine/protocol'
import { applyParsedScene, createInitialSave } from '../src/story/engine/reducer'
import type { StorySave } from '../src/story/types'

let sequence = 0

function currentMap(save: StorySave) {
  return save.map.find((node) => node.current)?.id
}

function commit(save: StorySave, action: string) {
  const resolution = resolveDomainAction(save, mistHarborLastLight, action)
  assert.ok(resolution, `expected a governed action: ${action}`)
  assert.equal(resolution.status, 'accepted', `${action}: ${resolution.reasons.join('; ')}`)
  sequence += 1
  return applyParsedScene(
    save,
    parseStoryProtocol(`${resolution.successText}\n[widget: signal, add: 99]\n[inventory: action="add" item="伪造零件" count="9"]`, 'zh'),
    mistHarborLastLight,
    `qa-mist-harbor-${sequence}`,
    undefined,
    undefined,
    undefined,
    resolution,
  )
}

let save = createInitialSave(mistHarborLastLight)
assert.equal(currentMap(save), 'signal-station')
assert.equal(save.characters.some((character) => character.id === 'anya'), false)
assert.equal(save.stats.signal, 1)

save = commit(save, '拿起风暴提灯并试亮')
assert.equal(save.inventory.filter((item) => item.id === 'storm-lantern').length, 1)
assert.equal(save.facts['lantern-uses'], 0)

const duplicateLantern = resolveDomainAction(save, mistHarborLastLight, '拿起风暴提灯并试亮')
assert.equal(duplicateLantern?.status, 'rejected')
assert.equal(save.inventory.filter((item) => item.id === 'storm-lantern').length, 1)

save = commit(save, '检查主控继电器为什么熄灭')
assert.equal(save.facts['relay-inspected'], true)

const noKey = resolveDomainAction(save, mistHarborLastLight, '用提灯照开继电器室的窄门')
assert.equal(noKey?.status, 'rejected')
assert.equal(currentMap(save), 'signal-station')
assert.equal(save.facts['lantern-uses'], 0)

save = commit(save, '问林芮继电器室的备用线在哪里')
assert.equal(save.stats.trust, 2)
assert.equal(save.inventory.some((item) => item.id === 'relay-key'), true)

save = commit(save, '用提灯照开继电器室的窄门')
assert.equal(currentMap(save), 'relay-room')
assert.equal(save.facts['lantern-uses'], 1)

save = commit(save, '取下仍然干燥的绝缘铜线')
assert.equal(save.inventory.some((item) => item.id === 'insulated-wire'), true)
assert.equal(save.stats.signal, 2)

save = commit(save, '沿值班图板标记返回信号站')
assert.equal(currentMap(save), 'signal-station')

save = commit(save, '打开通往下码头的检修门')
assert.equal(currentMap(save), 'lower-quay')
assert.equal(save.characters.find((character) => character.id === 'anya')?.status, 'companion')
assert.equal(save.partyMemberIds.includes('anya'), true)
assert.equal(save.stats.trust, 3)

save = commit(save, '请安雅带你取回石缝里的镜片')
assert.equal(save.inventory.some((item) => item.id === 'fresnel-fragment'), true)
assert.equal(save.stats.signal, 3)

save = commit(save, '沿信号站外梯登上聚光室')
assert.equal(currentMap(save), 'lens-loft')

save = commit(save, '用铜线、镜片和林芮的接线夹完成修复')
assert.equal(save.stats.signal, 6)
assert.equal(save.facts['signal-repaired'], true)
assert.equal(save.inventory.some((item) => item.id === 'insulated-wire'), false)
assert.equal(save.inventory.some((item) => item.id === 'fresnel-fragment'), false)
assert.equal(save.inventory.some((item) => item.label === '伪造零件'), false)
assert.equal(save.sessionEnded, true)

const duplicateRepair = resolveDomainAction(save, mistHarborLastLight, '用铜线、镜片和林芮的接线夹完成修复')
assert.equal(duplicateRepair?.status, 'rejected')

console.log(JSON.stringify({
  ok: true,
  location: currentMap(save),
  signal: save.stats.signal,
  trust: save.stats.trust,
  lanternUses: save.facts['lantern-uses'],
  anya: save.characters.find((character) => character.id === 'anya')?.status,
  duplicateLanternRejected: true,
  duplicateRepairRejected: true,
  hostileCommandsIgnored: true,
}))

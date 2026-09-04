import { listCartridges } from '../src/story/cartridges/index'
import { parseStoryProtocol } from '../src/story/engine/protocol'
import { applyParsedScene, createInitialSave } from '../src/story/engine/reducer'
import { canonicalizeTurnMetadata, inferActionDestination, validateTurnConsistency } from '../src/story/engine/turnConsistency'
import { filterGroundedChoices } from '../src/story/engine/continuity'
import type { StorySave } from '../src/story/types'

function ok(value: unknown, message: string): asserts value { if (!value) throw new Error(message) }
function equal(actual: unknown, expected: unknown, message: string) { if (actual !== expected) throw new Error(`${message}: ${String(actual)} !== ${String(expected)}`) }

let assertions = 0
for (const locale of ['zh', 'en'] as const) {
  const cartridge = listCartridges(locale)[0]
  let save = createInitialSave(cartridge)
  for (let index = 0; index < 30; index += 1) {
    const suffix = String(index + 1).padStart(2, '0')
    const id = `generated-${locale}-${suffix}`
    const label = locale === 'zh' ? `回声谷${suffix}` : `Echo Vale ${suffix}`
    const alias = locale === 'zh' ? `蓝灯坡${suffix}` : `Blue Lamp Slope ${suffix}`
    const sub = locale === 'zh' ? `旧水门${suffix}` : `Old Water Gate ${suffix}`
    const hidden = locale === 'zh' ? `隐藏近路${suffix}` : `Hidden Shortcut ${suffix}`
    const origin: StorySave = { ...save, location: cartridge.opening.location, sceneLocation: cartridge.opening.location, map: save.map.map((node) => ({ ...node, current: node.label === cartridge.opening.location })) }
    const arrival = locale === 'zh' ? `你离开原地，抵达${label}。${alias}的${sub}就在溪边。` : `You leave and arrive at ${label}. ${sub} stands beside the stream on ${alias}.`
    const choice = locale === 'zh' ? `检查${sub}` : `Inspect ${sub}`
    const parsed = parseStoryProtocol(`${arrival}
[map_update: new_location="${label}" location_id="${id}" connected_to="${origin.location}" detail="${alias}的${sub}就在溪边" route_hints="${alias}|${sub}|${hidden}"]
[scene_location: location="${sub}"]
[choices: "${choice}"]`, locale)
    const canonical = canonicalizeTurnMetadata(origin, parsed, cartridge)
    assertions += 1; equal(validateTurnConsistency(origin, canonical.parsed, cartridge).length, 0, 'dynamic arrival validates')
    save = applyParsedScene(origin, canonical.parsed, cartridge, locale === 'zh' ? `前往${label}` : `Travel to ${label}`)
    const node = save.map.find((entry) => entry.id === id)
    assertions += 1; ok(node, 'stable dynamic id persists')
    assertions += 1; ok(node.routeHints?.includes(alias), 'visible alias persists')
    assertions += 1; ok(node.routeHints?.includes(sub), 'visible sublocation persists')
    assertions += 1; ok(!node.routeHints?.includes(hidden), 'hidden alias is discarded')
    const back = { ...save, location: origin.location, sceneLocation: origin.location, map: save.map.map((entry) => ({ ...entry, current: entry.label === origin.location })) }
    const action = locale === 'zh' ? `前往${alias}` : `Travel to ${alias}`
    assertions += 1; equal(inferActionDestination(back, cartridge, action)?.id, id, 'alias resolves to stable id')
    const omitted = parseStoryProtocol(`${locale === 'zh' ? `你抵达${sub}。` : `You arrive at ${sub}.`}
[scene_location: location="${sub}"]
[choices: "${choice}"]`, locale)
    const repaired = canonicalizeTurnMetadata(back, omitted, cartridge, undefined, action)
    assertions += 1; ok(repaired.parsed.commands.some((command) => command.type === 'map_update' && command.locationId === id), 'omitted update is repaired to stable id')
  }

  const routeOnlyAlias = locale === 'zh' ? '远岸工棚' : 'Xylophonic Hypercube'
  const routeOnly: StorySave = {
    ...save,
    map: [...save.map, { id: `route-only-${locale}`, label: locale === 'zh' ? '远岸' : 'Far Bank', routeHints: [routeOnlyAlias], visited: true }],
  }
  const unsupported = locale === 'zh' ? `在${routeOnlyAlias}雕刻星辉王冠` : `Forge a quantum submarine at ${routeOnlyAlias}`
  assertions += 1; equal(filterGroundedChoices([{ id: 'unsupported', label: unsupported }], routeOnly, cartridge).length, 0, 'a route alias alone cannot invent a local activity')
  const travel = locale === 'zh' ? `前往${routeOnlyAlias}` : `Travel to ${routeOnlyAlias}`
  assertions += 1; equal(inferActionDestination(routeOnly, cartridge, travel)?.id, `route-only-${locale}`, 'the same alias remains a valid travel destination')
}

console.log(JSON.stringify({ ok: true, simulatedPlaces: 60, assertions }))

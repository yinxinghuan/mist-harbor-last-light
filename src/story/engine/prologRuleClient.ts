import type { DomainActionResolution, DomainEffect, StoryCartridge, StorySave } from '../types'
import { resolveDomainAction } from './domainRules'

export type ServerDomainResolver = (options: {
  save: StorySave
  cartridge: StoryCartridge
  action: string
  requestId: string
}) => Promise<DomainActionResolution | undefined>

interface PrologRuleClientOptions {
  baseUrl: string
  token: string
  sessionId: string
  actorId: string
  timeoutMs?: number
  fetcher?: typeof fetch
}

type JsonObject = Record<string, unknown>

const stableId = (value: unknown): value is string => typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value)

function endpoint(baseUrl: string): string {
  const parsed = new URL(baseUrl)
  const loopback = parsed.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(parsed.hostname)
  if (parsed.protocol !== 'https:' && !loopback) throw new Error('RULE_SERVICE_CONFIGURATION_REQUIRED')
  parsed.pathname = `${parsed.pathname.replace(/\/$/, '')}/v1/resolve`
  parsed.search = ''
  parsed.hash = ''
  return parsed.toString()
}

function declaredFactIds(cartridge: StoryCartridge): Set<string> {
  const ids = new Set<string>()
  cartridge.domainRules?.rules.forEach((rule) => {
    rule.requirements.forEach((requirement) => { if (requirement.type === 'fact') ids.add(requirement.id) })
    rule.effects.forEach((effect) => { if (effect.type === 'fact' || effect.type === 'fact-add') ids.add(effect.id) })
  })
  cartridge.domainRules?.derivedFacts?.forEach((definition) => ids.add(definition.factId))
  cartridge.domainRules?.derivedItemMetrics?.forEach((definition) => ids.add(definition.factId))
  return ids
}

export function projectRuleState(save: StorySave, cartridge: StoryCartridge) {
  const factIds = declaredFactIds(cartridge)
  return {
    location: save.map.find((node) => node.current)?.id ?? '',
    stats: Object.fromEntries(cartridge.statDefinitions.map((definition) => [definition.id, Number(save.stats[definition.id] ?? definition.initial)])),
    facts: Object.fromEntries([...factIds].sort().map((id) => [id, save.facts[id] ?? false])),
    inventory: save.inventory
      .filter((item) => stableId(item.id) && Number.isSafeInteger(item.count) && item.count >= 0)
      .map((item) => ({ id: item.id, count: item.count })),
    characters: save.characters
      .filter((character) => stableId(character.id))
      .map((character) => ({ id: character.id, status: character.status })),
  }
}

function localEffect(effect: DomainEffect): JsonObject {
  if (effect.type === 'fact-add') return { type: 'fact_add', id: effect.id, delta: effect.delta }
  if (effect.type === 'clock-add') return { type: 'clock_add', minutes: effect.minutes }
  if (effect.type === 'inventory') return { type: effect.type, action: effect.action, item_id: effect.itemId, count: effect.count }
  if (effect.type === 'party') return { type: effect.type, change: effect.change, character_id: effect.characterId }
  if (effect.type === 'map') return { type: effect.type, node_id: effect.nodeId }
  if (effect.type === 'objective' || effect.type === 'clock') return { type: effect.type }
  if (effect.type === 'session') return { type: effect.type, ended: effect.ended }
  if (effect.type === 'stat') return { type: effect.type, id: effect.id, delta: effect.delta }
  if (effect.type === 'fact') return { type: effect.type, id: effect.id, value: effect.value }
  return { type: effect.type, outcome: effect.outcome }
}

function remoteEffect(value: unknown): JsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('RULE_SERVICE_MISMATCH')
  const effect = value as JsonObject
  if (effect.type === 'fact_add' && stableId(effect.id) && Number.isSafeInteger(effect.delta)) return { type: effect.type, id: effect.id, delta: effect.delta }
  if (effect.type === 'clock_add' && Number.isSafeInteger(effect.minutes) && Number(effect.minutes) >= 0) return { type: effect.type, minutes: effect.minutes }
  if (effect.type === 'inventory' && ['add', 'remove'].includes(String(effect.action)) && stableId(effect.item_id) && Number.isSafeInteger(effect.count) && Number(effect.count) > 0) return { type: effect.type, action: effect.action, item_id: effect.item_id, count: effect.count }
  if (effect.type === 'party' && ['add', 'remove'].includes(String(effect.change)) && stableId(effect.character_id)) return { type: effect.type, change: effect.change, character_id: effect.character_id }
  if (effect.type === 'map' && stableId(effect.node_id)) return { type: effect.type, node_id: effect.node_id }
  if (effect.type === 'objective' || effect.type === 'clock') return { type: effect.type }
  if (effect.type === 'session' && typeof effect.ended === 'boolean') return { type: effect.type, ended: effect.ended }
  if (effect.type === 'stat' && stableId(effect.id) && Number.isSafeInteger(effect.delta)) return { type: effect.type, id: effect.id, delta: effect.delta }
  if (effect.type === 'fact' && stableId(effect.id) && ['string', 'number', 'boolean'].includes(typeof effect.value)) return { type: effect.type, id: effect.id, value: effect.value }
  if (effect.type === 'danger' && stableId(effect.outcome)) return { type: effect.type, outcome: effect.outcome }
  throw new Error('RULE_SERVICE_MISMATCH')
}

function sameEffects(local: DomainEffect[], remote: unknown): boolean {
  if (!Array.isArray(remote) || local.length !== remote.length) return false
  return JSON.stringify(local.map(localEffect)) === JSON.stringify(remote.map(remoteEffect))
}

async function readBoundedJson(response: Response): Promise<JsonObject> {
  const declared = Number(response.headers.get('content-length') ?? 0)
  if (declared > 65_536) throw new Error('RULE_SERVICE_MISMATCH')
  const text = await response.text()
  if (text.length > 65_536) throw new Error('RULE_SERVICE_MISMATCH')
  try {
    const parsed = JSON.parse(text)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error()
    return parsed as JsonObject
  } catch { throw new Error('RULE_SERVICE_MISMATCH') }
}

export function createPrologRuleResolver(options: PrologRuleClientOptions): ServerDomainResolver {
  const url = endpoint(options.baseUrl)
  if (!options.token || options.token.length < 32) throw new Error('RULE_SERVICE_CONFIGURATION_REQUIRED')
  if (!stableId(options.sessionId) || !stableId(options.actorId)) throw new Error('RULE_SERVICE_CONFIGURATION_REQUIRED')
  const fetcher = options.fetcher ?? fetch
  const timeoutMs = options.timeoutMs ?? 3_500
  return async ({ save, cartridge, action, requestId }) => {
    const local = resolveDomainAction(save, cartridge, action)
    if (!local || !cartridge.domainRules?.rules.some((rule) => rule.id === local.ruleId)) return local
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    let response: Response
    try {
      response = await fetcher(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${options.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: requestId,
          game_id: cartridge.id,
          session_id: options.sessionId,
          actor_id: options.actorId,
          ruleset_version: 1,
          action_id: local.ruleId,
          state: projectRuleState(save, cartridge),
        }),
        signal: controller.signal,
      })
    } catch { throw new Error('RULE_SERVICE_UNAVAILABLE') }
    finally { clearTimeout(timer) }
    if (!response.ok) throw new Error('RULE_SERVICE_UNAVAILABLE')
    const payload = await readBoundedJson(response)
    const result = payload.result as JsonObject | undefined
    if (payload.ok !== true || payload.request_id !== requestId || payload.game_id !== cartridge.id
      || payload.ruleset_version !== 1 || !result || result.rule_id !== local.ruleId
      || !['accepted', 'rejected'].includes(String(result.status))) throw new Error('RULE_SERVICE_MISMATCH')
    if (result.status !== local.status || !sameEffects(local.effects, result.effects)) throw new Error('RULE_SERVICE_MISMATCH')
    if (!Array.isArray(result.reasons) || !Array.isArray(result.next_action_ids)
      || !result.reasons.every(stableId) || !result.next_action_ids.every(stableId)) throw new Error('RULE_SERVICE_MISMATCH')
    return local
  }
}

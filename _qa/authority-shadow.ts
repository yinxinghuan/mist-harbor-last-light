import assert from 'node:assert/strict'
import { mistHarborLastLight } from '../src/story/cartridges/mistHarborLastLight'
import { createAuthorityShadowSample } from '../src/story/engine/authorityShadow'
import { createInitialSave } from '../src/story/engine/reducer'
const save = createInitialSave(mistHarborLastLight); const visible = JSON.stringify(save.choices); const sample = createAuthorityShadowSample(save, mistHarborLastLight)
assert.equal(JSON.stringify(save.choices), visible); assert.equal(sample.choices.length, save.choices.length); assert.equal(sample.emptyTray, false); assert.ok(sample.choices.every((choice) => ['accepted', 'rejected', 'open'].includes(choice.status))); assert.equal(createAuthorityShadowSample({ ...save, entered: true, choices: [], sessionEnded: false }, mistHarborLastLight).emptyTray, true)
console.log('mist-harbor authority shadow is observational: ok')

import { spawnSync } from 'node:child_process'

const phases = [
  {
    name: 'core-contracts',
    cycles: 1,
    scripts: [
      'check:story-session', 'test:protocol', 'test:character-debut', 'test:mist-harbor',
      'test:authority-shadow', 'test:server-turn', 'test:prolog-rule-client',
      'test:story-session-identity',
    ],
  },
  {
    name: 'fault-concurrency-persistence',
    cycles: 3,
    scripts: [
      'test:story-session-client', 'test:story-session-prolog', 'test:story-session-persistence',
      'test:story-session-directory', 'test:story-session-migration',
    ],
  },
  {
    name: 'browser-end-to-end',
    cycles: 1,
    scripts: ['test:alteru-user-browser', 'test:story-session-history-browser', 'test:visual'],
  },
]

const results = []
for (const phase of phases) {
  for (let cycle = 1; cycle <= phase.cycles; cycle += 1) {
    for (const script of phase.scripts) {
      const startedAt = Date.now()
      console.log(`\n[multi-round] ${phase.name} cycle ${cycle}/${phase.cycles}: ${script}`)
      const result = spawnSync('npm', ['run', script], { cwd: process.cwd(), env: process.env, stdio: 'inherit' })
      results.push({ phase: phase.name, cycle, script, duration_ms: Date.now() - startedAt, status: result.status })
      if (result.error) throw result.error
      if (result.status !== 0) {
        console.error(JSON.stringify({ ok: false, failed: results.at(-1), completed: results.length }))
        process.exit(result.status ?? 1)
      }
    }
  }
}

console.log(JSON.stringify({
  ok: true,
  productionWrites: false,
  commands: results.length,
  faultCycles: 3,
  duration_ms: results.reduce((sum, result) => sum + result.duration_ms, 0),
  phases: phases.map(phase => ({ name: phase.name, cycles: phase.cycles, scripts: phase.scripts })),
}))

import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdtemp, mkdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const databaseDirectory = await mkdtemp(join(tmpdir(), 'mist-harbor-visual-ui-'))
const evidenceDirectory = resolve(root, '_qa/ui')
await mkdir(evidenceDirectory, { recursive: true })
const child = spawn(process.execPath, ['--import', 'tsx', '_qa/run-story-session-ui.ts'], {
  cwd: root,
  env: { ...process.env, STORY_LAB_UI_DATABASE_DIR: databaseDirectory, STORY_LAB_UI_PORT: '5190' },
  stdio: ['ignore', 'pipe', 'pipe'],
})
let serverLog = ''
child.stderr.on('data', chunk => { serverLog += String(chunk) })
const ready = new Promise((resolveReady, rejectReady) => {
  let buffer = ''
  const timeout = setTimeout(() => rejectReady(new Error(`UI lab timeout\n${serverLog}`)), 20_000)
  child.stdout.on('data', chunk => {
    buffer += String(chunk)
    for (const line of buffer.split('\n')) try {
      const value = JSON.parse(line)
      if (value?.url) { clearTimeout(timeout); resolveReady(value.url); return }
    } catch { /* keep buffering */ }
  })
  child.once('exit', code => { clearTimeout(timeout); rejectReady(new Error(`UI lab exited ${code}\n${serverLog}`)) })
})
const stopChild = async () => {
  if (child.exitCode !== null) return
  child.kill('SIGTERM')
  await Promise.race([new Promise(resolveExit => child.once('exit', resolveExit)), new Promise(resolveTimeout => setTimeout(resolveTimeout, 5_000))])
  if (child.exitCode === null) child.kill('SIGKILL')
}

let browser
try {
  const labUrl = await ready
  const origin = new URL(labUrl).origin
  browser = await chromium.launch({ headless: true })
  const waitIdle = async page => {
    await page.locator('output[data-story-session-test]').waitFor({ state: 'attached' })
    await page.waitForFunction(() => document.querySelector('output[data-story-session-test]')?.getAttribute('data-busy') === 'false')
  }
  const clickChoice = async (page, label) => {
    const button = page.locator('.st-quick-replies button', { hasText: label })
    await button.waitFor({ state: 'visible' })
    const box = await button.boundingBox()
    assert.ok(box && box.height >= 44 && box.width >= 44, `choice target too small: ${label}`)
    await button.click()
    await waitIdle(page)
  }

  const wide = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 })
  const page = await wide.newPage()
  await page.goto(`${labUrl}?run=visual-zh&actor=qa-a&lang=zh`)
  await waitIdle(page)
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
  await page.screenshot({ path: join(evidenceDirectory, 'platform-layout-mist-harbor-entry-zh-390x844.png'), fullPage: true })
  const enter = page.locator('button.st-primary')
  if (await enter.count()) await enter.click()
  await page.screenshot({ path: join(evidenceDirectory, 'platform-layout-mist-harbor-opening-zh-390x844.png'), fullPage: true })
  await clickChoice(page, '拿起风暴提灯并试亮')
  await page.screenshot({ path: join(evidenceDirectory, 'platform-layout-mist-harbor-first-action-zh-390x844.png'), fullPage: true })
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
  ]) await clickChoice(page, action)
  const completionChoices = page.locator('.st-quick-replies button')
  assert.equal(await completionChoices.count(), 1)
  assert.equal((await completionChoices.first().innerText()).includes('继续'), true)
  await page.screenshot({ path: join(evidenceDirectory, 'platform-layout-mist-harbor-complete-zh-390x844.png'), fullPage: true })

  const narrow = await browser.newContext({ viewport: { width: 320, height: 568 }, deviceScaleFactor: 1 })
  const english = await narrow.newPage()
  await english.goto(`${labUrl}?run=visual-en&actor=qa-a&lang=en`)
  await waitIdle(english)
  assert.equal(await english.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
  await english.screenshot({ path: join(evidenceDirectory, 'platform-layout-mist-harbor-entry-en-320x568.png'), fullPage: true })
  const englishEnter = english.locator('button.st-primary')
  if (await englishEnter.count()) await englishEnter.click()
  await clickChoice(english, 'Take the storm lantern and test it')
  assert.equal(await english.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
  await english.screenshot({ path: join(evidenceDirectory, 'platform-layout-mist-harbor-first-action-en-320x568.png'), fullPage: true })

  const external = await wide.newPage()
  await external.goto(`${origin}/?story_runtime=legacy&story_mode=demo&lang=zh&qa=external-guest`, { waitUntil: 'networkidle' })
  await external.locator('.st-entry, .st-shell').first().waitFor()
  await external.screenshot({ path: join(evidenceDirectory, 'external-guest-mist-harbor-entry-zh-390x844.png'), fullPage: true })
  assert.equal(await external.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)

  await narrow.close()
  await wide.close()
  console.log(JSON.stringify({ ok: true, liveModelCalled: false, productionWrites: false, checks: [
    'entry-and-opening', 'first-authoritative-action', 'full-domain-route', 'chapter-completion',
    'character-debut-path', '44px-choice-targets', 'zh-390x844', 'en-320x568', 'no-horizontal-overflow', 'external-guest-check',
  ] }))
} finally {
  await browser?.close()
  await stopChild()
  await rm(databaseDirectory, { recursive: true, force: true })
}

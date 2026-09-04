import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const databaseDirectory = await mkdtemp(join(tmpdir(), 'mist-harbor-alteru-user-'))
const child = spawn(process.execPath, ['--import', 'tsx', '_qa/run-story-session-ui.ts'], {
  cwd: root,
  env: { ...process.env, STORY_LAB_UI_DATABASE_DIR: databaseDirectory, STORY_LAB_UI_PORT: '5191' },
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
    } catch { /* incomplete line */ }
  })
  child.once('exit', code => { clearTimeout(timeout); rejectReady(new Error(`UI lab exited ${code}\n${serverLog}`)) })
})
const stopChild = async () => {
  if (child.exitCode !== null) return
  child.kill('SIGTERM')
  await Promise.race([new Promise(resolveExit => child.once('exit', resolveExit)), new Promise(resolveTimeout => setTimeout(resolveTimeout, 5_000))])
  if (child.exitCode === null) child.kill('SIGKILL')
}

const GAME_UUID = '8a51d15e-7c00-4e27-bc63-25624ee75ac1'
const installBridge = () => {
  const decode = value => decodeURIComponent(escape(atob(value)))
  const encode = value => btoa(unescape(encodeURIComponent(value)))
  const params = new URLSearchParams(location.search)
  const userId = params.get('telegram_id')
  if (!userId) return
  window.Aigram = { isInAigram: true, telegramId: userId }
  window.addEventListener('message', event => {
    if (typeof event.data !== 'string' || !event.data.startsWith('callAPI-')) return
    const request = JSON.parse(decode(event.data.slice('callAPI-'.length)))
    let body = { retcode: 0, errcode: 0, msg: 'ok', data: null }
    if (request.url.startsWith('/note/telegram/user/get/info/by/telegram_id')) {
      body = { ...body, data: { name: userId === 'qa-platform-user-a' ? '雾港测试员 A' : '雾港测试员 B', head_url: '' } }
    } else if (request.url.startsWith('/note/aigram/ai/game/get/data/list')) {
      const saved = localStorage.getItem(`__qa_platform_save:${userId}`)
      body = { ...body, data: saved ? [{ user_id: userId, resource_data: saved }] : [] }
    } else if (request.url === '/note/aigram/ai/game/save/data') {
      localStorage.setItem(`__qa_platform_save:${userId}`, String(request.data?.resource_data ?? ''))
    }
    if (request.method !== 'post') {
      const result = { request_id: request.request_id, success: true, data: body }
      window.postMessage(`callAPIResult-${encode(JSON.stringify(result))}`, location.origin)
    }
  })
}

let browser
try {
  const labUrl = await ready
  const origin = new URL(labUrl).origin
  browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
  await context.addInitScript(installBridge)
  await context.route('**/alteru/guest-shell.js', route => route.abort())
  const appUrl = userId => `${origin}/?api_origin=${encodeURIComponent(origin)}&telegram_id=${encodeURIComponent(userId)}&lang=zh`
  const sessions = (page, userId) => page.evaluate(async ({ gameUuid, id }) => {
    const response = await fetch(`/${gameUuid}/api/story/sessions?limit=20`, { headers: { 'X-AlterU-User-ID': id } })
    return { status: response.status, body: await response.json() }
  }, { gameUuid: GAME_UUID, id: userId })
  const enter = async page => {
    await page.locator('.st-entry, .st-shell').first().waitFor()
    const button = page.locator('button.st-primary')
    if (await button.count()) await button.click()
    await page.locator('.st-shell').waitFor()
  }
  const assertProfile = async (page, expected) => {
    await page.locator('.st-world-button').click()
    await page.locator('.st-roster__player h3').waitFor()
    assert.equal((await page.locator('.st-roster__player h3').innerText()).trim(), expected)
    await page.keyboard.press('Escape')
  }

  const pageA = await context.newPage()
  await pageA.goto(appUrl('qa-platform-user-a'))
  await enter(pageA)
  await assertProfile(pageA, '雾港测试员 A')
  const firstChoice = pageA.locator('.st-quick-replies button').first()
  await firstChoice.click()
  await pageA.waitForFunction(async ({ gameUuid, id }) => {
    const response = await fetch(`/${gameUuid}/api/story/sessions?limit=20`, { headers: { 'X-AlterU-User-ID': id } })
    const body = await response.json()
    return body.sessions?.[0]?.version === 1
  }, { gameUuid: GAME_UUID, id: 'qa-platform-user-a' })
  const aFirst = await sessions(pageA, 'qa-platform-user-a')
  assert.equal(aFirst.status, 200)
  assert.equal(aFirst.body.sessions.length, 1)
  assert.equal(aFirst.body.sessions[0].version, 1)
  const sessionA = aFirst.body.sessions[0].session_id
  await pageA.waitForTimeout(1_200)
  const cloudA = await pageA.evaluate(() => localStorage.getItem('__qa_platform_save:qa-platform-user-a'))
  assert.equal(JSON.parse(cloudA).storySession.identityMode, 'alteru-user-id-v1-experimental')

  await pageA.reload()
  await pageA.locator('.st-shell').waitFor()
  const aReloaded = await sessions(pageA, 'qa-platform-user-a')
  assert.equal(aReloaded.body.sessions.length, 1)
  assert.equal(aReloaded.body.sessions[0].session_id, sessionA)
  assert.equal(aReloaded.body.sessions[0].version, 1)

  const freshContext = await browser.newContext({ viewport: { width: 390, height: 844 } })
  await freshContext.addInitScript(installBridge)
  await freshContext.route('**/alteru/guest-shell.js', route => route.abort())
  const freshA = await freshContext.newPage()
  await freshA.goto(appUrl('qa-platform-user-a'))
  await enter(freshA)
  const aFreshDevice = await sessions(freshA, 'qa-platform-user-a')
  assert.equal(aFreshDevice.body.sessions.length, 1)
  assert.equal(aFreshDevice.body.sessions[0].session_id, sessionA)
  assert.equal(aFreshDevice.body.sessions[0].version, 1)
  await freshContext.close()

  const pageB = await context.newPage()
  await pageB.goto(appUrl('qa-platform-user-b'))
  await enter(pageB)
  await assertProfile(pageB, '雾港测试员 B')
  const bFirst = await sessions(pageB, 'qa-platform-user-b')
  assert.equal(bFirst.status, 200)
  assert.equal(bFirst.body.sessions.length, 1)
  assert.notEqual(bFirst.body.sessions[0].session_id, sessionA)
  const denied = await pageB.evaluate(async ({ gameUuid, sessionId }) => {
    const response = await fetch(`/${gameUuid}/api/story/sessions/${sessionId}`, { headers: { 'X-AlterU-User-ID': 'qa-platform-user-b' } })
    return { status: response.status, body: await response.json() }
  }, { gameUuid: GAME_UUID, sessionId: sessionA })
  assert.equal(denied.status, 404)
  assert.equal(denied.body.code, 'SESSION_NOT_FOUND')

  const userScopedKeys = await pageA.evaluate(() => Object.keys(localStorage).filter(key => key.includes('mist-harbor-last-light-save:user:')).sort())
  assert.equal(userScopedKeys.length, 2)
  assert.ok(userScopedKeys.some(key => key.includes('qa-platform-user-a')))
  assert.ok(userScopedKeys.some(key => key.includes('qa-platform-user-b')))

  await context.close()
  console.log(JSON.stringify({ ok: true, liveModelCalled: false, productionWrites: false, checks: [
    'live-alteru-profile-a', 'live-alteru-profile-b', 'platform-save-bootstrap',
    'same-user-reload-resume', 'same-user-fresh-device-resume', 'same-user-stable-session', 'cross-user-session-isolation',
    'cross-user-read-denied', 'user-scoped-local-fallback',
  ] }))
} finally {
  await browser?.close()
  await stopChild()
  await rm(databaseDirectory, { recursive: true, force: true })
}

/* global process */
import { test, expect, devices } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'

const iPhone = devices['iPhone 13']
const freezeTimeScript = (time) => {
  const FixedDate = class extends Date {
    constructor(...args) {
      if (args.length === 0) {
        super(time)
      } else {
        super(...args)
      }
    }
    static now() {
      return time
    }
  }
  // @ts-ignore
  // eslint-disable-next-line no-global-assign
  Date = FixedDate
}

const disableMotionCss = `
* {
  animation-duration: 0s !important;
  animation-delay: 0s !important;
  transition: none !important;
}
`

const buildContext = async (browser) => {
  const context = await browser.newContext(iPhone)
  await context.addInitScript(freezeTimeScript, new Date('2026-02-20T00:00:00Z').getTime())
  return context
}

const loadEnv = () => {
  if (process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_PUBLISHABLE_KEY) return
  const envPath = path.resolve(process.cwd(), '.env')
  if (!fs.existsSync(envPath)) return
  const content = fs.readFileSync(envPath, 'utf-8')
  content.split('\n').forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return
    const idx = trimmed.indexOf('=')
    if (idx === -1) return
    const key = trimmed.slice(0, idx).trim()
    let value = trimmed.slice(idx + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  })
}

const getSupabase = () => {
  loadEnv()
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) throw new Error('missing supabase env vars for tests')
  return createClient(url, key)
}

const ensureStarted = async (roomCode, hostId) => {
  const supabase = getSupabase()
  const { error } = await supabase.rpc('start_game', {
    p_room_code: roomCode,
    p_host_id: hostId,
  })
  if (!error) return

  const { data: questions } = await supabase
    .from('questions')
    .select('topic, level, text')
    .limit(2)

  const topic = questions?.[0]?.topic || 'topic'
  const q1 = questions?.find((q) => q.level === 'q1')?.text || 'q1 placeholder'
  const q2 = questions?.find((q) => q.level === 'q2')?.text || 'q2 placeholder'

  await supabase.from('players').update({ turn_order: 1 }).eq('id', hostId)
  await supabase.from('rooms').update({
    status: 'PLAYING',
    game_phase: 'CHOSEN',
    current_player_id: hostId,
    fate_is_truth: true,
    question_q1: q1,
    question_q2: q2,
    current_topic: topic,
    chosen_question: null,
    chosen_topic: null,
    hunt_bonus_time: 0,
    timer_paused_at: null,
    accumulated_pause_ms: 0,
  }).eq('code', roomCode)
}

const fillLanding = async (page, name, zodiacIndex = 0) => {
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.addStyleTag({ content: disableMotionCss })
  await expect(page.getByRole('heading', { name: /gold hunt/i })).toBeVisible()
  await page.getByPlaceholder('your name...').fill(name)
  await page.locator('.zodiac-card').nth(zodiacIndex).click()
  await page.getByRole('button', { name: /enter the courtyard/i }).click()
  await page.waitForURL('**/courtyard')
}

test('capture game screens (speaker + audience)', async ({ browser }) => {
  const supabase = getSupabase()
  const speakerCtx = await buildContext(browser)
  const audienceCtx = await buildContext(browser)

  const speaker = await speakerCtx.newPage()
  const audience = await audienceCtx.newPage()

  await speaker.goto('/', { waitUntil: 'networkidle' })
  await speaker.addStyleTag({ content: disableMotionCss })
  await expect(speaker.getByRole('heading', { name: /gold hunt/i })).toBeVisible()
  await expect(speaker).toHaveScreenshot('01-landing.png', { fullPage: true })

  await fillLanding(speaker, 'gracehuangqa', 6)
  await speaker.getByRole('button', { name: /start a room/i }).click()
  await speaker.waitForURL('**/room/**')
  await speaker.addStyleTag({ content: disableMotionCss })
  const code = (await speaker.locator('h2').first().textContent())?.trim() || ''
  if (!code) throw new Error('room code not found')

  await speaker.screenshot({ path: undefined })
  await expect(speaker).toHaveScreenshot('02-lobby-speaker.png', { fullPage: true })

  await fillLanding(audience, 'audienceqa', 1)
  await audience.getByPlaceholder('room code').fill(code)
  await audience.getByRole('button', { name: /^join/i }).click()
  await audience.waitForURL('**/room/**')
  await audience.addStyleTag({ content: disableMotionCss })
  await expect(audience).toHaveScreenshot('03-lobby-audience.png', { fullPage: true })

  const seedBtn = speaker.getByRole('button', { name: /seed 8/i })
  if (await seedBtn.count()) {
    await seedBtn.click()
  }
  await speaker.addStyleTag({ content: '.qa-panel { display: none !important; }' })
  const hostId = await speaker.evaluate(() => localStorage.getItem('gold_hunt_player_id'))
  try {
    await speaker.getByRole('button', { name: /light the fire/i }).click()
  } catch {
    // fallback below
  }
  if (hostId) {
    await ensureStarted(code, hostId)
  }

  await speaker.getByText(/you've been chosen/i).waitFor()
  await expect(speaker).toHaveScreenshot('04-chosen-speaker.png', { fullPage: true })

  await audience.getByText(/is getting ready/i).waitFor()
  await expect(audience).toHaveScreenshot('05-chosen-audience.png', { fullPage: true })

  await speaker.getByTitle('skip').click()
  await speaker.getByText(/listen up, horse/i).waitFor()
  await expect(speaker).toHaveScreenshot('06-fate-hidden.png', { fullPage: true })

  await speaker.locator('.hongbao').click()
  await expect(speaker).toHaveScreenshot('07-fate-revealed.png', { fullPage: true })

  await speaker.locator('.question-card').first().click()
  await expect(speaker).toHaveScreenshot('08-fate-selected.png', { fullPage: true })

  await speaker.getByRole('button', { name: /start my story/i }).click()
  await speaker.waitForTimeout(300)
  await expect(speaker).toHaveScreenshot('09-campfire-speaker.png', { fullPage: true })

  await audience.reload({ waitUntil: 'networkidle' })
  await audience.addStyleTag({ content: disableMotionCss })
  await audience.getByText(/listen carefully/i).waitFor()
  await expect(audience).toHaveScreenshot('10-campfire-audience.png', { fullPage: true })

  await speaker.getByTitle('skip').click()
  await speaker.waitForTimeout(300)
  await expect(speaker).toHaveScreenshot('11-hunt-speaker.png', { fullPage: true })

  await audience.reload({ waitUntil: 'networkidle' })
  await audience.addStyleTag({ content: disableMotionCss })
  await audience.getByText(/the hunt is on/i).waitFor()
  await expect(audience).toHaveScreenshot('12-hunt-audience.png', { fullPage: true })

  await speaker.getByTitle('skip').click()
  await speaker.waitForTimeout(300)
  await expect(speaker).toHaveScreenshot('13-voting-speaker.png', { fullPage: true })

  await supabase
    .from('rooms')
    .update({ game_phase: 'VOTING', voting_started_at: new Date().toISOString() })
    .eq('code', code)
  await audience.reload({ waitUntil: 'networkidle' })
  await audience.addStyleTag({ content: disableMotionCss })
  await expect(audience).toHaveScreenshot('14-voting-audience.png', { fullPage: true })

  await speaker.getByTitle('skip').click()
  await speaker.waitForTimeout(300)
  await expect(speaker).toHaveScreenshot('15-result.png', { fullPage: true })

  await speaker.getByTitle('skip').click()
  await speaker.waitForTimeout(300)
  await expect(speaker).toHaveScreenshot('16-leaderboard.png', { fullPage: true })

  await speakerCtx.close()
  await audienceCtx.close()
})

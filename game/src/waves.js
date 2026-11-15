import { spawnEnemy } from './entities.js'
import { WAVES } from './config.js'

export function buildWave(wave, random) {
  const entries = []
  const add = (kind, count) => {
    for (let i = 0; i < count; i += 1) entries.push({ kind, delay: random() * (4 + 2 * wave) })
  }
  add('cinder', 6 + 3 * wave)
  if (wave >= 2) add('emberbat', 2 + wave)
  if (wave >= 3) add('brute', 1 + Math.floor(wave / 2))
  if (wave === 10) add('boss', 1)
  for (let i = entries.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[entries[i], entries[j]] = [entries[j], entries[i]]
  }
  const duration = 4 + 2 * wave
  entries.forEach((entry, index) => { entry.delay = duration * index / Math.max(1, entries.length) })
  return entries
}

export function createWaveState() {
  return { wave: 0, queue: [], spawnTimer: 0, active: false }
}

export function startWave(state, wave) {
  state.wave = wave
  state.waveState.queue = buildWave(wave, state.random)
  state.waveState.spawnTimer = state.waveState.queue[0]?.delay || 0
  state.waveState.active = true
  state.audio?.waveHorn?.()
  state.banner = 'Wave ' + wave
}

export function updateWaves(state, dt) {
  const waveState = state.waveState
  if (!waveState.active) return state.enemies.length === 0 ? 'cleared' : 'active'
  waveState.spawnTimer -= dt
  while (waveState.queue.length && waveState.spawnTimer <= 0) {
    const entry = waveState.queue.shift()
    state.enemies.push(spawnEnemy(state.random, entry.kind, state.wave))
    waveState.spawnTimer += waveState.queue[0]?.delay ?? 0.5
  }
  if (!waveState.queue.length && !state.enemies.length) {
    waveState.active = false
    return 'cleared'
  }
  return 'active'
}

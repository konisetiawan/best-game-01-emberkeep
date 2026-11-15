// Title, play, upgrade, pause, and ending phases form the game's state machine.
import { HEARTH, WAVES, BEST_KEY } from './config.js'
import { createPlayer, updatePlayer, updateEnemies, updateBullets, updateParticles, updatePickups, updateFloats } from './entities.js'
import { createWaveState, startWave, updateWaves } from './waves.js'
import { rollUpgrades, applyUpgrade } from './upgrades.js'

function readBest() {
  try { return Number.parseInt(localStorage.getItem(BEST_KEY), 10) || 0 } catch { return 0 }
}

function saveBest(state) {
  if (state.score <= state.best) return
  state.best = state.score
  try { localStorage.setItem(BEST_KEY, String(state.best)) } catch {}
}

export function createGameState(random = Math.random, audio = null) {
  return {
    random, audio,
    player: createPlayer(),
    hearth: { x: HEARTH.x, y: HEARTH.y, hp: HEARTH.maxHp, maxHp: HEARTH.maxHp, kindling: 0, radius: 28 },
    enemies: [], bullets: [], particles: [], pickups: [], floats: [],
    score: 0, combo: 1, comboTimer: 0, wave: 0, waveState: createWaveState(),
    phase: 'title', banner: '', bannerTimer: 0, time: 0, best: readBest(),
    upgradeChoices: [], shake: 0,
  }
}

export function startGame(state) {
  const fresh = createGameState(state.random, state.audio)
  Object.assign(state, fresh)
  state.phase = 'playing'
  state.audio?.ensure?.()
  state.audio?.startMusic?.()
  startWave(state, 1)
}

export function updateGame(state, input, dt) {
  state.time += dt
  if (state.phase === 'title') {
    if (input.wasPressed('Enter') || input.mouseDown) startGame(state)
  } else if (state.phase === 'playing') {
    const adapter = {
      left: input.isDown('ArrowLeft'), a: input.isDown('KeyA'),
      right: input.isDown('ArrowRight'), d: input.isDown('KeyD'),
      up: input.isDown('ArrowUp'), w: input.isDown('KeyW'),
      down: input.isDown('ArrowDown'), s: input.isDown('KeyS'),
      shift: input.isDown('ShiftLeft') || input.isDown('ShiftRight'),
      space: input.isDown('Space'), mouseDown: input.mouseDown,
      aimX: input.mouseX, aimY: input.mouseY,
    }
    updatePlayer(state, adapter, dt)
    const waveStatus = updateWaves(state, dt)
    if (waveStatus === 'cleared') {
      if (state.wave >= WAVES) {
        state.phase = 'victory'
        state.audio?.victory?.()
        saveBest(state)
      } else {
        state.phase = 'upgrade'
        state.upgradeChoices = rollUpgrades(state.random, 3)
      }
    }
    updateEnemies(state, dt)
    updateBullets(state, dt)
    updateParticles(state, dt)
    updatePickups(state)
    updateFloats(state, dt)
    state.comboTimer = Math.max(0, state.comboTimer - dt)
    if (!state.comboTimer) state.combo = 1
    state.bannerTimer = Math.max(0, state.bannerTimer - dt)
    state.shake = Math.max(0, state.shake - dt * 24)
    if (input.wasPressed('KeyP')) state.phase = 'paused'
    if (state.hearth.hp <= 0 || state.player.hearts <= 0) {
      state.phase = 'over'
      state.audio?.defeat?.()
      state.audio?.stopMusic?.()
      saveBest(state)
    }
  } else if (state.phase === 'upgrade') {
    for (let i = 0; i < 3; i += 1) {
      if (input.wasPressed(`Digit${i + 1}`) && state.upgradeChoices[i]) {
        applyUpgrade(state, state.upgradeChoices[i].id)
        state.phase = 'playing'
        startWave(state, state.wave + 1)
        break
      }
    }
  } else if (state.phase === 'paused') {
    if (input.wasPressed('KeyP')) state.phase = 'playing'
  } else if (state.phase === 'over' || state.phase === 'victory') {
    if (input.wasPressed('KeyR')) startGame(state)
  }
  input.update()
}

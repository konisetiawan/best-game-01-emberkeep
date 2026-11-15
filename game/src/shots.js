import { createRandom } from './random.js'
import { createGameState } from './game.js'
import { spawnEnemy, spawnBurst } from './entities.js'

export function stageShot(state, name, seed) {
  state.random = createRandom(seed)
  state.time = 12.5
  state.shake = 0
  state.enemies = []
  state.bullets = []
  state.particles = []
  state.pickups = []
  state.floats = []
  state.banner = ''
  state.bannerTimer = 0

  const setEnemies = (entries, wave) => {
    state.enemies = entries.map(([kind, x, y, hp]) => {
      const enemy = spawnEnemy(state.random, kind, wave)
      enemy.x = x
      enemy.y = y
      if (hp !== undefined) enemy.hp = enemy.maxHp = hp
      return enemy
    })
  }

  if (name === 'play') {
    state.phase = 'playing'
    state.wave = 3
    state.score = 2450
    state.combo = 3
    state.comboTimer = 2
    state.banner = 'Wave 3'
    state.bannerTimer = 2
    state.hearth.hp = 82
    state.player.hearts = 3
    state.player.x = 640
    state.player.y = 450
    state.player.dashCooldown = 0.8
    setEnemies([
      ['cinder', 300, 200], ['cinder', 980, 180], ['cinder', 240, 520], ['cinder', 1040, 540],
      ['emberbat', 420, 140], ['emberbat', 880, 600], ['brute', 640, 120, 6],
    ], state.wave)
    state.bullets = [
      { x: 624, y: 443, vx: 440, vy: -360, radius: 5, damage: 1, life: 1.3 },
      { x: 638, y: 445, vx: 500, vy: -280, radius: 5, damage: 1, life: 1.3 },
      { x: 652, y: 449, vx: 390, vy: -420, radius: 5, damage: 1, life: 1.3 },
    ]
    spawnBurst(state, 300, 200, '#ff9a3c', 8)
    state.pickups = [
      { x: 500, y: 300, radius: 8, kind: 'kindling' },
      { x: 780, y: 420, radius: 8, kind: 'kindling' },
    ]
    state.floats = [{ x: 300, y: 190, text: '+20', life: 0.6 }]
  } else if (name === 'win') {
    state.phase = 'victory'
    state.wave = 10
    state.score = 9840
    state.best = 9840
    state.hearth.hp = 64
    state.player.hearts = 2
  } else if (name === 'over') {
    state.phase = 'over'
    state.wave = 5
    state.score = 3120
    state.best = 9840
    state.hearth.hp = 0
    state.player.hearts = 0
    setEnemies([['cinder', 600, 330], ['cinder', 690, 380], ['cinder', 610, 410]], state.wave)
  } else {
    state.phase = 'title'
    state.best = 1250
    state.score = 0
    state.wave = 0
    state.hearth.hp = state.hearth.maxHp
    state.enemies = []
  }

  return state
}

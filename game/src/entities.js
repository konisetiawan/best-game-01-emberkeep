import { FIELD, HEARTH, ENEMIES, PLAYER, DASH_COOLDOWN, COMBO_WINDOW } from './config.js'

const KIND_STYLE = {
  cinder: { radius: 15, color: '#e86b45', damage: 5 },
  emberbat: { radius: 11, color: '#d76bce', damage: 5 },
  brute: { radius: 23, color: '#8e6670', damage: 15 },
  boss: { radius: 38, color: '#bd3f38', damage: 25 },
}

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))
const distanceSquared = (ax, ay, bx, by) => (ax - bx) ** 2 + (ay - by) ** 2
const randomRange = (random, min, max) => min + random() * (max - min)

export function createPlayer() {
  return {
    x: FIELD.width / 2,
    y: FIELD.height / 2 + 90,
    radius: 16,
    hearts: 3,
    maxHearts: 3,
    upgrades: { damage: 1, fireRate: 0.28, speed: 300, spread: 1 },
    dashCooldown: 0,
    dashTime: 0,
    invulnerable: 0,
    fireCooldown: 0,
  }
}

export function spawnEnemy(random, kind, wave) {
  const edge = Math.floor(random() * 4)
  const x = edge < 2 ? randomRange(random, 0, FIELD.width) : edge === 2 ? 0 : FIELD.width
  const y = edge < 2 ? (edge === 0 ? 0 : FIELD.height) : randomRange(random, 0, FIELD.height)
  const style = KIND_STYLE[kind]
  const base = ENEMIES[kind]
  return {
    kind, x, y, radius: style.radius, color: style.color, damage: style.damage,
    hp: base.hp * (1 + 0.08 * (wave - 1)),
    maxHp: base.hp * (1 + 0.08 * (wave - 1)),
    speed: base.speed * (1 + 0.025 * (wave - 1)),
    points: base.points,
    wobble: randomRange(random, 0, Math.PI * 2),
    bossTimer: 6,
  }
}

export function spawnBurst(state, x, y, color, n) {
  for (let i = 0; i < n; i += 1) {
    const angle = randomRange(state.random, 0, Math.PI * 2)
    const speed = randomRange(state.random, 35, 190)
    state.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: randomRange(state.random, 0.2, 0.65), maxLife: 0.65, color, radius: randomRange(state.random, 2, 5) })
  }
}

export function createBullet(player, aimX, aimY) {
  const dx = aimX - player.x
  const dy = aimY - player.y
  const length = Math.hypot(dx, dy) || 1
  const speed = 620 * (player.upgrades.bulletSpeed || 1)
  return { x: player.x, y: player.y, vx: dx / length * speed, vy: dy / length * speed, radius: 5, damage: player.upgrades.damage, life: 1.3 }
}

export function updatePlayer(state, input, dt) {
  const player = state.player
  player.dashCooldown = Math.max(0, player.dashCooldown - dt)
  player.dashTime = Math.max(0, player.dashTime - dt)
  player.invulnerable = Math.max(0, player.invulnerable - dt)
  player.fireCooldown = Math.max(0, player.fireCooldown - dt)
  let dx = (input.right || input.d ? 1 : 0) - (input.left || input.a ? 1 : 0)
  let dy = (input.down || input.s ? 1 : 0) - (input.up || input.w ? 1 : 0)
  const length = Math.hypot(dx, dy) || 1
  if (input.shift && player.dashCooldown <= 0) {
    player.dashCooldown = DASH_COOLDOWN
    player.dashTime = 0.18
    player.invulnerable = Math.max(player.invulnerable, 0.3)
  }
  const speed = player.upgrades.speed * (player.dashTime > 0 ? 3.2 : 1)
  player.x = clamp(player.x + dx / length * speed * dt, player.radius, FIELD.width - player.radius)
  player.y = clamp(player.y + dy / length * speed * dt, player.radius, FIELD.height - player.radius)
  if ((input.mouseDown || input.space) && player.fireCooldown <= 0) {
    const count = Math.max(1, player.upgrades.spread)
    const aimX = input.aimX ?? player.x + 1
    const aimY = input.aimY ?? player.y
    const angle = Math.atan2(aimY - player.y, aimX - player.x)
    const spreadAngle = 0.14
    for (let i = 0; i < count; i += 1) {
      const offset = (i - (count - 1) / 2) * spreadAngle
      state.bullets.push(createBullet(player, player.x + Math.cos(angle + offset), player.y + Math.sin(angle + offset)))
    }
    player.fireCooldown = player.upgrades.fireRate
  }
}

export function updateEnemies(state, dt) {
  for (const enemy of state.enemies) {
    const target = enemy.kind === 'boss' ? state.player : state.hearth
    let dx = target.x - enemy.x
    let dy = target.y - enemy.y
    const length = Math.hypot(dx, dy) || 1
    if (enemy.kind === 'emberbat') {
      enemy.wobble += dt * 5
      const wobble = Math.sin(enemy.wobble) * 0.7
      dx = dx / length + Math.cos(enemy.wobble) * wobble
      dy = dy / length + Math.sin(enemy.wobble) * wobble
      const adjusted = Math.hypot(dx, dy) || 1
      enemy.x += dx / adjusted * enemy.speed * dt
      enemy.y += dy / adjusted * enemy.speed * dt
    } else {
      enemy.x += dx / length * enemy.speed * (enemy.kind === 'brute' ? 0.62 : 1) * dt
      enemy.y += dy / length * enemy.speed * (enemy.kind === 'brute' ? 0.62 : 1) * dt
    }
    if (enemy.kind === 'boss') {
      enemy.bossTimer -= dt
      if (enemy.bossTimer <= 0) {
        state.enemies.push(spawnEnemy(state.random, 'cinder', state.wave), spawnEnemy(state.random, 'cinder', state.wave))
        enemy.bossTimer = 6
      }
    }
    if (enemy.kind !== 'boss' && distanceSquared(enemy.x, enemy.y, state.hearth.x, state.hearth.y) < (enemy.radius + state.hearth.radius) ** 2) {
      state.hearth.hp = Math.max(0, state.hearth.hp - enemy.damage)
      enemy.dead = true
    } else if (state.player.invulnerable <= 0 && distanceSquared(enemy.x, enemy.y, state.player.x, state.player.y) < (enemy.radius + state.player.radius) ** 2) {
      state.player.hearts = Math.max(0, state.player.hearts - 1)
      state.player.invulnerable = 1.5
    }
  }
  state.enemies = state.enemies.filter(enemy => !enemy.dead)
}

export function updateBullets(state, dt) {
  for (const bullet of state.bullets) {
    bullet.x += bullet.vx * dt
    bullet.y += bullet.vy * dt
    bullet.life -= dt
    if (bullet.x < 0 || bullet.y < 0 || bullet.x > FIELD.width || bullet.y > FIELD.height) bullet.life = 0
    for (const enemy of state.enemies) {
      if (!enemy.dead && distanceSquared(bullet.x, bullet.y, enemy.x, enemy.y) < (bullet.radius + enemy.radius) ** 2) {
        enemy.hp -= bullet.damage
        bullet.life = 0
        if (enemy.hp <= 0) {
          enemy.dead = true
          state.score += enemy.points * state.combo
          state.combo += 1
          state.comboTimer = COMBO_WINDOW
          if (state.random() < 0.35) state.pickups.push({ x: enemy.x, y: enemy.y, radius: 8 })
          spawnBurst(state, enemy.x, enemy.y, enemy.color, 12)
          state.floats.push({ x: enemy.x, y: enemy.y, text: '+' + enemy.points * state.combo, life: 0.8 })
          state.audio?.explode?.()
        }
        break
      }
    }
  }
  state.bullets = state.bullets.filter(bullet => bullet.life > 0)
  state.enemies = state.enemies.filter(enemy => !enemy.dead)
}

export function updateParticles(state, dt) {
  for (const particle of state.particles) {
    particle.x += particle.vx * dt
    particle.y += particle.vy * dt
    particle.vx *= 0.96
    particle.vy *= 0.96
    particle.life -= dt
  }
  state.particles = state.particles.filter(particle => particle.life > 0)
}

export function updatePickups(state) {
  state.pickups = state.pickups.filter(pickup => {
    if (distanceSquared(pickup.x, pickup.y, state.player.x, state.player.y) < (pickup.radius + state.player.radius) ** 2) {
      state.hearth.kindling += 1
      state.audio?.pickup?.()
      return false
    }
    return true
  })
}

export function updateFloats(state, dt) {
  for (const item of state.floats) { item.y -= 24 * dt; item.life -= dt }
  state.floats = state.floats.filter(item => item.life > 0)
}

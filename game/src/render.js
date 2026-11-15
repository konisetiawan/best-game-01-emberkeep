import { FIELD, PALETTE, FONT } from './config.js'

export function createRenderer(canvas) {
  canvas.width = FIELD.width
  canvas.height = FIELD.height
  const ctx = canvas.getContext('2d')

  function text(value, x, y, size = 20, color = '#fff', align = 'left') {
    ctx.font = `600 ${size}px ${FONT}`
    ctx.fillStyle = color
    ctx.textAlign = align
    ctx.textBaseline = 'middle'
    ctx.fillText(value, x, y)
  }

  function overlay(state) {
    ctx.fillStyle = 'rgba(7, 8, 22, 0.78)'
    ctx.fillRect(0, 0, FIELD.width, FIELD.height)
    ctx.textAlign = 'center'
    if (state.phase === 'title') {
      text('EMBERKEEP', FIELD.width / 2, 210, 64, PALETTE.gold, 'center')
      text('Guard the last flame', FIELD.width / 2, 270, 24, PALETTE.teal, 'center')
      text('WASD move  /  Mouse aim  /  Click or Space shoot', FIELD.width / 2, 360, 20, '#f3e8d0', 'center')
      text('Shift dash  /  P pause', FIELD.width / 2, 396, 20, '#f3e8d0', 'center')
      text(`Best ${state.best}`, FIELD.width / 2, 462, 20, PALETTE.gold, 'center')
      text('Press Enter to start', FIELD.width / 2, 535, 26, '#fff', 'center')
    } else if (state.phase === 'upgrade') {
      text('CHOOSE AN UPGRADE', FIELD.width / 2, 190, 38, PALETTE.gold, 'center')
      for (let i = 0; i < 3; i += 1) {
        const choice = state.upgradeChoices[i]
        const x = 250 + i * 270
        ctx.fillStyle = '#20223b'
        ctx.strokeStyle = PALETTE.teal
        ctx.lineWidth = 2
        ctx.fillRect(x, 280, 230, 170)
        ctx.strokeRect(x, 280, 230, 170)
        text(`${i + 1}`, x + 20, 308, 18, PALETTE.gold, 'left')
        if (choice) {
          text(choice.name, x + 115, 354, 21, '#fff', 'center')
          text(choice.desc, x + 115, 402, 16, '#c9cadd', 'center')
        }
      }
    } else if (state.phase === 'paused') {
      text('Paused - P to resume', FIELD.width / 2, FIELD.height / 2, 38, '#fff', 'center')
    } else if (state.phase === 'over' || state.phase === 'victory') {
      text(state.phase === 'over' ? 'The Hearth has fallen' : 'The Last Hearth endures!', FIELD.width / 2, 250, 42, state.phase === 'over' ? '#ff8068' : PALETTE.gold, 'center')
      text(`Score ${state.score}   Best ${state.best}`, FIELD.width / 2, 330, 23, '#fff', 'center')
      text(state.phase === 'over' ? 'Press R to restart' : 'Press R to play again', FIELD.width / 2, 405, 24, PALETTE.teal, 'center')
    }
  }

  function draw(state) {
    ctx.save()
    if (state.shake > 0) ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake)
    ctx.fillStyle = PALETTE.background
    ctx.fillRect(0, 0, FIELD.width, FIELD.height)
    const glow = ctx.createRadialGradient(state.hearth.x, state.hearth.y, 18, state.hearth.x, state.hearth.y, 390)
    glow.addColorStop(0, 'rgba(255, 127, 48, 0.20)')
    glow.addColorStop(1, 'rgba(255, 127, 48, 0)')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, FIELD.width, FIELD.height)

    const hearth = state.hearth
    ctx.beginPath()
    ctx.arc(hearth.x, hearth.y, hearth.radius + 10, 0, Math.PI * 2)
    ctx.fillStyle = '#423f51'
    ctx.fill()
    ctx.beginPath()
    ctx.arc(hearth.x, hearth.y, hearth.radius, 0, Math.PI * 2)
    ctx.fillStyle = '#696576'
    ctx.fill()
    const flame = 1 + Math.sin(state.time * 12) * 0.12
    ctx.shadowColor = PALETTE.ember
    ctx.shadowBlur = 26
    ctx.beginPath()
    ctx.ellipse(hearth.x, hearth.y - 7, 12 * flame, 18 * flame, 0, 0, Math.PI * 2)
    ctx.fillStyle = PALETTE.ember
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.beginPath()
    ctx.arc(hearth.x, hearth.y, hearth.radius + 15, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0, hearth.hp / hearth.maxHp))
    ctx.strokeStyle = PALETTE.gold
    ctx.lineWidth = 4
    ctx.stroke()

    for (const pickup of state.pickups) {
      ctx.save()
      ctx.translate(pickup.x, pickup.y)
      ctx.rotate(Math.PI / 4)
      ctx.fillStyle = PALETTE.gold
      ctx.fillRect(-7, -7, 14, 14)
      ctx.restore()
    }

    const player = state.player
    if (!(player.invulnerable > 0 && Math.floor(state.time * 18) % 2)) {
      ctx.shadowColor = PALETTE.teal
      ctx.shadowBlur = 24
      ctx.beginPath()
      ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2)
      ctx.fillStyle = PALETTE.teal
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.fillStyle = '#172932'
      ctx.fillRect(player.x - 5, player.y - 8, 10, 14)
      ctx.fillStyle = PALETTE.gold
      ctx.beginPath()
      ctx.arc(player.x, player.y - 2, 3, 0, Math.PI * 2)
      ctx.fill()
    }

    for (const enemy of state.enemies) {
      const { x, y, radius, kind } = enemy
      ctx.save()
      if (kind === 'cinder') {
        ctx.fillStyle = '#e86b45'
        ctx.beginPath()
        ctx.ellipse(x, y, radius, radius * 0.78, Math.sin(state.time * 4 + x) * 0.12, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#fff2d2'
        ctx.fillRect(x - 6, y - 3, 3, 4)
        ctx.fillRect(x + 3, y - 3, 3, 4)
      } else if (kind === 'emberbat') {
        ctx.fillStyle = '#c66bd0'
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x - radius * 2, y - radius * (0.7 + Math.sin(state.time * 12) * 0.2))
        ctx.lineTo(x - radius, y + radius)
        ctx.lineTo(x, y + radius * 0.45)
        ctx.lineTo(x + radius, y + radius)
        ctx.lineTo(x + radius * 2, y - radius * (0.7 + Math.sin(state.time * 12) * 0.2))
        ctx.closePath()
        ctx.fill()
        ctx.fillStyle = '#fff'
        ctx.fillRect(x - 3, y - 2, 2, 3)
        ctx.fillRect(x + 2, y - 2, 2, 3)
      } else if (kind === 'brute') {
        ctx.fillStyle = '#8e939e'
        ctx.beginPath()
        ctx.moveTo(x - radius, y - radius * 0.4)
        ctx.lineTo(x - radius * 0.5, y - radius)
        ctx.lineTo(x + radius * 0.55, y - radius * 0.8)
        ctx.lineTo(x + radius, y)
        ctx.lineTo(x + radius * 0.6, y + radius)
        ctx.lineTo(x - radius * 0.8, y + radius * 0.7)
        ctx.closePath()
        ctx.fill()
        ctx.strokeStyle = '#4d525f'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(x, y - radius * 0.7)
        ctx.lineTo(x - 5, y)
        ctx.lineTo(x + 4, y + 5)
        ctx.stroke()
      } else {
        ctx.fillStyle = '#bd3f38'
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#e3bf81'
        ctx.beginPath()
        ctx.moveTo(x - radius * 0.75, y - radius * 0.55)
        ctx.lineTo(x - radius * 0.55, y - radius * 1.3)
        ctx.lineTo(x - radius * 0.15, y - radius * 0.65)
        ctx.lineTo(x + radius * 0.2, y - radius * 1.4)
        ctx.lineTo(x + radius * 0.38, y - radius * 0.6)
        ctx.lineTo(x + radius * 0.82, y - radius)
        ctx.lineTo(x + radius * 0.7, y - radius * 0.25)
        ctx.closePath()
        ctx.fill()
        ctx.fillStyle = PALETTE.gold
        ctx.fillRect(x - 22, y - 3, 8, 4)
        ctx.fillRect(x + 14, y - 3, 8, 4)
        ctx.fillStyle = '#1a1927'
        ctx.fillRect(x - 40, y - radius - 18, 80, 7)
        ctx.fillStyle = '#f15845'
        ctx.fillRect(x - 40, y - radius - 18, 80 * Math.max(0, enemy.hp / enemy.maxHp), 7)
      }
      ctx.restore()
    }

    for (const bullet of state.bullets) {
      ctx.strokeStyle = PALETTE.gold
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(bullet.x - bullet.vx * 0.025, bullet.y - bullet.vy * 0.025)
      ctx.lineTo(bullet.x, bullet.y)
      ctx.stroke()
    }
    for (const particle of state.particles) {
      ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife)
      ctx.fillStyle = particle.color
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
    for (const item of state.floats) {
      ctx.globalAlpha = Math.max(0, item.life / 0.8)
      text(item.text, item.x, item.y, 17, PALETTE.gold, 'center')
    }
    ctx.globalAlpha = 1

    text(`Score ${state.score}`, 26, 30, 20, '#fff')
    text(`Wave ${state.wave}/${10}`, FIELD.width / 2, 30, 20, PALETTE.gold, 'center')
    ctx.fillStyle = '#28283d'
    ctx.fillRect(FIELD.width / 2 - 120, 54, 240, 10)
    ctx.fillStyle = PALETTE.ember
    ctx.fillRect(FIELD.width / 2 - 120, 54, 240 * Math.max(0, hearth.hp / hearth.maxHp), 10)
    text(`Hearth ${Math.ceil(hearth.hp)}`, FIELD.width / 2, 80, 14, '#eee', 'center')
    text('♥'.repeat(player.hearts), FIELD.width - 28, 30, 22, '#ff7373', 'right')
    if (state.combo > 1) text(`x${state.combo}`, 26, 62, 18, PALETTE.gold)
    ctx.fillStyle = '#28283d'
    ctx.fillRect(26, 84, 110, 8)
    ctx.fillStyle = PALETTE.teal
    ctx.fillRect(26, 84, 110 * (1 - player.dashCooldown / 2.5), 8)
    if (state.bannerTimer > 0 || state.banner) text(state.banner, FIELD.width / 2, 130, 24, PALETTE.gold, 'center')
    ctx.restore()
    if (state.phase !== 'playing' && state.phase !== 'title') overlay(state)
    else if (state.phase === 'title') overlay(state)
  }

  return { draw }
}

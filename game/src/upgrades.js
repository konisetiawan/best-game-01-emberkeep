export const UPGRADE_POOL = [
  { id: 'ember-rounds', name: 'Ember Rounds', desc: '+1 damage', apply: player => { player.upgrades.damage += 1 } },
  { id: 'rapid-ignition', name: 'Rapid Ignition', desc: 'Fire 15% faster', apply: player => { player.upgrades.fireRate *= 0.85 } },
  { id: 'swift-boots', name: 'Swift Boots', desc: '+40 speed', apply: player => { player.upgrades.speed += 40 } },
  { id: 'split-flame', name: 'Split Flame', desc: '+1 spread shot', apply: player => { player.upgrades.spread += 1 } },
  { id: 'thick-hide', name: 'Thick Hide', desc: '+1 max heart and heal 1', apply: player => { player.maxHearts += 1; player.hearts = Math.min(player.maxHearts, player.hearts + 1) } },
  { id: 'hearth-mend', name: 'Hearth Mend', desc: '+30 hearth health', apply: (_player, hearth) => { hearth.hp = Math.min(hearth.maxHp, hearth.hp + 30) } },
  { id: 'long-burn', name: 'Long Burn', desc: '+15% bullet speed', apply: player => { player.upgrades.bulletSpeed = (player.upgrades.bulletSpeed || 1) * 1.15 } },
]

export function rollUpgrades(random, n) {
  const pool = UPGRADE_POOL.slice()
  const result = []
  while (pool.length && result.length < n) {
    const index = Math.floor(random() * pool.length)
    result.push(pool.splice(index, 1)[0])
  }
  return result
}

export function applyUpgrade(state, id) {
  const upgrade = UPGRADE_POOL.find(entry => entry.id === id)
  if (!upgrade) return false
  upgrade.apply(state.player, state.hearth)
  state.audio?.pickup?.()
  return true
}

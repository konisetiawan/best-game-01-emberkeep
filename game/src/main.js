// Wires the game modules together for browser play and staged shots.
import { STEP } from './config.js'
import { createRandom } from './random.js'
import { createAudio } from './audio.js'
import { createInput } from './input.js'
import { createGameState, updateGame } from './game.js'
import { createRenderer } from './render.js'
import { stageShot } from './shots.js'

const params = new URLSearchParams(window.location.search)
const shot = params.get('shot')
const seed = Number(params.get('seed') || 7)
const canvas = document.querySelector('#game')
const status = document.querySelector('#status')
const renderer = createRenderer(canvas)
const input = createInput(canvas)
const audio = createAudio()

if (['title', 'play', 'win', 'over'].includes(shot)) {
  const state = createGameState(createRandom(seed), null)
  stageShot(state, shot, seed)
  requestAnimationFrame(() => {
    renderer.draw(state)
    requestAnimationFrame(() => {
      renderer.draw(state)
      window.__shotReady = true
      status.textContent = 'shot ' + shot
    })
  })
} else {
  const state = createGameState(createRandom((Math.random() * 2147483647) | 0), audio)
  let previous = 0
  let accumulator = 0
  const frame = (now) => {
    const dt = previous ? Math.min((now - previous) / 1000, 0.1) : 0
    previous = now
    accumulator += dt
    while (accumulator >= STEP) {
      updateGame(state, input, STEP)
      accumulator -= STEP
    }
    renderer.draw(state)
    status.textContent = state.phase + ' score ' + state.score + ' wave ' + state.wave
    requestAnimationFrame(frame)
  }
  window.addEventListener('keydown', () => audio.ensure(), { once: true })
  window.addEventListener('mousedown', () => audio.ensure(), { once: true })
  requestAnimationFrame(frame)
}

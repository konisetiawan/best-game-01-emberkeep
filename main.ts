// Package Emberkeep and its dossier for Makefun.
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildDossier } from './vendor/makefun-game.ts'

const ownDir = dirname(fileURLToPath(import.meta.url))
const output = resolve(process.env.MAKEFUN_OUTPUT_DIR || '/output')
mkdirSync(output, { recursive: true })
cpSync(join(ownDir, 'game'), join(output, 'game'), { recursive: true })
if (existsSync(join(ownDir, 'screenshots'))) {
  cpSync(join(ownDir, 'screenshots'), join(output, 'screenshots'), { recursive: true })
}
const dossier = buildDossier(output, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
})
writeFileSync(join(output, 'dossier.json'), dossier)

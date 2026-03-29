import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { seedState } from '../src/lib/seed.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dataDir = path.resolve(__dirname, '../data')
const stateFile = path.join(dataDir, 'app-state.json')

function cloneSeed() {
  return JSON.parse(JSON.stringify(seedState))
}

async function ensureStateFile() {
  await mkdir(dataDir, { recursive: true })

  try {
    await readFile(stateFile, 'utf8')
  } catch {
    await writeFile(stateFile, JSON.stringify(cloneSeed(), null, 2))
  }
}

export async function readState() {
  await ensureStateFile()
  const raw = await readFile(stateFile, 'utf8')
  const parsed = JSON.parse(raw)
  return { ...cloneSeed(), ...parsed }
}

export async function writeState(state) {
  await ensureStateFile()
  await writeFile(stateFile, JSON.stringify(state, null, 2))
  return state
}

export async function resetState() {
  const nextState = cloneSeed()
  await writeState(nextState)
  return nextState
}

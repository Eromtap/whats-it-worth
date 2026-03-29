import express from 'express'
import { fileURLToPath } from 'node:url'
import { createId, estimateValue } from '../src/lib/seed.js'
import { readState, resetState, writeState } from './store.js'

export const app = express()
const port = Number(process.env.PORT || 3001)

app.use(express.json())

function currentUser(state) {
  return state.users.find((user) => user.id === state.activeUserId) || null
}

function sanitizeState(state) {
  return state
}

app.get('/api/health', async (_req, res) => {
  const state = await readState()
  res.json({
    ok: true,
    activeUserId: state.activeUserId,
    counts: {
      users: state.users.length,
      items: state.items.length,
      listings: state.listings.length,
      offers: state.offers.length,
      comps: state.comps.length,
    },
  })
})

app.get('/api/state', async (_req, res) => {
  const state = await readState()
  res.json({ state: sanitizeState(state) })
})

app.post('/api/auth/register', async (req, res) => {
  const { name, email, city } = req.body || {}
  if (!name || !email || !city) {
    return res.status(400).json({ message: 'Name, email, and city are required.' })
  }

  const state = await readState()
  const existing = state.users.find((user) => user.email.toLowerCase() === email.toLowerCase())

  if (existing) {
    state.activeUserId = existing.id
    await writeState(state)
    return res.json({ state: sanitizeState(state), result: { ok: true, mode: 'login' } })
  }

  const id = createId('user')
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')

  state.users.push({ id, name, email, city, initials })
  state.activeUserId = id
  await writeState(state)

  return res.status(201).json({ state: sanitizeState(state), result: { ok: true, mode: 'register' } })
})

app.post('/api/auth/login', async (req, res) => {
  const { email } = req.body || {}
  if (!email) {
    return res.status(400).json({ message: 'Email is required.' })
  }

  const state = await readState()
  const user = state.users.find((entry) => entry.email.toLowerCase() === email.toLowerCase())
  if (!user) {
    return res.status(404).json({ message: 'No account exists for that email yet.' })
  }

  state.activeUserId = user.id
  await writeState(state)
  return res.json({ state: sanitizeState(state), result: { ok: true } })
})

app.post('/api/auth/logout', async (_req, res) => {
  const state = await readState()
  state.activeUserId = null
  await writeState(state)
  return res.json({ state: sanitizeState(state), result: { ok: true } })
})

app.post('/api/items', async (req, res) => {
  const payload = req.body || {}
  const state = await readState()
  if (!state.activeUserId) {
    return res.status(401).json({ message: 'You must be signed in.' })
  }

  const estimate = estimateValue(payload.category, payload.condition, payload.photoCount)
  const item = {
    id: createId('item'),
    ownerId: state.activeUserId,
    title: payload.title,
    category: payload.category,
    room: payload.room,
    condition: payload.condition,
    photoCount: Number(payload.photoCount),
    notes: payload.notes,
    visibility: payload.visibility,
    estimatedLow: estimate.low,
    estimatedHigh: estimate.high,
    confidence: estimate.confidence,
    createdAt: new Date().toISOString(),
  }

  state.items.unshift(item)
  await writeState(state)
  return res.status(201).json({ state: sanitizeState(state), item })
})

app.patch('/api/items/:itemId', async (req, res) => {
  const state = await readState()
  const item = state.items.find((entry) => entry.id === req.params.itemId)
  if (!item) {
    return res.status(404).json({ message: 'Item not found.' })
  }

  Object.assign(item, req.body || {})
  if (req.body?.category !== undefined || req.body?.condition !== undefined || req.body?.photoCount !== undefined) {
    const estimate = estimateValue(item.category, item.condition, item.photoCount)
    item.estimatedLow = estimate.low
    item.estimatedHigh = estimate.high
    item.confidence = estimate.confidence
  }

  await writeState(state)
  return res.json({ state: sanitizeState(state), item })
})

app.post('/api/listings', async (req, res) => {
  const { itemId, details } = req.body || {}
  const state = await readState()
  const item = state.items.find((entry) => entry.id === itemId)
  if (!item) {
    return res.status(404).json({ message: 'Item not found.' })
  }

  const existing = state.listings.find((listing) => listing.itemId === itemId && listing.status === 'active')
  if (existing) {
    Object.assign(existing, {
      askingPrice: Number(details.askingPrice),
      mode: details.mode,
      radiusMiles: Number(details.radiusMiles),
    })
    item.visibility = 'listed'
    await writeState(state)
    return res.json({ state: sanitizeState(state), listing: existing })
  }

  const listing = {
    id: createId('listing'),
    itemId,
    ownerId: item.ownerId,
    title: item.title,
    askingPrice: Number(details.askingPrice),
    mode: details.mode,
    radiusMiles: Number(details.radiusMiles),
    status: 'active',
    publishedAt: new Date().toISOString(),
  }

  state.listings.unshift(listing)
  item.visibility = 'listed'
  await writeState(state)
  return res.status(201).json({ state: sanitizeState(state), listing })
})

app.post('/api/listings/:listingId/archive', async (req, res) => {
  const state = await readState()
  const listing = state.listings.find((entry) => entry.id === req.params.listingId)
  if (!listing) {
    return res.status(404).json({ message: 'Listing not found.' })
  }

  listing.status = 'archived'
  const item = state.items.find((entry) => entry.id === listing.itemId)
  if (item && item.ownerId === state.activeUserId) item.visibility = 'private'

  await writeState(state)
  return res.json({ state: sanitizeState(state), listing })
})

app.post('/api/offers', async (req, res) => {
  const payload = req.body || {}
  const state = await readState()
  const user = currentUser(state)

  if (!user) {
    return res.status(401).json({ message: 'You must be signed in.' })
  }

  const offer = {
    id: createId('offer'),
    kind: payload.kind,
    listingId: payload.listingId || null,
    itemId: payload.itemId,
    buyerId: state.activeUserId,
    buyerName: user.name,
    amount: Number(payload.amount),
    note: payload.note,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }

  state.offers.unshift(offer)
  await writeState(state)
  return res.status(201).json({ state: sanitizeState(state), offer })
})

app.post('/api/offers/:offerId/respond', async (req, res) => {
  const { status } = req.body || {}
  const state = await readState()
  const offer = state.offers.find((entry) => entry.id === req.params.offerId)
  if (!offer) {
    return res.status(404).json({ message: 'Offer not found.' })
  }

  offer.status = status
  await writeState(state)
  return res.json({ state: sanitizeState(state), offer })
})

app.post('/api/dev/reset', async (_req, res) => {
  const state = await resetState()
  res.json({ state: sanitizeState(state) })
})

app.use((error, _req, res, _next) => {
  console.error(error)
  res.status(500).json({ message: 'Unexpected server error.' })
})

export function startServer(listenPort = port) {
  return app.listen(listenPort, () => {
    console.log(`API listening on http://localhost:${listenPort}`)
  })
}

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]

if (isDirectRun) {
  startServer()
}

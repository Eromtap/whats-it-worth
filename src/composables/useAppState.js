import { computed, ref, watch } from 'vue'
import { createId, estimateValue, seedState } from '../lib/seed'

const STORAGE_KEY = 'wiw-mvp-state-v1'

function cloneSeed() {
  return JSON.parse(JSON.stringify(seedState))
}

function loadState() {
  if (typeof window === 'undefined') return cloneSeed()
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (!stored) return cloneSeed()

  try {
    return { ...cloneSeed(), ...JSON.parse(stored) }
  } catch {
    return cloneSeed()
  }
}

export function useAppState() {
  const state = ref(loadState())
  const activeView = ref('overview')
  const selectedItemId = ref(state.value.items.find((item) => item.ownerId === state.value.activeUserId)?.id || null)

  watch(
    state,
    (value) => {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
      }
    },
    { deep: true },
  )

  const currentUser = computed(() => state.value.users.find((user) => user.id === state.value.activeUserId) || null)
  const ownedItems = computed(() => state.value.items.filter((item) => item.ownerId === state.value.activeUserId))
  const publicListings = computed(() => state.value.listings.filter((listing) => listing.status === 'active'))
  const myListings = computed(() => publicListings.value.filter((listing) => listing.ownerId === state.value.activeUserId))
  const nearbyListings = computed(() => publicListings.value.filter((listing) => listing.ownerId !== state.value.activeUserId))
  const offerableItems = computed(() => state.value.items.filter((item) => item.ownerId !== state.value.activeUserId && item.visibility === 'offers'))
  const inboxOffers = computed(() => state.value.offers.filter((offer) => state.value.items.find((item) => item.id === offer.itemId)?.ownerId === state.value.activeUserId))
  const sentOffers = computed(() => state.value.offers.filter((offer) => offer.buyerId === state.value.activeUserId))
  const selectedItem = computed(() => ownedItems.value.find((item) => item.id === selectedItemId.value) || ownedItems.value[0] || null)
  const selectedItemComps = computed(() => state.value.comps.filter((comp) => comp.itemId === selectedItem.value?.id))
  const portfolioValue = computed(() => ownedItems.value.reduce((sum, item) => {
    sum.low += item.estimatedLow
    sum.high += item.estimatedHigh
    return sum
  }, { low: 0, high: 0 }))

  function registerUser({ name, email, city }) {
    const existing = state.value.users.find((user) => user.email.toLowerCase() === email.toLowerCase())
    if (existing) {
      state.value.activeUserId = existing.id
      return { ok: true, mode: 'login' }
    }

    const id = createId('user')
    const initials = name.split(' ').slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('')
    state.value.users.push({ id, name, email, city, initials })
    state.value.activeUserId = id
    return { ok: true, mode: 'register' }
  }

  function login(email) {
    const user = state.value.users.find((entry) => entry.email.toLowerCase() === email.toLowerCase())
    if (!user) return { ok: false, message: 'No account exists for that email yet.' }
    state.value.activeUserId = user.id
    return { ok: true }
  }

  function logout() {
    state.value.activeUserId = null
    activeView.value = 'overview'
  }

  function addItem(payload) {
    const estimate = estimateValue(payload.category, payload.condition, payload.photoCount)
    const item = {
      id: createId('item'),
      ownerId: state.value.activeUserId,
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
    state.value.items.unshift(item)
    selectedItemId.value = item.id
    return item
  }

  function updateItem(itemId, updates) {
    const item = state.value.items.find((entry) => entry.id === itemId)
    if (!item) return
    Object.assign(item, updates)
    if (updates.category !== undefined || updates.condition !== undefined || updates.photoCount !== undefined) {
      const estimate = estimateValue(item.category, item.condition, item.photoCount)
      item.estimatedLow = estimate.low
      item.estimatedHigh = estimate.high
      item.confidence = estimate.confidence
    }
  }

  function createListing(itemId, details) {
    const item = state.value.items.find((entry) => entry.id === itemId)
    if (!item) return null
    const existing = state.value.listings.find((listing) => listing.itemId === itemId && listing.status === 'active')
    if (existing) {
      Object.assign(existing, details)
      item.visibility = 'listed'
      return existing
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
    state.value.listings.unshift(listing)
    item.visibility = 'listed'
    return listing
  }

  function archiveListing(listingId) {
    const listing = state.value.listings.find((entry) => entry.id === listingId)
    if (!listing) return
    listing.status = 'archived'
    const item = state.value.items.find((entry) => entry.id === listing.itemId)
    if (item && item.ownerId === state.value.activeUserId) item.visibility = 'private'
  }

  function createOffer(payload) {
    const offer = {
      id: createId('offer'),
      kind: payload.kind,
      listingId: payload.listingId || null,
      itemId: payload.itemId,
      buyerId: state.value.activeUserId,
      buyerName: currentUser.value?.name || 'Unknown buyer',
      amount: Number(payload.amount),
      note: payload.note,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }
    state.value.offers.unshift(offer)
    return offer
  }

  function respondToOffer(offerId, status) {
    const offer = state.value.offers.find((entry) => entry.id === offerId)
    if (offer) offer.status = status
  }

  function resetDemo() {
    state.value = cloneSeed()
    selectedItemId.value = state.value.items.find((item) => item.ownerId === state.value.activeUserId)?.id || null
    activeView.value = 'overview'
  }

  return {
    state,
    activeView,
    selectedItemId,
    currentUser,
    ownedItems,
    myListings,
    nearbyListings,
    offerableItems,
    inboxOffers,
    sentOffers,
    selectedItem,
    selectedItemComps,
    portfolioValue,
    registerUser,
    login,
    logout,
    addItem,
    updateItem,
    createListing,
    archiveListing,
    createOffer,
    respondToOffer,
    resetDemo,
  }
}

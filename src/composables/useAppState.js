import { computed, ref } from 'vue'
import { seedState } from '../lib/seed'

function cloneSeed() {
  return JSON.parse(JSON.stringify(seedState))
}

async function request(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload.message || 'Request failed.')
  }

  return payload
}

export function useAppState() {
  const state = ref(cloneSeed())
  const activeView = ref('overview')
  const selectedItemId = ref(state.value.items.find((item) => item.ownerId === state.value.activeUserId)?.id || null)
  const isReady = ref(false)
  const isSaving = ref(false)
  const errorMessage = ref('')

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

  function applyState(nextState) {
    state.value = nextState

    if (!selectedItemId.value || !ownedItems.value.find((item) => item.id === selectedItemId.value)) {
      selectedItemId.value = ownedItems.value[0]?.id || null
    }
  }

  async function runMutation(task) {
    isSaving.value = true
    errorMessage.value = ''

    try {
      return await task()
    } catch (error) {
      errorMessage.value = error.message
      throw error
    } finally {
      isSaving.value = false
    }
  }

  async function fetchState() {
    try {
      const payload = await request('/api/state')
      applyState(payload.state)
      errorMessage.value = ''
    } catch (error) {
      errorMessage.value = error.message
      throw error
    } finally {
      isReady.value = true
    }
  }

  async function registerUser(payload) {
    const response = await runMutation(() =>
      request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    )

    applyState(response.state)
    return response.result
  }

  async function login(email) {
    try {
      const response = await runMutation(() =>
        request('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email }),
        }),
      )

      applyState(response.state)
      return response.result
    } catch (error) {
      return { ok: false, message: error.message }
    }
  }

  async function logout() {
    const response = await runMutation(() =>
      request('/api/auth/logout', {
        method: 'POST',
      }),
    )

    applyState(response.state)
    activeView.value = 'overview'
  }

  async function addItem(payload) {
    const response = await runMutation(() =>
      request('/api/items', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    )

    applyState(response.state)
    selectedItemId.value = response.item.id
    return response.item
  }

  async function updateItem(itemId, updates) {
    const response = await runMutation(() =>
      request(`/api/items/${itemId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }),
    )

    applyState(response.state)
    return response.item
  }

  async function createListing(itemId, details) {
    const response = await runMutation(() =>
      request('/api/listings', {
        method: 'POST',
        body: JSON.stringify({ itemId, details }),
      }),
    )

    applyState(response.state)
    return response.listing
  }

  async function archiveListing(listingId) {
    const response = await runMutation(() =>
      request(`/api/listings/${listingId}/archive`, {
        method: 'POST',
      }),
    )

    applyState(response.state)
  }

  async function createOffer(payload) {
    const response = await runMutation(() =>
      request('/api/offers', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    )

    applyState(response.state)
    return response.offer
  }

  async function respondToOffer(offerId, status) {
    const response = await runMutation(() =>
      request(`/api/offers/${offerId}/respond`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      }),
    )

    applyState(response.state)
  }

  async function resetDemo() {
    const response = await runMutation(() =>
      request('/api/dev/reset', {
        method: 'POST',
      }),
    )

    applyState(response.state)
    activeView.value = 'overview'
  }

  fetchState()

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
    isReady,
    isSaving,
    errorMessage,
    fetchState,
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

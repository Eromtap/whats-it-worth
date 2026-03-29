<script setup>
import { computed, reactive, ref } from 'vue'

const props = defineProps({
  nearbyListings: { type: Array, required: true },
  offerableItems: { type: Array, required: true },
  myListings: { type: Array, required: true },
  listings: { type: Array, required: true },
  items: { type: Array, required: true },
  users: { type: Array, required: true },
})

const emit = defineEmits(['archive-listing', 'create-offer'])
const offerForms = reactive({})
const marketSearch = ref('')

function ownerName(ownerId) {
  return props.users.find((user) => user.id === ownerId)?.name || 'Unknown owner'
}

function itemForListing(listingId) {
  const listing = props.listings.find((entry) => entry.id === listingId)
  return props.items.find((item) => item.id === listing?.itemId)
}

function formFor(key) {
  if (!offerForms[key]) offerForms[key] = { amount: '', note: '' }
  return offerForms[key]
}

function submitOffer(kind, itemId, listingId) {
  const key = listingId || itemId
  const form = formFor(key)
  if (!form.amount) return
  emit('create-offer', { kind, itemId, listingId, amount: Number(form.amount), note: form.note })
  form.amount = ''
  form.note = ''
}

const myListingCards = computed(() =>
  props.myListings.map((listing) => ({ ...listing, item: props.items.find((item) => item.id === listing.itemId) })),
)

const filteredNearby = computed(() =>
  props.nearbyListings.filter((listing) => !marketSearch.value || listing.title.toLowerCase().includes(marketSearch.value.toLowerCase())),
)

const filteredOffers = computed(() =>
  props.offerableItems.filter((item) => !marketSearch.value || item.title.toLowerCase().includes(marketSearch.value.toLowerCase())),
)
</script>

<template>
  <section class="catalog-layout">
    <article class="catalog-panel span-two">
      <div class="catalog-topline">
        <div>
          <span class="eyebrow">Marketplace</span>
          <h2>Browse and act on items quickly</h2>
        </div>
        <input v-model="marketSearch" class="toolbar-search" type="text" placeholder="Search listings and private offer cards" />
      </div>
    </article>

    <article class="catalog-panel span-two">
      <div class="catalog-topline">
        <div>
          <span class="eyebrow">Your listings</span>
          <h2>Live items on the market</h2>
        </div>
      </div>

      <div class="catalog-table">
        <div class="catalog-head desktop-only">
          <span>Item</span>
          <span>Mode</span>
          <span>Radius</span>
          <span>Condition</span>
          <span>Ask</span>
          <span>Action</span>
        </div>

        <div v-for="listing in myListingCards" :key="listing.id" class="catalog-row static-row">
          <div class="catalog-primary">
            <strong>{{ listing.title }}</strong>
            <p>{{ listing.item?.category }}</p>
          </div>
          <span data-label="Mode">{{ listing.mode }}</span>
          <span data-label="Radius">{{ listing.radiusMiles }} mi</span>
          <span data-label="Condition">{{ listing.item?.condition }}</span>
          <strong class="money-cell" data-label="Ask">${{ listing.askingPrice }}</strong>
          <span data-label="Action">
            <button class="link-button" type="button" @click="emit('archive-listing', listing.id)">Archive</button>
          </span>
        </div>

        <div v-if="!myListingCards.length" class="catalog-empty">
          No live listings yet.
        </div>
      </div>
    </article>

    <article class="catalog-panel">
      <div class="catalog-topline">
        <div>
          <span class="eyebrow">Nearby listings</span>
          <h2>Public sale rows</h2>
        </div>
      </div>

      <div class="dense-stack">
        <div v-for="listing in filteredNearby" :key="listing.id" class="action-row">
          <div class="action-copy">
            <strong>{{ listing.title }}</strong>
            <p>{{ ownerName(listing.ownerId) }} | {{ listing.radiusMiles }} miles | ${{ listing.askingPrice }}</p>
          </div>
          <div class="action-form">
            <input v-model="formFor(listing.id).amount" type="number" min="1" placeholder="Offer" />
            <input v-model="formFor(listing.id).note" type="text" placeholder="Pickup timing or note" />
            <button class="button button-primary" type="button" @click="submitOffer('listing', itemForListing(listing.id)?.id, listing.id)">
              Offer
            </button>
          </div>
        </div>
        <div v-if="!filteredNearby.length" class="catalog-empty">No nearby listings match that search.</div>
      </div>
    </article>

    <article class="catalog-panel">
      <div class="catalog-topline">
        <div>
          <span class="eyebrow">Blind offers</span>
          <h2>Private but offerable</h2>
        </div>
      </div>

      <div class="dense-stack">
        <div v-for="item in filteredOffers" :key="item.id" class="action-row">
          <div class="action-copy">
            <strong>{{ item.title }}</strong>
            <p>{{ ownerName(item.ownerId) }} | hidden inventory | ${{ item.estimatedLow }} - ${{ item.estimatedHigh }}</p>
          </div>
          <div class="action-form">
            <input v-model="formFor(item.id).amount" type="number" min="1" placeholder="Offer" />
            <input v-model="formFor(item.id).note" type="text" placeholder="Why you want it" />
            <button class="button button-secondary" type="button" @click="submitOffer('private-item', item.id, null)">
              Send
            </button>
          </div>
        </div>
        <div v-if="!filteredOffers.length" class="catalog-empty">No private offer cards match that search.</div>
      </div>
    </article>
  </section>
</template>

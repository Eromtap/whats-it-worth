<script setup>
import { onMounted, ref, watch } from 'vue'
import AppHeader from './components/AppHeader.vue'
import AuthPanel from './components/AuthPanel.vue'
import InboxView from './components/InboxView.vue'
import InventoryView from './components/InventoryView.vue'
import MarketplaceView from './components/MarketplaceView.vue'
import OverviewView from './components/OverviewView.vue'
import { useAppState } from './composables/useAppState'

const app = useAppState()
const theme = ref('dark')

onMounted(() => {
  const storedTheme = window.localStorage.getItem('wiw-theme')
  theme.value = storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : 'dark'
})

watch(
  theme,
  (value) => {
    document.documentElement.setAttribute('data-theme', value)
    window.localStorage.setItem('wiw-theme', value)
  },
  { immediate: true },
)

function handleLogin({ email, onResult }) {
  app.login(email).then((result) => {
    onResult?.(result)
  })
}

function handleRegister(payload) {
  app.registerUser(payload)
}

function handleAddItem(payload) {
  app.addItem(payload).then((item) => {
    if (payload.visibility === 'listed') {
      app.createListing(item.id, {
        askingPrice: item.estimatedHigh,
        mode: 'sale',
        radiusMiles: 15,
      })
    }
  })
}

function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
}
</script>

<template>
  <div class="app-shell">
    <section v-if="!app.isReady.value" class="panel">
      <span class="eyebrow">Loading</span>
      <h2>Connecting to backend</h2>
      <p>Fetching application state from the Express API.</p>
    </section>

    <section v-else-if="app.errorMessage.value && !app.currentUser.value" class="panel">
      <span class="eyebrow">Connection issue</span>
      <h2>Backend request failed</h2>
      <p>{{ app.errorMessage.value }}</p>
      <button class="button button-primary" type="button" @click="app.fetchState">Retry</button>
    </section>

    <AuthPanel v-else-if="!app.currentUser.value" :error-message="app.errorMessage.value" @login="handleLogin" @register="handleRegister" />

    <template v-else>
      <AppHeader
        :current-user="app.currentUser.value"
        :active-view="app.activeView.value"
        :portfolio-value="app.portfolioValue.value"
        :theme="theme"
        @navigate="app.activeView.value = $event"
        @logout="app.logout"
        @reset="app.resetDemo"
        @toggle-theme="toggleTheme"
      />

      <main class="main-shell">
        <div v-if="app.errorMessage.value" class="panel">
          <span class="eyebrow">Request issue</span>
          <h2>Latest backend error</h2>
          <p>{{ app.errorMessage.value }}</p>
        </div>

        <OverviewView
          v-if="app.activeView.value === 'overview'"
          :current-user="app.currentUser.value"
          :owned-items="app.ownedItems.value"
          :my-listings="app.myListings.value"
          :inbox-offers="app.inboxOffers.value"
          :sent-offers="app.sentOffers.value"
          :portfolio-value="app.portfolioValue.value"
        />

        <InventoryView
          v-else-if="app.activeView.value === 'inventory'"
          :items="app.ownedItems.value"
          :selected-item-id="app.selectedItemId.value"
          :comps="app.selectedItemComps.value"
          @add-item="handleAddItem"
          @select-item="app.selectedItemId.value = $event"
          @update-item="app.updateItem"
          @create-listing="app.createListing($event.itemId, $event.details)"
        />

        <MarketplaceView
          v-else-if="app.activeView.value === 'marketplace'"
          :nearby-listings="app.nearbyListings.value"
          :offerable-items="app.offerableItems.value"
          :my-listings="app.myListings.value"
          :listings="app.state.value.listings"
          :items="app.state.value.items"
          :users="app.state.value.users"
          @archive-listing="app.archiveListing"
          @create-offer="app.createOffer"
        />

        <InboxView
          v-else
          :inbox-offers="app.inboxOffers.value"
          :sent-offers="app.sentOffers.value"
          :items="app.state.value.items"
          @respond="app.respondToOffer"
        />
      </main>
    </template>
  </div>
</template>

<script setup>
defineProps({
  currentUser: { type: Object, default: null },
  activeView: { type: String, required: true },
  portfolioValue: { type: Object, required: true },
  theme: { type: String, required: true },
})

const emit = defineEmits(['navigate', 'logout', 'reset', 'toggle-theme'])

const views = [
  { id: 'overview', label: 'Overview' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'marketplace', label: 'Marketplace' },
  { id: 'inbox', label: 'Inbox' },
]
</script>

<template>
  <header class="app-header">
    <div class="brand-row">
      <div class="brand">
        <span class="brand-mark">WIW</span>
        <div>
          <strong>What's It Worth</strong>
          <p>{{ currentUser?.city }} household inventory workspace</p>
        </div>
      </div>

      <div class="header-actions">
        <div class="portfolio-chip">
          <span>Portfolio range</span>
          <strong>${{ portfolioValue.low.toLocaleString() }} - ${{ portfolioValue.high.toLocaleString() }}</strong>
        </div>
        <div class="user-chip">
          <span class="avatar">{{ currentUser?.initials }}</span>
          <div>
            <strong>{{ currentUser?.name }}</strong>
            <p>{{ currentUser?.email }}</p>
          </div>
        </div>
        <button class="button button-secondary" type="button" @click="emit('toggle-theme')">
          {{ theme === 'dark' ? 'Light mode' : 'Dark mode' }}
        </button>
        <button class="button button-secondary" type="button" @click="emit('reset')">Reset demo</button>
        <button class="button button-secondary" type="button" @click="emit('logout')">Log out</button>
      </div>
    </div>

    <nav class="tab-row">
      <button
        v-for="view in views"
        :key="view.id"
        class="tab-button"
        :class="{ active: activeView === view.id }"
        type="button"
        @click="emit('navigate', view.id)"
      >
        {{ view.label }}
      </button>
    </nav>
  </header>
</template>

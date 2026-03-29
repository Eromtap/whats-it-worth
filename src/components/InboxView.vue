<script setup>
defineProps({
  inboxOffers: { type: Array, required: true },
  sentOffers: { type: Array, required: true },
  items: { type: Array, required: true },
})

const emit = defineEmits(['respond'])

function itemTitle(items, itemId) {
  return items.find((item) => item.id === itemId)?.title || 'Unknown item'
}
</script>

<template>
  <section class="two-column">
    <article class="panel">
      <span class="eyebrow">Offer inbox</span>
      <h2>Incoming offers</h2>
      <ul class="record-list">
        <li v-for="offer in inboxOffers" :key="offer.id" class="record-card static">
          <div>
            <strong>{{ itemTitle(items, offer.itemId) }}</strong>
            <p>{{ offer.buyerName }} | {{ offer.kind === 'listing' ? 'Public listing' : 'Blind offer' }}</p>
            <p>{{ offer.note }}</p>
          </div>
          <div class="record-meta">
            <strong>${{ offer.amount }}</strong>
            <span class="status-pill">{{ offer.status }}</span>
            <div v-if="offer.status === 'pending'" class="inline-actions">
              <button class="link-button" type="button" @click="emit('respond', offer.id, 'accepted')">Accept</button>
              <button class="link-button" type="button" @click="emit('respond', offer.id, 'declined')">Decline</button>
            </div>
          </div>
        </li>
        <li v-if="!inboxOffers.length" class="record-card static">
          <div>
            <strong>No incoming offers</strong>
            <p>Once buyers respond to your listings or private offerable items, they appear here.</p>
          </div>
        </li>
      </ul>
    </article>

    <article class="panel">
      <span class="eyebrow">Sent offers</span>
      <h2>Outgoing activity</h2>
      <ul class="record-list">
        <li v-for="offer in sentOffers" :key="offer.id" class="record-card static">
          <div>
            <strong>{{ itemTitle(items, offer.itemId) }}</strong>
            <p>{{ offer.kind === 'listing' ? 'Public listing' : 'Blind offer' }}</p>
            <p>{{ offer.note }}</p>
          </div>
          <div class="record-meta">
            <strong>${{ offer.amount }}</strong>
            <span class="status-pill">{{ offer.status }}</span>
          </div>
        </li>
        <li v-if="!sentOffers.length" class="record-card static">
          <div>
            <strong>No sent offers</strong>
            <p>Make offers from the marketplace screen to track them here.</p>
          </div>
        </li>
      </ul>
    </article>
  </section>
</template>

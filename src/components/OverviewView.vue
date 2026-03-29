<script setup>
const props = defineProps({
  currentUser: { type: Object, required: true },
  ownedItems: { type: Array, required: true },
  myListings: { type: Array, required: true },
  inboxOffers: { type: Array, required: true },
  sentOffers: { type: Array, required: true },
  portfolioValue: { type: Object, required: true },
})
</script>

<template>
  <section class="catalog-layout">
    <article class="catalog-panel span-two">
      <div class="catalog-topline">
        <div>
          <span class="eyebrow">Overview</span>
          <h2>{{ currentUser.name }}'s collection at a glance</h2>
        </div>
      </div>

      <div class="summary-strip">
        <div class="summary-box">
          <span>Tracked items</span>
          <strong>{{ ownedItems.length }}</strong>
        </div>
        <div class="summary-box">
          <span>Portfolio range</span>
          <strong>${{ portfolioValue.low.toLocaleString() }} - ${{ portfolioValue.high.toLocaleString() }}</strong>
        </div>
        <div class="summary-box">
          <span>Live listings</span>
          <strong>{{ myListings.length }}</strong>
        </div>
        <div class="summary-box">
          <span>Pending offers</span>
          <strong>{{ inboxOffers.filter((offer) => offer.status === 'pending').length }}</strong>
        </div>
      </div>
    </article>

    <article class="catalog-panel span-two">
      <div class="catalog-topline">
        <div>
          <span class="eyebrow">Recent inventory</span>
          <h2>Most relevant items</h2>
        </div>
      </div>

      <div class="catalog-table">
        <div class="catalog-head desktop-only">
          <span>Item</span>
          <span>Category</span>
          <span>Visibility</span>
          <span>Confidence</span>
          <span>Value</span>
        </div>

        <div v-for="item in ownedItems.slice(0, 6)" :key="item.id" class="catalog-row static-row">
          <div class="catalog-primary">
            <strong>{{ item.title }}</strong>
            <p>{{ item.room }}</p>
          </div>
          <span data-label="Category">{{ item.category }}</span>
          <span data-label="Visibility"><span class="status-pill">{{ item.visibility }}</span></span>
          <span data-label="Confidence">{{ item.confidence }}%</span>
          <strong class="money-cell" data-label="Value">${{ item.estimatedLow }} - ${{ item.estimatedHigh }}</strong>
        </div>
      </div>
    </article>

    <article class="catalog-panel">
      <span class="eyebrow">Incoming</span>
      <h2>Offer inbox</h2>
      <ul class="plain-list">
        <li v-for="offer in inboxOffers.slice(0, 5)" :key="offer.id">
          {{ offer.buyerName }} offered ${{ offer.amount }}. Status: {{ offer.status }}.
        </li>
        <li v-if="!inboxOffers.length">No incoming offers yet.</li>
      </ul>
    </article>

    <article class="catalog-panel">
      <span class="eyebrow">Outgoing</span>
      <h2>Your offers</h2>
      <ul class="plain-list">
        <li v-for="offer in sentOffers.slice(0, 5)" :key="offer.id">
          You offered ${{ offer.amount }}. Status: {{ offer.status }}.
        </li>
        <li v-if="!sentOffers.length">No outgoing offers yet.</li>
      </ul>
    </article>
  </section>
</template>

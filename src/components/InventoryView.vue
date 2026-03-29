<script setup>
import { computed, reactive, ref } from 'vue'
import { categories, conditions, estimateValue } from '../lib/seed'

const props = defineProps({
  items: { type: Array, required: true },
  selectedItemId: { type: String, default: null },
  comps: { type: Array, required: true },
})

const emit = defineEmits(['add-item', 'select-item', 'update-item', 'create-listing'])

const search = ref('')
const categoryFilter = ref('All')
const visibilityFilter = ref('All')

const form = reactive({
  title: '',
  category: categories[0],
  room: '',
  condition: 'Good',
  photoCount: 4,
  notes: '',
  visibility: 'private',
})

const listingDraft = reactive({ askingPrice: 0, mode: 'sale', radiusMiles: 15 })

const preview = computed(() => estimateValue(form.category, form.condition, form.photoCount))
const selectedItem = computed(() => props.items.find((item) => item.id === props.selectedItemId) || filteredItems.value[0] || null)
const filteredItems = computed(() =>
  props.items.filter((item) => {
    const matchesSearch =
      !search.value ||
      item.title.toLowerCase().includes(search.value.toLowerCase()) ||
      item.room.toLowerCase().includes(search.value.toLowerCase()) ||
      item.category.toLowerCase().includes(search.value.toLowerCase())

    const matchesCategory = categoryFilter.value === 'All' || item.category === categoryFilter.value
    const matchesVisibility = visibilityFilter.value === 'All' || item.visibility === visibilityFilter.value

    return matchesSearch && matchesCategory && matchesVisibility
  }),
)

function submitItem() {
  emit('add-item', { ...form })
  form.title = ''
  form.room = ''
  form.condition = 'Good'
  form.photoCount = 4
  form.notes = ''
  form.visibility = 'private'
}

function publishSelected() {
  if (!selectedItem.value) return
  emit('create-listing', {
    itemId: selectedItem.value.id,
    details: {
      askingPrice: listingDraft.askingPrice || selectedItem.value.estimatedHigh,
      mode: listingDraft.mode,
      radiusMiles: listingDraft.radiusMiles,
    },
  })
}

function visibilityLabel(value) {
  if (value === 'listed') return 'Listed'
  if (value === 'offers') return 'Offers'
  return 'Private'
}

function confidenceTone(value) {
  if (value >= 80) return 'strong'
  if (value >= 70) return 'medium'
  return 'soft'
}
</script>

<template>
  <section class="catalog-layout">
    <article class="catalog-panel span-two">
      <div class="catalog-topline">
        <div>
          <span class="eyebrow">Inventory</span>
          <h2>Household items</h2>
        </div>
        <div class="mini-stats">
          <div class="mini-stat">
            <span>Visible rows</span>
            <strong>{{ filteredItems.length }}</strong>
          </div>
          <div class="mini-stat">
            <span>Private</span>
            <strong>{{ props.items.filter((item) => item.visibility === 'private').length }}</strong>
          </div>
          <div class="mini-stat">
            <span>Listed</span>
            <strong>{{ props.items.filter((item) => item.visibility === 'listed').length }}</strong>
          </div>
        </div>
      </div>

      <div class="catalog-toolbar">
        <input v-model="search" type="text" placeholder="Search by title, room, or category" />
        <select v-model="categoryFilter">
          <option value="All">All categories</option>
          <option v-for="category in categories" :key="category">{{ category }}</option>
        </select>
        <select v-model="visibilityFilter">
          <option value="All">All visibility</option>
          <option value="private">Private</option>
          <option value="offers">Offers</option>
          <option value="listed">Listed</option>
        </select>
      </div>

      <div class="catalog-table">
        <div class="catalog-head desktop-only">
          <span>Item</span>
          <span>Category</span>
          <span>Location</span>
          <span>Condition</span>
          <span>Visibility</span>
          <span>Value</span>
        </div>

        <button
          v-for="item in filteredItems"
          :key="item.id"
          class="catalog-row"
          :class="{ active: item.id === selectedItem?.id }"
          type="button"
          @click="emit('select-item', item.id)"
        >
          <div class="catalog-primary">
            <strong>{{ item.title }}</strong>
            <p>{{ item.photoCount }} photos</p>
          </div>
          <span data-label="Category">{{ item.category }}</span>
          <span data-label="Location">{{ item.room }}</span>
          <span data-label="Condition">{{ item.condition }}</span>
          <span data-label="Visibility">
            <span class="status-pill">{{ visibilityLabel(item.visibility) }}</span>
          </span>
          <strong class="money-cell" data-label="Value">${{ item.estimatedLow }} - ${{ item.estimatedHigh }}</strong>
        </button>

        <div v-if="!filteredItems.length" class="catalog-empty">
          No items match the current search and filters.
        </div>
      </div>
    </article>

    <article class="catalog-panel">
      <div class="catalog-topline">
        <div>
          <span class="eyebrow">Selected item</span>
          <h2>{{ selectedItem?.title || 'Choose an item' }}</h2>
        </div>
        <div class="mini-stat">
          <span>Estimated value</span>
          <strong v-if="selectedItem">${{ selectedItem.estimatedLow }} - ${{ selectedItem.estimatedHigh }}</strong>
        </div>
      </div>

      <div v-if="selectedItem" class="detail-stack">
        <div class="detail-grid">
          <label>
            Visibility
            <select :value="selectedItem.visibility" @change="emit('update-item', selectedItem.id, { visibility: $event.target.value })">
              <option value="private">Private</option>
              <option value="offers">Blind offers</option>
              <option value="listed">Listed</option>
            </select>
          </label>
          <label>
            Photo count
            <input :value="selectedItem.photoCount" type="number" min="1" max="20" @change="emit('update-item', selectedItem.id, { photoCount: Number($event.target.value) })" />
          </label>
        </div>
        <div class="valuation-inline">
          <div class="valuation-box">
            <span>Confidence</span>
            <strong>{{ selectedItem.confidence }}%</strong>
            <span :class="['status-pill', 'confidence-pill', confidenceTone(selectedItem.confidence)]">
              {{ confidenceTone(selectedItem.confidence) === 'strong' ? 'Strong signal' : confidenceTone(selectedItem.confidence) === 'medium' ? 'Usable signal' : 'Light signal' }}
            </span>
          </div>
          <div class="valuation-box">
            <span>Range</span>
            <strong>${{ selectedItem.estimatedLow }} - ${{ selectedItem.estimatedHigh }}</strong>
            <span>Based on condition, photos, and matching sold comps</span>
          </div>
        </div>
        <p class="detail-copy">{{ selectedItem.notes }}</p>
        <div class="detail-grid">
          <label>
            Ask
            <input v-model="listingDraft.askingPrice" type="number" min="1" />
          </label>
          <label>
            Radius miles
            <input v-model="listingDraft.radiusMiles" type="number" min="1" />
          </label>
          <label>
            Mode
            <select v-model="listingDraft.mode">
              <option value="sale">Sale</option>
              <option value="trade">Trade</option>
            </select>
          </label>
        </div>
        <button class="button button-primary" type="button" @click="publishSelected">Publish listing</button>
        <div class="comp-section">
          <div class="catalog-topline compact-topline">
            <div>
              <span class="eyebrow">Sold comps</span>
              <h2>Pricing evidence</h2>
            </div>
          </div>

          <div class="catalog-table">
            <div class="catalog-head desktop-only comp-head">
              <span>Source</span>
              <span>Title</span>
              <span>Sold date</span>
              <span>Price</span>
            </div>

            <div v-for="comp in comps" :key="comp.id" class="catalog-row static-row comp-row">
              <span data-label="Source">{{ comp.source }}</span>
              <div class="catalog-primary">
                <strong>{{ comp.title }}</strong>
              </div>
              <span data-label="Sold date">{{ comp.soldAt }}</span>
              <strong class="money-cell" data-label="Price">${{ comp.soldPrice }}</strong>
            </div>

            <div v-if="!comps.length" class="catalog-empty">
              No sold comps are attached to this item yet.
            </div>
          </div>
        </div>
      </div>
    </article>

    <article class="catalog-panel">
      <div class="catalog-topline">
        <div>
          <span class="eyebrow">Quick add</span>
          <h2>Add another item</h2>
        </div>
        <div class="mini-stat">
          <span>Preview</span>
          <strong>${{ preview.low }} - ${{ preview.high }}</strong>
        </div>
      </div>

      <div class="compact-form">
        <input v-model="form.title" type="text" placeholder="Item title" />
        <select v-model="form.category">
          <option v-for="category in categories" :key="category">{{ category }}</option>
        </select>
        <input v-model="form.room" type="text" placeholder="Room or storage area" />
        <select v-model="form.condition">
          <option v-for="condition in conditions" :key="condition">{{ condition }}</option>
        </select>
        <input v-model="form.photoCount" type="number" min="1" max="20" placeholder="Photos" />
        <select v-model="form.visibility">
          <option value="private">Private only</option>
          <option value="offers">Private, accept offers</option>
          <option value="listed">List after save</option>
        </select>
        <textarea v-model="form.notes" rows="4" placeholder="Notes, brand, flaws, measurements" />
      </div>

      <button class="button button-secondary" type="button" :disabled="!form.title || !form.room" @click="submitItem">
        Save item
      </button>
    </article>
  </section>
</template>

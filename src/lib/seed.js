const now = '2026-03-28T15:30:00.000Z'

export const seedState = {
  activeUserId: 'user-homeowner',
  users: [
    { id: 'user-homeowner', name: 'Jordan Ellis', email: 'jordan@example.com', city: 'Chicago, IL', initials: 'JE' },
    { id: 'user-buyer-1', name: 'Avery Stone', email: 'avery@example.com', city: 'Oak Park, IL', initials: 'AS' },
    { id: 'user-buyer-2', name: 'Mina Patel', email: 'mina@example.com', city: 'Evanston, IL', initials: 'MP' },
  ],
  items: [
    {
      id: 'item-1',
      ownerId: 'user-homeowner',
      title: '1960s teak credenza',
      category: 'Furniture',
      room: 'Living room',
      condition: 'Very good',
      photoCount: 4,
      notes: 'Original pulls, one light water ring on the top surface.',
      visibility: 'listed',
      estimatedLow: 780,
      estimatedHigh: 1050,
      confidence: 84,
      createdAt: now,
    },
    {
      id: 'item-2',
      ownerId: 'user-homeowner',
      title: 'KitchenAid Artisan mixer',
      category: 'Appliances',
      room: 'Kitchen',
      condition: 'Excellent',
      photoCount: 5,
      notes: 'Includes whisk, paddle, dough hook, and pouring shield.',
      visibility: 'offers',
      estimatedLow: 180,
      estimatedHigh: 240,
      confidence: 79,
      createdAt: now,
    },
    {
      id: 'item-3',
      ownerId: 'user-homeowner',
      title: 'Vintage leather jacket',
      category: 'Clothing',
      room: 'Hall closet',
      condition: 'Good',
      photoCount: 6,
      notes: "Brown leather, men's medium, minor sleeve wear.",
      visibility: 'private',
      estimatedLow: 109,
      estimatedHigh: 149,
      confidence: 68,
      createdAt: now,
    },
    {
      id: 'item-4',
      ownerId: 'user-buyer-1',
      title: 'Herman Miller Eames lounge chair',
      category: 'Furniture',
      room: 'Private inventory',
      condition: 'Good',
      photoCount: 6,
      notes: 'Not publicly listed. Owner is open to private offers.',
      visibility: 'offers',
      estimatedLow: 3100,
      estimatedHigh: 4200,
      confidence: 83,
      createdAt: now,
    },
    {
      id: 'item-5',
      ownerId: 'user-buyer-2',
      title: 'Nintendo Switch OLED bundle',
      category: 'Electronics',
      room: 'Listed inventory',
      condition: 'Excellent',
      photoCount: 5,
      notes: 'Dock, case, controller grip, Zelda cartridge.',
      visibility: 'listed',
      estimatedLow: 260,
      estimatedHigh: 340,
      confidence: 81,
      createdAt: now,
    },
  ],
  listings: [
    { id: 'listing-1', itemId: 'item-1', ownerId: 'user-homeowner', title: '1960s teak credenza', askingPrice: 920, mode: 'sale', radiusMiles: 15, status: 'active', publishedAt: now },
    { id: 'listing-2', itemId: 'item-5', ownerId: 'user-buyer-2', title: 'Nintendo Switch OLED bundle', askingPrice: 315, mode: 'sale', radiusMiles: 12, status: 'active', publishedAt: now },
  ],
  offers: [
    { id: 'offer-1', kind: 'listing', listingId: 'listing-1', itemId: 'item-1', buyerId: 'user-buyer-1', buyerName: 'Avery Stone', amount: 860, note: 'Can pick up Saturday afternoon.', status: 'pending', createdAt: now },
    { id: 'offer-2', kind: 'private-item', listingId: null, itemId: 'item-2', buyerId: 'user-buyer-2', buyerName: 'Mina Patel', amount: 200, note: 'Interested if all attachments are included.', status: 'pending', createdAt: now },
  ],
  comps: [
    { id: 'comp-1', itemId: 'item-1', source: 'eBay sold', title: 'Danish teak sideboard, 72 inch', soldPrice: 995, soldAt: '2026-03-11' },
    { id: 'comp-2', itemId: 'item-1', source: 'Local sale', title: 'Mid-century credenza, pickup only', soldPrice: 875, soldAt: '2026-03-18' },
    { id: 'comp-3', itemId: 'item-2', source: 'eBay sold', title: 'KitchenAid Artisan 5qt stand mixer', soldPrice: 224, soldAt: '2026-03-20' },
    { id: 'comp-4', itemId: 'item-3', source: 'eBay sold', title: 'Vintage brown leather biker jacket', soldPrice: 138, soldAt: '2026-03-05' },
  ],
}

export const categories = ['Clothing', 'Collectibles', 'Appliances', 'Furniture', 'Electronics', 'Tools']
export const conditions = ['Fair', 'Good', 'Very good', 'Excellent']

export function createId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

export function estimateValue(category, condition, photoCount) {
  const baseByCategory = {
    Clothing: [85, 140],
    Collectibles: [220, 360],
    Appliances: [90, 180],
    Furniture: [260, 420],
    Electronics: [110, 240],
    Tools: [70, 160],
  }
  const conditionMultiplier = { Fair: 0.7, Good: 1, 'Very good': 1.18, Excellent: 1.34 }
  const [low, high] = baseByCategory[category] || [50, 100]
  const multiplier = conditionMultiplier[condition] || 1
  const photoBoost = Math.min(Number(photoCount) || 0, 8) * 4

  return {
    low: Math.round(low * multiplier + photoBoost),
    high: Math.round(high * multiplier + photoBoost * 1.5),
    confidence: Math.min(92, 52 + photoBoost * 2 + Math.round(multiplier * 10)),
  }
}

# 3NF database design for What's It Worth

This version of the schema is designed around third normal form:

- each table models one business concept
- non-key columns depend on the key, the whole key, and nothing but the key
- repeating state vocabularies are moved into lookup tables
- mutable marketplace content is separated from operational records
- activity history is append-only instead of being buried inside current-state rows

## Design goals

The app is really four systems sharing one database:

1. account and identity
2. inventory and valuation
3. marketplace workflow
4. social sharing and activity history

If those concerns stay mixed together, the schema becomes hard to extend. The current design separates them so you can add features without repeatedly rewriting the core tables.

## Bounded areas

### 1. Account and identity

Core tables:

- `UserAccount`
- `UserProfile`
- `UserNotificationPreference`
- `AuthProvider`
- `AuthIdentity`
- `UserAddress`

Why this is in 3NF:

- login identity is not mixed with public profile fields
- addresses are one-to-many instead of repeated user columns
- notification preferences are one row per user instead of being scattered into unrelated tables
- external auth providers are normalized through `AuthProvider`

Important relationships:

- one `UserAccount` has one `UserProfile`
- one `UserAccount` can have many `AuthIdentity` rows
- one `UserAccount` can have many `UserAddress` rows

### 2. Inventory and valuation

Core tables:

- `Category`
- `ItemConditionType`
- `ItemVisibilityType`
- `InventoryLocation`
- `Item`
- `ItemPhoto`
- `ValuationRun`
- `ValuationSourceType`
- `ComparableSale`

Why this is in 3NF:

- category, condition, and visibility are not embedded as uncontrolled strings
- owner-specific storage locations are normalized into `InventoryLocation`
- comparable sales are not repeated inside the item row
- valuation history is stored separately from the item master record

Important relationships:

- one `UserAccount` owns many `Item`
- one `Item` belongs to one `Category`
- one `Item` belongs to one `ItemConditionType`
- one `Item` belongs to one `ItemVisibilityType`
- one `Item` can have many `ItemPhoto`
- one `Item` can have many `ValuationRun`
- one `ValuationRun` can have many `ComparableSale`

### 3. Marketplace workflow

Core tables:

- `ListingModeType`
- `ListingStatusType`
- `Listing`
- `ListingRevision`
- `OfferKindType`
- `OfferStatusType`
- `Offer`
- `OfferStatusHistory`
- `Conversation`
- `ConversationParticipant`
- `MessageType`
- `Message`
- `TransactionStatusType`
- `FulfillmentMethodType`
- `Transaction`
- `FulfillmentAppointment`
- `TransactionStatusHistory`

Why this is in 3NF:

- a listing’s operational state is separated from its editable content
- current listing content lives in `ListingRevision`, not duplicated across history rows
- offer lifecycle state is normalized through `OfferStatusType`
- offer status changes are tracked in `OfferStatusHistory`
- accepted offers become transactions instead of overloading the offer row forever
- participants are normalized through a join table instead of fixed buyer/seller chat columns

Important relationships:

- one `Item` can have many `Listing`
- one `Listing` can have many `ListingRevision`
- one `Listing` points to its current revision through `currentRevisionId`
- one `Listing` can have many `Offer`
- one `Offer` belongs to one buyer and one seller
- one `Offer` can have many status changes
- one `Offer` can create at most one `Transaction`
- one `Conversation` can attach to an item, listing, or offer
- one `Conversation` has many participants and many messages

### 4. Social and activity history

Core tables:

- `SocialPlatform`
- `ShareChannelType`
- `SocialAccountConnection`
- `ShareLink`
- `SocialPost`
- `MarketplaceEventType`
- `MarketplaceEvent`

Why this is in 3NF:

- external social accounts are separate from application users
- share channels are normalized instead of hard-coded in the listing table
- social posts are distinct from share links because one share action can lead to multiple platform posts
- marketplace activity is stored as append-only events rather than scattered status columns and timestamps

Important relationships:

- one `UserAccount` can connect many social accounts
- one `Listing` can generate many `ShareLink`
- one `ShareLink` can generate many `SocialPost`
- one `MarketplaceEvent` can point at the item, listing, offer, transaction, conversation, or message it concerns

## Why this version is more future-proof

It does not eliminate migrations. No serious product can do that. What it does do is reduce the frequency of structural rewrites.

Examples:

- if you add a new offer status, you insert a row into `OfferStatusType` instead of changing the table shape
- if you add a new listing mode, you insert a row into `ListingModeType`
- if you add another auth provider, you insert a row into `AuthProvider`
- if you relist the same item multiple times, `Listing` already supports it
- if you want price history, `ListingRevision` already stores revisions
- if you want a complete audit trail, `MarketplaceEvent` already exists
- if you want messaging, transaction handling, pickup scheduling, and social distribution, those entities already have their own tables

## Why revisions matter

This is one of the most important structural decisions.

`Listing` is the marketplace record and lifecycle container:

- seller
- item
- current status
- publish and close timestamps
- current revision pointer

`ListingRevision` is the editable listing content:

- title
- description
- asking price
- mode
- who changed it
- revision number

That separation prevents the common anti-pattern where one listing row grows endless nullable history columns or loses historical pricing context.

## Why event tables matter

You said you want to log marketplace exchanges and marketplace activity.

There are two levels of history in this design:

- focused history tables for domain-specific workflows
  - `OfferStatusHistory`
  - `TransactionStatusHistory`
  - `ListingRevision`
- broad event logging for the overall marketplace
  - `MarketplaceEvent`

This gives you both:

- exact lifecycle history for critical records
- a unified activity feed and audit stream

## Normalized lookup tables

Lookup tables exist for stable vocabularies that are likely to grow:

- `ItemConditionType`
- `ItemVisibilityType`
- `ListingModeType`
- `ListingStatusType`
- `OfferKindType`
- `OfferStatusType`
- `MessageType`
- `TransactionStatusType`
- `FulfillmentMethodType`
- `ValuationSourceType`
- `SocialPlatform`
- `ShareChannelType`
- `MarketplaceEventType`

That is more verbose than enums, but it means many product changes become data changes instead of schema changes.

## Main joins by feature

### Inventory screen

- `Item join Category`
- `Item join ItemConditionType`
- `Item join ItemVisibilityType`
- `Item left join InventoryLocation`
- `Item left join ItemPhoto`
- `Item left join ValuationRun left join ComparableSale`

### Marketplace feed

- `Listing join ListingStatusType`
- `Listing join ListingRevision`
- `Listing join Item`
- `Listing join UserAccount`

### Blind offers

- `Item join ItemVisibilityType`
- `Item join UserAccount`
- `Offer join OfferStatusType`

### Inbox

- incoming offers: `Offer join Item left join Listing` where `sellerUserId = currentUserId`
- outgoing offers: `Offer join Item left join Listing` where `buyerUserId = currentUserId`
- offer history: `Offer join OfferStatusHistory`

### Messaging

- `Conversation join ConversationParticipant`
- `Conversation join Message`
- optional join to `Item`, `Listing`, or `Offer`

### Transactions

- `Transaction join Offer`
- `Transaction join TransactionStatusType`
- `Transaction left join FulfillmentAppointment`
- `Transaction left join UserAddress`

### Social sharing

- `ShareLink join ShareChannelType`
- `SocialPost join SocialPlatform`
- `SocialAccountConnection join SocialPlatform`

## Tradeoffs

This schema is intentionally more structured than a startup MVP schema.

Benefits:

- cleaner dependencies
- better auditability
- easier reporting
- less future pressure to split overloaded tables
- more product changes can be handled as data changes

Costs:

- more joins
- more seed data for lookup tables
- more application logic when creating listings, offers, and transactions

That tradeoff is usually worth it once you know the app is a real marketplace and not just a toy inventory tracker.

## Recommended next steps

1. Seed all lookup tables first.
2. Decide whether `primaryEmail` is app-managed or delegated to your auth provider.
3. Add a first migration and a seed script for statuses, modes, message types, share channels, and social platforms.
4. Define service-layer rules:
   - create listing
   - revise listing
   - create offer
   - accept or decline offer
   - convert accepted offer into transaction
   - create conversation from listing or offer
   - create share link and social post log
5. Add read models for the UI, because the UI will want denormalized query results even though the write model stays normalized.

## One important caveat

Third normal form is the right foundation for writes and core truth.

For the app itself, you will still likely want read-optimized queries, views, or API response mappers so the frontend does not manually reconstruct marketplace cards from ten joins every time.

# Etsy MCP Server — Design Specification

## Overview

A Model Context Protocol (MCP) server that exposes the full Etsy Open API v3 (~70 endpoints) as ~35 MCP tools. Supports both buyer and seller workflows. Built in TypeScript with types generated from Etsy's official OpenAPI spec.

## Constraints

- **API**: Etsy Open API v3 only (no undocumented/private endpoints)
- **Auth**: OAuth 2.0 with PKCE via local browser flow; tokens persisted to disk
- **Rate limit**: Etsy enforces 10 requests/second — client must respect this
- **API key format**: `keystring:shared_secret` (required since Jan 2026)
- **Token lifetime**: Access token 1 hour, refresh token 90 days

## Architecture

```
etsy-mcp/
├── src/
│   ├── index.ts              # MCP server entry + tool registration
│   ├── auth/
│   │   ├── oauth.ts          # OAuth 2.0 + PKCE (local browser redirect)
│   │   └── token-store.ts    # Persist/load tokens from ~/.etsy-mcp/tokens.json
│   ├── client/
│   │   ├── etsy-client.ts    # HTTP client: auth headers, rate limiting, retries
│   │   └── types.ts          # Generated from Etsy OAS 3.0.0 spec
│   ├── tools/                # MCP tools grouped by domain
│   │   ├── listings.ts       # search_listings, get_listing, create_draft_listing, update_listing, delete_listing, get_listings_by_shop
│   │   ├── shop.ts           # get_shop, update_shop, find_shops, get_shop_sections, manage_shop_sections
│   │   ├── orders.ts         # get_shop_receipts, get_receipt, update_receipt, create_shipment
│   │   ├── transactions.ts   # get_transactions_by_shop, get_transaction, get_transactions_by_receipt
│   │   ├── shipping.ts       # get_shipping_profiles, create_shipping_profile, update_shipping_profile, manage_shipping_destinations, get_shipping_carriers
│   │   ├── reviews.ts        # get_reviews_by_listing, get_reviews_by_shop
│   │   ├── users.ts          # get_me, get_user, get_user_addresses
│   │   ├── taxonomy.ts       # get_buyer_taxonomy, get_taxonomy_properties
│   │   ├── images.ts         # get_listing_images, upload_listing_image, delete_listing_image, upload_listing_video
│   │   ├── inventory.ts      # get_listing_inventory, update_listing_inventory
│   │   ├── payments.ts       # get_payments, get_ledger_entries
│   │   └── return-policies.ts # get_return_policies, manage_return_policy
│   └── utils/
│       ├── pagination.ts     # Cursor/offset pagination helpers
│       └── errors.ts         # Etsy error → MCP error mapping
├── tests/
│   ├── unit/                 # Mock HTTP, test each tool module
│   ├── integration/          # Test against Etsy ping endpoint
│   └── auth/                 # OAuth flow tests
├── scripts/
│   └── generate-types.ts     # Download OAS spec → generate types.ts
├── package.json
├── tsconfig.json
└── .env.example              # ETSY_API_KEY, ETSY_SHARED_SECRET
```

## Authentication Flow

1. User configures `ETSY_API_KEY` and `ETSY_SHARED_SECRET` in env
2. On first authenticated request, server checks for stored tokens in `~/.etsy-mcp/tokens.json`
3. If no valid tokens: starts local HTTP server on a random port, opens browser to Etsy OAuth consent URL with PKCE challenge, captures callback code, exchanges for tokens, stores them
4. If stored tokens exist but access token expired: use refresh token to get new access token
5. If refresh token expired (>90 days): re-trigger browser OAuth flow
6. All authenticated requests include `x-api-key` header with `keystring:shared_secret`

## MCP Tools — Complete Inventory

### Listings (8 tools)

- **search_listings**: `GET /v3/application/listings/active` — Search with keywords, taxonomy_id, price range, sort, limit/offset
- **get_listing**: `GET /v3/application/listings/{listing_id}` — Full listing details with optional includes
- **create_draft_listing**: `POST /v3/application/shops/{shop_id}/listings` — Create listing with title, description, price, taxonomy, etc.
- **update_listing**: `PATCH /v3/application/listings/{listing_id}` — Update any listing fields
- **delete_listing**: `DELETE /v3/application/listings/{listing_id}` — Remove a listing
- **get_listings_by_shop**: `GET /v3/application/shops/{shop_id}/listings` — All listings for a shop (filterable by state)
- **get_listing_images**: `GET /v3/application/listings/{listing_id}/images` — Get all images
- **upload_listing_image**: `POST /v3/application/shops/{shop_id}/listings/{listing_id}/images` — Upload image file

### Shop (5 tools)

- **get_shop**: `GET /v3/application/shops/{shop_id}` — Shop details
- **update_shop**: `PUT /v3/application/shops/{shop_id}` — Update shop settings
- **find_shops**: `GET /v3/application/shops` — Search shops by name
- **get_shop_sections**: `GET /v3/application/shops/{shop_id}/sections` — List sections
- **manage_shop_sections**: CRUD on `shops/{shop_id}/sections` — Create, update, delete sections

### Orders & Receipts (4 tools)

- **get_shop_receipts**: `GET /v3/application/shops/{shop_id}/receipts` — List orders with date/status filters
- **get_receipt**: `GET /v3/application/shops/{shop_id}/receipts/{receipt_id}` — Single receipt
- **update_receipt**: `PUT /v3/application/shops/{shop_id}/receipts/{receipt_id}` — Update receipt
- **create_shipment**: `POST /v3/application/shops/{shop_id}/receipts/{receipt_id}/tracking` — Add tracking

### Transactions (3 tools)

- **get_transactions_by_shop**: `GET /v3/application/shops/{shop_id}/transactions` — All shop transactions
- **get_transaction**: `GET /v3/application/shops/{shop_id}/transactions/{transaction_id}` — Single transaction
- **get_transactions_by_receipt**: `GET /v3/application/shops/{shop_id}/receipts/{receipt_id}/transactions` — Transactions for a receipt

### Shipping (5 tools)

- **get_shipping_profiles**: `GET /v3/application/shops/{shop_id}/shipping-profiles` — List profiles
- **create_shipping_profile**: `POST /v3/application/shops/{shop_id}/shipping-profiles` — Create profile
- **update_shipping_profile**: `PUT /v3/application/shops/{shop_id}/shipping-profiles/{shipping_profile_id}` — Update
- **manage_shipping_destinations**: CRUD on shipping profile destinations/upgrades
- **get_shipping_carriers**: `GET /v3/application/shipping-carriers` — List carriers by origin country

### Reviews (2 tools)

- **get_reviews_by_listing**: `GET /v3/application/listings/{listing_id}/reviews` — Paginated reviews
- **get_reviews_by_shop**: `GET /v3/application/shops/{shop_id}/reviews` — Paginated reviews

### Users & Addresses (3 tools)

- **get_me**: `GET /v3/application/users/me` — Current authenticated user
- **get_user**: `GET /v3/application/users/{user_id}` — User by ID
- **get_user_addresses**: `GET /v3/application/users/{user_id}/addresses` — Shipping addresses

### Taxonomy (2 tools)

- **get_buyer_taxonomy**: `GET /v3/application/buyer-taxonomy/nodes` — Full taxonomy tree
- **get_taxonomy_properties**: `GET /v3/application/buyer-taxonomy/nodes/{taxonomy_id}/properties` — Properties for category

### Inventory (2 tools)

- **get_listing_inventory**: `GET /v3/application/listings/{listing_id}/inventory` — Inventory/variations
- **update_listing_inventory**: `PUT /v3/application/listings/{listing_id}/inventory` — Update inventory

### Payments & Ledger (2 tools)

- **get_payments**: `GET /v3/application/shops/{shop_id}/payments` or by receipt — Read-only payment data
- **get_ledger_entries**: `GET /v3/application/shops/{shop_id}/payment-account/ledger-entries` — Ledger entries

### Return Policies (2 tools)

- **get_return_policies**: `GET /v3/application/shops/{shop_id}/policies/return` — List return policies
- **manage_return_policy**: CRUD on return policies

## HTTP Client Design

- Base URL: `https://openapi.etsy.com/v3/application`
- Auth: Inject `Authorization: Bearer {access_token}` and `x-api-key: {keystring:shared_secret}`
- Rate limiting: Token bucket at 10 req/sec; queue excess requests
- Retries: Exponential backoff on 429 and 5xx (max 3 retries)
- Token refresh: Intercept 401 → refresh token → retry original request

## Error Handling

| Etsy Status | MCP Behavior |
|-------------|-------------|
| 401 | Auto-refresh token, retry once. If still 401, return auth error. |
| 403 | Return permission error with missing scope info |
| 404 | Return "not found" with entity details |
| 429 | Wait per Retry-After header, retry |
| 400 | Return validation error with field details |
| 5xx | Retry with backoff, then return server error |

## Testing Strategy

### Unit Tests
- Each tool module tested with mocked HTTP responses
- Auth flow tested with mocked browser/callback
- Token store tested with temp files
- Rate limiter tested with timing assertions
- Error handling tested for each error code path

### Integration Tests
- Ping endpoint (`GET /v3/application/openapi-ping`) to verify connectivity
- Token scope validation endpoint

### Test Framework
- vitest for unit and integration tests
- msw (Mock Service Worker) for HTTP mocking

## Dependencies

- `@modelcontextprotocol/sdk` — MCP server framework
- `openapi-typescript` — Generate types from OAS spec (dev dependency)
- `open` — Open browser for OAuth
- `vitest` — Testing
- `msw` — HTTP mocking for tests
- `zod` — Input validation for tool parameters

## Configuration

Environment variables (`.env`):
```
ETSY_API_KEY=your_keystring
ETSY_SHARED_SECRET=your_shared_secret
ETSY_REDIRECT_URI=http://localhost:3000/callback  # optional, defaults to random port
```

## Out of Scope

- Messaging/conversations (no API endpoint)
- Cart management (no v3 endpoint)
- Favorites management (no v3 endpoint)
- Checkout/purchase flow (no API)
- Push notifications (no API)
- Etsy Ads management (no public API)

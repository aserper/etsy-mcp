# Etsy MCP Server

[![Tests](https://img.shields.io/github/actions/workflow/status/aserper/etsy-mcp/test.yml?style=for-the-badge&label=tests)](https://github.com/aserper/etsy-mcp/actions/workflows/test.yml)
[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen?style=for-the-badge)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/ghcr.io-aserper%2Fetsy--mcp-blue?style=for-the-badge)](https://ghcr.io/aserper/etsy-mcp)

![GitHub stars](https://img.shields.io/github/stars/aserper/etsy-mcp?style=social)
![GitHub forks](https://img.shields.io/github/forks/aserper/etsy-mcp?style=social)

A Model Context Protocol (MCP) server that provides full access to the Etsy Open API v3. Supports both buyer browsing and seller shop management with **37 tools** covering listings, orders, shipping, reviews, inventory, payments, and more.

## Features

- **Full Etsy API v3 coverage** — 37 MCP tools wrapping ~70 API endpoints
- **OAuth 2.0 + PKCE** — Secure browser-based authentication with automatic token refresh
- **Both buyer and seller workflows** — Search listings, manage shops, process orders, handle shipping
- **Rate limiting** — Concurrency-safe 10 req/sec limiter to respect Etsy's limits
- **Auto-retry** — Exponential backoff on 429/5xx errors, automatic token refresh on 401
- **TypeScript** — Full type safety with types generated from Etsy's official OpenAPI spec

| Category | Tools |
|----------|-------|
| **Listings** | `search_listings`, `get_listing`, `create_draft_listing`, `update_listing`, `delete_listing`, `get_listings_by_shop` |
| **Shop** | `get_shop`, `update_shop`, `find_shops`, `get_shop_sections`, `manage_shop_sections` |
| **Orders** | `get_shop_receipts`, `get_receipt`, `update_receipt`, `create_shipment` |
| **Transactions** | `get_transactions_by_shop`, `get_transaction`, `get_transactions_by_receipt` |
| **Shipping** | `get_shipping_profiles`, `create_shipping_profile`, `update_shipping_profile`, `manage_shipping_destinations`, `get_shipping_carriers` |
| **Reviews** | `get_reviews_by_listing`, `get_reviews_by_shop` |
| **Users** | `get_me`, `get_user`, `get_user_addresses` |
| **Taxonomy** | `get_buyer_taxonomy`, `get_taxonomy_properties` |
| **Images/Video** | `get_listing_images`, `upload_listing_image`, `upload_listing_video`, `delete_listing_image` |
| **Inventory** | `get_listing_inventory`, `update_listing_inventory` |
| **Payments** | `get_payments`, `get_ledger_entries` |
| **Return Policies** | `get_return_policies`, `manage_return_policy` |
| **Auth** | `authenticate` |

## Installation

### From source

```bash
git clone https://github.com/aserper/etsy-mcp.git
cd etsy-mcp
npm install
npm run build
```

### Docker

```bash
docker pull ghcr.io/aserper/etsy-mcp:latest
```

## Configuration

Register at [Etsy Developers](https://developers.etsy.com/) to get your API credentials.

| Variable | Required | Description |
|----------|----------|-------------|
| `ETSY_API_KEY` | Yes | Your Etsy API keystring |
| `ETSY_SHARED_SECRET` | Yes | Your Etsy shared secret |

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

## Usage

### Claude Desktop Configuration

```json
{
  "mcpServers": {
    "etsy": {
      "command": "node",
      "args": ["/path/to/etsy-mcp/dist/index.js"],
      "env": {
        "ETSY_API_KEY": "your_keystring",
        "ETSY_SHARED_SECRET": "your_shared_secret"
      }
    }
  }
}
```

### Docker

```bash
docker run --rm \
  -e ETSY_API_KEY=your_keystring \
  -e ETSY_SHARED_SECRET=your_shared_secret \
  ghcr.io/aserper/etsy-mcp:latest
```

## Authentication

On first use, call the `authenticate` tool. This opens your browser to Etsy's OAuth consent page using PKCE. After granting access, tokens are stored at `~/.etsy-mcp/tokens.json` (owner-only permissions) and auto-refreshed when they expire.

## Development

```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript
npm test             # Run tests
npm run dev          # Watch mode
npm run lint         # Type check
npm run generate-types  # Regenerate types from Etsy OAS spec
```

## API Coverage

This server covers the full Etsy Open API v3 (~70 endpoints). Features not available via the public API (messaging, cart, favorites, checkout) are out of scope.

## License

MIT

## Contributing

Contributions welcome! Feel free to open an issue or submit a PR.

## Disclaimer

This project is not affiliated with, endorsed by, or associated with Etsy, Inc. It uses Etsy's publicly available Open API v3. Use responsibly and in accordance with [Etsy's API Terms of Use](https://www.etsy.com/legal/api).

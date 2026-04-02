# Etsy MCP Server

An MCP (Model Context Protocol) server that provides full access to the Etsy Open API v3. Supports both buyer browsing and seller shop management.

## Setup

1. **Get Etsy API credentials**: Register at [Etsy Developers](https://developers.etsy.com/) and create an app to get your API key and shared secret.

2. **Install**:
   ```bash
   npm install
   npm run build
   ```

3. **Configure**: Copy `.env.example` to `.env` and fill in your credentials:
   ```
   ETSY_API_KEY=your_keystring
   ETSY_SHARED_SECRET=your_shared_secret
   ```

4. **Run**:
   ```bash
   node dist/index.js
   ```

## MCP Client Configuration

Add to your Claude Code `settings.json` or MCP client config:

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

## Available Tools (36)

### Authentication
- `authenticate` — Trigger OAuth 2.0 browser flow

### Listings (6)
- `search_listings` — Search active listings with keywords/filters
- `get_listing` — Get listing details
- `create_draft_listing` — Create a new draft listing
- `update_listing` — Update a listing
- `delete_listing` — Delete a listing
- `get_listings_by_shop` — List all listings in a shop

### Shop (5)
- `get_shop` / `find_shops` / `update_shop`
- `get_shop_sections` / `manage_shop_sections`

### Orders (4)
- `get_shop_receipts` / `get_receipt` / `update_receipt` / `create_shipment`

### Transactions (3)
- `get_transactions_by_shop` / `get_transaction` / `get_transactions_by_receipt`

### Shipping (5)
- `get_shipping_profiles` / `create_shipping_profile` / `update_shipping_profile`
- `manage_shipping_destinations` / `get_shipping_carriers`

### Reviews (2)
- `get_reviews_by_listing` / `get_reviews_by_shop`

### Users (3)
- `get_me` / `get_user` / `get_user_addresses`

### Taxonomy (2)
- `get_buyer_taxonomy` / `get_taxonomy_properties`

### Images (3)
- `get_listing_images` / `upload_listing_image` / `delete_listing_image`

### Inventory (2)
- `get_listing_inventory` / `update_listing_inventory`

### Payments (2)
- `get_payments` / `get_ledger_entries`

### Return Policies (2)
- `get_return_policies` / `manage_return_policy`

## Testing

```bash
npm test
```

## Authentication

On first use, call the `authenticate` tool. This opens your browser to Etsy's OAuth consent page. After granting access, tokens are stored at `~/.etsy-mcp/tokens.json` and auto-refreshed.

## API Coverage

This server covers the full Etsy Open API v3 (~70 endpoints). Features not available via the public API (messaging, cart, favorites, checkout) are out of scope.

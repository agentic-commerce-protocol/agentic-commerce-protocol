# Unreleased

## Added

- **Product Feed Specification**: Added comprehensive product feed spec that defines how merchants share structured product data with OpenAI for ChatGPT search and shopping experiences
  - Added RFC document: `rfcs/rfc.product_feed.md`
  - Added JSON Schema: `spec/json-schema/schema.product_feed.json`
  - Added example feed: `examples/examples.product_feed.json`
  - Includes complete field reference with required/optional attributes for:
    - OpenAI control flags (enable_search, enable_checkout)
    - Basic product data (ID, title, description, links)
    - Item information (category, brand, materials, dimensions)
    - Media (images, videos, 3D models)
    - Pricing (regular and sale pricing)
    - Inventory (availability, quantity)
    - Variants (size, color, custom attributes)
    - Fulfillment (shipping, delivery estimates)
    - Merchant info (seller details, policies)
    - Returns (policies, windows)
    - Performance signals (popularity, return rates)
    - Compliance (warnings, age restrictions)
    - Reviews and Q&A
    - Related products
    - Geo-specific pricing and availability
  - Fixed schema validation:
    - Corrected `enable_search` and `enable_checkout` to string enums ("true", "false")
    - Added alphanumeric patterns for `id` and `mpn` fields
    - Fixed `additional_image_link` to support comma-separated URLs
    - Added pattern validation for `shipping` with comma-separated entries
    - Added pattern validation for `geo_price` with region indicators
    - Added `model_3d_link` field for AR/VR 3D models


# RFC: Product Feed Specification

## Overview

The Product Feed Specification defines how merchants share structured product data with OpenAI so ChatGPT can accurately surface their products in search and shopping experiences.

## How it works

1. **Prepare your feed**: Format your catalog using the Product Feed Spec (see Field reference for required and optional attributes with sample values).
2. **Deliver the feed**: Share the feed using the preferred delivery method and file format described in the integration section.
3. **Ingestion and indexing**: OpenAI ingests the feed, validates records, and indexes product metadata for retrieval and ranking in ChatGPT.
4. **Keep it fresh**: Update the feed whenever products, pricing, or availability change to ensure users see accurate information.

## Key Points

- **Structured source of truth**: OpenAI relies on merchant-provided feeds—this ensures accurate pricing, availability, and other key details.
- **Built for discovery**: The feed powers product matching, indexing, and ranking in ChatGPT.
- **Integration guidance**: The spec defines the preferred delivery method and file format for reliable ingestion.
- **Field reference**: A complete list of required and optional attributes (with examples) is provided to help you validate your feed.
- **Freshness matters**: Frequent updates improve match quality and reduce out-of-stock or price-mismatch scenarios.

## Integration Overview

Before providing product data, merchants must sign up at chatgpt.com/merchants.

All transfers occur over encrypted HTTPS to the allow-listed endpoint to protect merchant and customer information and ensure that only approved partners can send or update product feeds.

| Topic             | Details                                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------- |
| Delivery model    | Merchants push feeds to OpenAI at a mutually agreed endpoint or secure transfer location.               |
| File format       | Supported formats are TSV, CSV, XML, or JSON. Choose whichever fits your existing export process.       |
| Refresh Frequency | Our system accepts updates every 15 minutes.                                                            |
| Initial load      | Send a sample or full initial feed so our indexing team can validate parsing before live updates begin. |

## Field Reference

### OpenAI Flags

Use these flags to control whether a product is discoverable and/or purchasable inside ChatGPT.

| Attribute       | Data Type | Supported Values | Description                                                                                                                   | Example | Requirement | Dependencies | Validation Rules  |
| --------------- | --------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------- | ----------- | ------------ | ----------------- |
| enable_search   | Enum      | true, false      | Controls whether the product can be surfaced in ChatGPT search results.                                                       | true    | Required    | —            | Lower-case string |
| enable_checkout | Enum      | true, false      | Allows direct purchase inside ChatGPT. enable_search must be true in order for enable_checkout to be enabled for the product. | true    | Required    | —            | Lower-case string |

### Basic Product Data

Provide the core identifiers and descriptive text needed to uniquely reference each product.

| Attribute   | Data Type             | Supported Values | Description                  | Example                                    | Requirement              | Dependencies               | Validation Rules                            |
| ----------- | --------------------- | ---------------- | ---------------------------- | ------------------------------------------ | ------------------------ | -------------------------- | ------------------------------------------- |
| id          | String (alphanumeric) | —                | Merchant product ID (unique) | SKU12345                                   | Required                 | —                          | Max 100 chars; must remain stable over time |
| gtin        | String (numeric)      | GTIN, UPC, ISBN  | Universal product identifier | 123456789543                               | Recommended              | —                          | 8–14 digits; no dashes or spaces            |
| mpn         | String (alphanumeric) | —                | Manufacturer part number     | GPT5                                       | Required if gtin missing | Required if gtin is absent | Max 70 chars                                |
| title       | String (UTF-8 text)   | —                | Product title                | Men's Trail Running Shoes Black            | Required                 | —                          | Max 150 chars; avoid all-caps               |
| description | String (UTF-8 text)   | —                | Full product description     | Waterproof trail shoe with cushioned sole… | Required                 | —                          | Max 5,000 chars; plain text only            |
| link        | URL                   | RFC 1738         | Product detail page URL      | https://example.com/product/SKU12345       | Required                 | —                          | Must resolve with HTTP 200; HTTPS preferred |

### Item Information

Capture the physical characteristics and classification details of the product.

| Attribute        | Data Type     | Supported Values       | Description          | Example                       | Requirement                                                            | Dependencies                                 | Validation Rules           |
| ---------------- | ------------- | ---------------------- | -------------------- | ----------------------------- | ---------------------------------------------------------------------- | -------------------------------------------- | -------------------------- |
| condition        | Enum          | new, refurbished, used | Condition of product | new                           | Required if product condition differs from new                         | —                                            | Lower-case string          |
| product_category | String        | Category taxonomy      | Category path        | Apparel & Accessories > Shoes | Required                                                               | —                                            | Use ">" separator          |
| brand            | String        | —                      | Product brand        | OpenAI                        | Required for all excluding movies, books, and musical recording brands | —                                            | Max 70 chars               |
| material         | String        | —                      | Primary material(s)  | Leather                       | Required                                                               | —                                            | Max 100 chars              |
| dimensions       | String        | LxWxH unit             | Overall dimensions   | 12x8x5 in                     | Optional                                                               | —                                            | Units required if provided |
| length           | Number + unit | —                      | Individual dimension | 10 mm                         | Optional                                                               | Provide all three if using individual fields | Units required             |
| width            | Number + unit | —                      | Individual dimension | 10 mm                         | Optional                                                               | Provide all three if using individual fields | Units required             |
| height           | Number + unit | —                      | Individual dimension | 10 mm                         | Optional                                                               | Provide all three if using individual fields | Units required             |
| weight           | Number + unit | —                      | Product weight       | 1.5 lb                        | Optional                                                               | —                                            | Units required             |
| expiration_date  | Date          | ISO 8601               | Product expiration   | 2026-12-31                    | Optional                                                               | —                                            | Future date                |

### Media

Provide high-quality images and optional video content to help users evaluate the product visually.

| Attribute             | Data Type | Supported Values | Description               | Example                                 | Requirement | Dependencies | Validation Rules                                              |
| --------------------- | --------- | ---------------- | ------------------------- | --------------------------------------- | ----------- | ------------ | ------------------------------------------------------------- |
| image_link            | URL       | RFC 1738         | Primary product image     | https://example.com/images/SKU12345.jpg | Required    | —            | Must resolve HTTP 200; min 800x800px                          |
| additional_image_link | URL/Array | RFC 1738         | Additional product images | https://example.com/images/alt1.jpg     | Recommended | —            | String (comma-separated) or array of URLs; same specs as main |
| video_link            | URL       | RFC 1738         | Product video             | https://example.com/videos/SKU12345.mp4 | Recommended | —            | Must resolve HTTP 200                                         |
| model_3d_link         | URL       | RFC 1738         | 3D model for AR/VR        | https://example.com/models/SKU12345.glb | Optional    | —            | Must resolve HTTP 200                                         |

### Pricing

Provide accurate price information including any sales or promotional pricing.

| Attribute                 | Data Type         | Supported Values               | Description                      | Example               | Requirement | Dependencies         | Validation Rules                                                     |
| ------------------------- | ----------------- | ------------------------------ | -------------------------------- | --------------------- | ----------- | -------------------- | -------------------------------------------------------------------- |
| price                     | Number + currency | ISO 4217                       | Regular price                    | 99.99 USD             | Required    | —                    | Must include ISO currency                                            |
| sale_price                | Number + currency | ISO 4217                       | Discounted price                 | 79.99 USD             | Optional    | —                    | Must include ISO currency; must be less than price                   |
| sale_price_effective_date | Date range        | ISO 8601                       | Sale period                      | 2025-07-01/2025-07-31 | Optional    | sale_price           | Start date must precede end date                                     |
| unit_pricing_measure      | String            | Number + unit                  | Product measure for unit pricing | 100 ml                | Optional    | base_measure         | Include number and unit; required if base_measure is present         |
| base_measure              | String            | Number + unit                  | Base denominator for unit price  | 1 l                   | Optional    | unit_pricing_measure | Include number and unit; required if unit_pricing_measure is present |
| pricing_trend             | Enum              | increasing, decreasing, stable | Recent price trend indicator     | stable                | Optional    | —                    | Lower-case string                                                    |

### Inventory

Indicate current stock status to prevent out-of-stock purchases.

| Attribute          | Data Type | Supported Values                 | Description                    | Example    | Requirement | Dependencies | Validation Rules                     |
| ------------------ | --------- | -------------------------------- | ------------------------------ | ---------- | ----------- | ------------ | ------------------------------------ |
| availability       | Enum      | in_stock, out_of_stock, preorder | Stock status                   | in_stock   | Required    | —            | Lower-case string                    |
| availability_date  | Date      | ISO 8601                         | Date product becomes available | 2025-12-01 | Optional    | availability | Required if availability is preorder |
| inventory_quantity | Integer   | —                                | Stock count                    | 50         | Recommended | —            | Non-negative                         |

### Variants

Define product variations like size, color, or style.

| Attribute                | Data Type | Supported Values             | Description                         | Example                   | Requirement           | Dependencies | Validation Rules      |
| ------------------------ | --------- | ---------------------------- | ----------------------------------- | ------------------------- | --------------------- | ------------ | --------------------- |
| item_group_id            | String    | —                            | Shared ID for product variants      | SHOE-TRAIL-01             | Recommended           | —            | Max 100 chars         |
| item_group_title         | String    | —                            | Title for the product group         | Trail Running Shoes       | Recommended           | —            | Max 150 chars         |
| size                     | String    | —                            | Size option                         | M                         | Recommended (apparel) | —            | Max 20 chars          |
| size_system              | String    | ISO 3166-1 alpha-2           | Size system standard (country code) | US                        | Recommended (apparel) | —            | 2-letter country code |
| color                    | String    | —                            | Color option                        | Blue                      | Recommended (apparel) | —            | Max 40 chars          |
| age_group                | Enum      | infant, toddler, kids, adult | Age category                        | adult                     | Recommended (apparel) | —            | Lower-case string     |
| gender                   | Enum      | male, female, unisex         | Gender target                       | male                      | Recommended (apparel) | —            | Lower-case string     |
| offer_id                 | String    | —                            | Offer ID (SKU+seller+price)         | SKU12345-Blue-79.99       | Recommended           | —            | Unique within feed    |
| custom_variant1_category | String    | —                            | Custom variant dimension 1          | Size_Type                 | Optional              | —            | —                     |
| custom_variant1_option   | String    | —                            | Custom variant 1 option             | Petite / Tall / Maternity | Optional              | —            | —                     |
| custom_variant2_category | String    | —                            | Custom variant dimension 2          | Wood_Type                 | Optional              | —            | —                     |
| custom_variant2_option   | String    | —                            | Custom variant 2 option             | Oak / Mahogany / Walnut   | Optional              | —            | —                     |
| custom_variant3_category | String    | —                            | Custom variant dimension 3          | Cap_Type                  | Optional              | —            | —                     |
| custom_variant3_option   | String    | —                            | Custom variant 3 option             | Snapback / Fitted         | Optional              | —            | —                     |

### Fulfillment

Outline shipping methods, costs, and estimated delivery times.

| Attribute         | Data Type | Supported Values                   | Description                 | Example                                                                                                | Requirement               | Dependencies  | Validation Rules                                                |
| ----------------- | --------- | ---------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------- | ------------- | --------------------------------------------------------------- |
| shipping          | String    | country:region:service_class:price | Shipping method/cost/region | US:CA:Overnight:16.00 USD or multiple comma-separated: US:CA:Standard:5.00 USD,US:NY:Standard:7.00 USD | Required where applicable | —             | Multiple entries can be comma-separated; each uses colon format |
| delivery_estimate | Date      | ISO 8601                           | Estimated arrival date      | 2025-08-12                                                                                             | Optional                  | —             | Must be future date                                             |
| pickup_method     | Enum      | in_store, reserve, not_supported   | Available pickup options    | in_store                                                                                               | Optional                  | —             | Lower-case string                                               |
| pickup_sla        | String    | —                                  | Pickup service level        | Ready in 2 hours                                                                                       | Optional                  | pickup_method | —                                                               |

### Merchant Info

Identify the seller and link to any relevant merchant policies or storefront pages.

| Attribute             | Data Type | Supported Values | Description                      | Example                     | Requirement                          | Dependencies | Validation Rules |
| --------------------- | --------- | ---------------- | -------------------------------- | --------------------------- | ------------------------------------ | ------------ | ---------------- |
| seller_name           | String    | —                | Seller name                      | Example Store               | Required / Display                   | —            | Max 70 chars     |
| seller_url            | URL       | RFC 1738         | Seller page                      | https://example.com/store   | Required                             | —            | HTTPS preferred  |
| seller_privacy_policy | URL       | RFC 1738         | Seller-specific policies         | https://example.com/privacy | Required, if enable_checkout is true | —            | HTTPS preferred  |
| seller_tos            | URL       | RFC 1738         | Seller-specific terms of service | https://example.com/terms   | Required, if enable_checkout is true | —            | HTTPS preferred  |

### Returns

Provide return policies and time windows to set clear expectations for buyers.

| Attribute     | Data Type | Supported Values | Description             | Example                     | Requirement | Dependencies | Validation Rules |
| ------------- | --------- | ---------------- | ----------------------- | --------------------------- | ----------- | ------------ | ---------------- |
| return_policy | URL       | RFC 1738         | Return policy URL       | https://example.com/returns | Required    | —            | HTTPS preferred  |
| return_window | Integer   | Days             | Days allowed for return | 30                          | Required    | —            | Positive integer |

### Performance Signals

Share popularity and return-rate metrics where available.

| Attribute        | Data Type | Supported Values | Description          | Example | Requirement | Dependencies | Validation Rules              |
| ---------------- | --------- | ---------------- | -------------------- | ------- | ----------- | ------------ | ----------------------------- |
| popularity_score | Number    | —                | Popularity indicator | 4.7     | Recommended | —            | 0–5 scale or merchant-defined |
| return_rate      | Number    | Percentage       | Return rate          | 2%      | Recommended | —            | 0–100%                        |

### Compliance

Include regulatory warnings, disclaimers, or age restrictions.

| Attribute             | Data Type    | Supported Values | Description          | Example                                         | Requirement              | Dependencies | Validation Rules              |
| --------------------- | ------------ | ---------------- | -------------------- | ----------------------------------------------- | ------------------------ | ------------ | ----------------------------- |
| warning / warning_url | String / URL | —                | Product disclaimers  | Contains lithium battery, or CA Prop 65 warning | Recommended for Checkout | —            | If URL, must resolve HTTP 200 |
| age_restriction       | Number       | —                | Minimum purchase age | 21                                              | Recommended              | —            | Positive integer              |

### Reviews and Q&A

Supply aggregated review statistics and frequently asked questions.

| Attribute             | Data Type | Supported Values | Description                   | Example                       | Requirement | Dependencies | Validation Rules      |
| --------------------- | --------- | ---------------- | ----------------------------- | ----------------------------- | ----------- | ------------ | --------------------- |
| product_review_count  | Integer   | —                | Number of product reviews     | 254                           | Recommended | —            | Non-negative          |
| product_review_rating | Number    | —                | Average review score          | 4.6                           | Recommended | —            | 0–5 scale             |
| store_review_count    | Integer   | —                | Number of brand/store reviews | 2000                          | Optional    | —            | Non-negative          |
| store_review_rating   | Number    | —                | Average store rating          | 4.8                           | Optional    | —            | 0–5 scale             |
| q_and_a               | String    | —                | FAQ content                   | Q: Is this waterproof? A: Yes | Recommended | —            | Plain text            |
| raw_review_data       | String    | —                | Raw review payload            | —                             | Recommended | —            | May include JSON blob |

### Related Products

List products that are commonly bought together or act as substitutes.

| Attribute          | Data Type | Supported Values                                                                      | Description            | Example           | Requirement | Dependencies | Validation Rules             |
| ------------------ | --------- | ------------------------------------------------------------------------------------- | ---------------------- | ----------------- | ----------- | ------------ | ---------------------------- |
| related_product_id | String    | —                                                                                     | Associated product IDs | SKU67890,SKU67891 | Recommended | —            | Comma-separated list allowed |
| relationship_type  | Enum      | part_of_set, required_part, often_bought_with, substitute, different_brand, accessory | Relationship type      | often_bought_with | Recommended | —            | Lower-case string            |

### Geo Tagging

Indicate any region-specific pricing or availability overrides.

| Attribute        | Data Type | Supported Values             | Description             | Example                                                           | Requirement | Dependencies | Validation Rules                                                  |
| ---------------- | --------- | ---------------------------- | ----------------------- | ----------------------------------------------------------------- | ----------- | ------------ | ----------------------------------------------------------------- |
| geo_price        | String    | Region-specific price        | Price by region         | 79.99 USD (California) or multiple: 39.99 CAD (CA),24.99 GBP (GB) | Recommended | —            | Must include ISO 4217 currency; comma-separated if multiple       |
| geo_availability | String    | Region-specific availability | Availability per region | in_stock (Texas) or multiple: in_stock (TX),out_of_stock (NY)     | Recommended | —            | Regions must be valid ISO 3166 codes; comma-separated if multiple |

## Prohibited Products Policy

To keep ChatGPT a safe place for everyone, we only allow products and services that are legal, safe, and appropriate for a general audience. Prohibited products include, but are not limited to, those that involve adult content, age-restricted products (e.g., alcohol, nicotine, gambling), harmful or dangerous materials, weapons, prescription only medications, unlicensed financial products, legally restricted goods, illegal activities, or deceptive practices.

Merchants are responsible for ensuring their products and content do not violate the above restrictions or any applicable law. OpenAI may take corrective actions such as removing a product or banning a seller from being surfaced in ChatGPT if these policies are violated.

## References

- [OpenAI Product Feed Specification](https://developers.openai.com/commerce/specs/feed/)

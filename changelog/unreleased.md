- **2025-10-02**: Added `FulfillmentOptionPickup` schema to support in-store pickup orders. 

Includes 
    `type`, `id`, `title`, `pickup_address` (object with `name`, `line_one`, `line_two`, `city`, `state`, `country`, `postal_code`, with `line_one`, `city`, `country` required), `pickup_window`, `subtotal`, `tax`, and `total`.

Updated `schema.agentic_checkout.json`, `openapi.agentic_checkout.yaml`, `rfc.agentic_checkout.md` and API versioning.

## Fix Address.company field description

Corrected a copy-paste error where the `company` field in the `Address` schema had the description "Postal or ZIP code" (duplicated from the `postal_code` field above it). Fixed to "Company or organization name".

### Changes
- Fixed incorrect description on `Address.company` in the unreleased JSON Schema

### Files Updated
- `spec/unreleased/json-schema/schema.agentic_checkout.json`

# 2025-10-23

## Added

- Introduced `account_to_account` push payment support alongside card flows across the Agentic Checkout spec.
- Defined bank transfer instructions and async settlement status shapes in JSON Schemas and OpenAPI documents.
- Added agentic checkout examples demonstrating account-to-account instructions and messaging.
- Unified `payment_data` / `payment_method` schemas to use a single `type`-driven object (card vs account_to_account) while keeping card fields and tokens backwards-compatible.
- Clarified that `allowance` applies only to pull payments (`card`); account_to_account push flows omit allowances and rely on webhook settlement.

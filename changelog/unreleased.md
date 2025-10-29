# Unreleased Changes

## Payment Method Expansion: PIX Support

- **Added PIX payment method support** to both Agentic Checkout and Delegate Payment specifications.
  - PIX is the instant payment system developed by the Brazilian Central Bank (Banco Central do Brasil).
  - Enables instant payments in Brazilian Real (BRL) with near-instant settlement.

- **Added Brazilian payment providers:**
  - `mercadopago`  Mercado Pago, major Latin American payment platform
  - `pagseguro`  PagSeguro, Brazilian payment gateway
  - Existing `stripe` provider now supports PIX alongside card payments

- **New PaymentMethodPix schema** in Delegate Payment API:
  - `cpf_cnpj` field for Brazilian tax identification (required)
  - `pix_key` and `pix_key_type` for payment routing (optional)
  - `qr_code_data` for PIX QR code EMV payload (optional)
  - Validation rules for CPF (11 digits) and CNPJ (14 digits) formats

- **Updated schemas:**
  - `PaymentProvider.provider` enum now includes: `stripe`, `mercadopago`, `pagseguro`
  - `PaymentProvider.supported_payment_methods` enum now includes: `card`, `pix`
  - `PaymentData.provider` enum updated to match payment provider options

- **New examples added:**
  - Agentic Checkout examples for PIX with all three providers
  - Delegate Payment examples showing PIX tokenization with various field combinations
  - Examples demonstrate Brazilian addresses, currency (BRL), and PIX-specific flows

- **RFC documentation updated:**
  - New section in Agentic Checkout RFC (5.1) documenting PIX payment method
  - New section in Delegate Payment RFC (3.4) documenting PaymentMethodPix structure
  - Updated validation rules to include PIX-specific requirements
  - Added guidance on currency, geography, and instant settlement characteristics

This change enables merchants in Brazil to accept PIX payments through AI agent-driven checkout flows, supporting the growing adoption of instant payments in Latin America.

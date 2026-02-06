# [SEP][Proposal]: Extending SPT to Support Crypto Payments

**Issue**: [#109](https://github.com/agentic-commerce-protocol/agentic-commerce-protocol/issues/109)
**Status**: Proposal (awaiting sponsor)

- **Delegate Payment API**: Extended to support a second credential type, **crypto**, alongside **card**. When `payment_method.type` is `crypto`, the request includes `x402_payload` (signed x402 PaymentPayload per [x402](https://github.com/coinbase/x402)). The PSP delegates verification to a facilitator (e.g. icpay); after verification the PSP issues an SPT and stores the signed payload until the merchant submits the SPT for execution. Response shape unchanged (id, created, metadata). Checkout unchanged (agent sends SPT, merchant submits SPT to PSP).
- **Spec**: `spec/unreleased/openapi/openapi.delegate_payment.yaml` and `spec/unreleased/json-schema/schema.delegate_payment.json` extended with `PaymentMethodCrypto` and oneOf payment_method. New error codes for x402 (e.g. invalid_x402_payload, x402_verification_failed).
- **Full SEP and discussion**: See GitHub issue #109.

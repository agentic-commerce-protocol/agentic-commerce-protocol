### Added
- New intervention types: `redirect`, `webview`, `otp` in `InterventionCapabilities.supported` and `InterventionCapabilities.required` enums
- `InterventionContext` schema for structured intervention metadata on checkout session responses
- `InterventionResponse` schema for agent submission of intervention results (OTP codes, redirect completion)
- `intervention_context` field on `CheckoutSessionBase` for pending intervention details
- `intervention_response` field on `CheckoutSessionUpdateRequest` for agent intervention submissions
- Examples for OTP flow, redirect flow, and capability mismatch scenarios
- RFC: `rfcs/rfc.intervention_types.md`

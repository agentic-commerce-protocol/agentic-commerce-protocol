## Additional 3DS authentication flow examples

Added examples for 3DS authentication outcomes that complement the consumer authentication SEP (PR #53).

### Changes
- `authentication_result_denied_example`: Failed authentication with `outcome: "denied"`
- `authentication_result_frictionless_example`: Frictionless flow with `outcome: "attempt_acknowledged"`
- `complete_session_with_denied_authentication_request`: Complete request showing how to handle denied authentication

### Files Updated
- `examples/unreleased/examples.agentic_checkout.json`

### Reference
- Issue: #55
- Related: PR #53 (consumer authentication SEP)

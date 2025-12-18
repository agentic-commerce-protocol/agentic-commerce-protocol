# RFC: Quantum Gravity Encryption (QGE) Envelope for ACP

**Status:** Draft
**Version:** 2025-11-30
**Scope:** Cryptographic envelope that protects ACP payloads across agents, merchants, and payment providers

The **Quantum Gravity Encryption (QGE)** envelope defines a layered protection model that combines classical authenticated
encryption, post-quantum key exchange, and a telemetry feed that measures channel stability ("gravity well"). It is designed to
let ACP participants upgrade their security posture without disrupting existing REST or Argus C2 integrations. QGE sits entirely
at the message boundary—wrapping checkout requests, delegate payment tokens, or command bus messages before transport.

---

## 1. Motivation & Goals

1. **Quantum-Resilient Confidentiality** — Adopt a NIST-approved post-quantum KEM (e.g., ML-KEM) so encrypted payloads are
   protected against store-now-decrypt-later adversaries.
2. **Authenticated Integrity** — All envelopes MUST include a deterministic signature (`ed25519` or `p256`) that covers headers,
   ciphertext, and telemetry probes.
3. **Transport Agnostic** — Works over HTTPS, WebSockets, Argus C2 brokers, or file drops because it is self-describing JSON.
4. **Progressive Rollout** — Implementations can negotiate capabilities through metadata without breaking legacy clients.
5. **Observability** — Gravity probes encode round-trip latency and drift measurements so responders can detect downgrade
   attacks or endpoint tampering.

---

## 2. Envelope Structure

All QGE messages MUST validate against the canonical schema shown below. Fields marked `REQUIRED` MUST be present.

```json
{
  "qge_version": "2025-11-30",                // REQUIRED. Semantic version of this RFC.
  "envelope_id": "qge_msg_123",               // REQUIRED. UUID or monotonic ULID.
  "capabilities": ["mlkem768", "gravity_v2"], // REQUIRED. Negotiated crypto suite list.
  "sender": {
    "entity_id": "agent_ai_01",
    "key_id": "did:key:z6Mkv..."
  },
  "receiver": {
    "entity_id": "merchant_hub_09",
    "key_id": "did:key:z6Mkf..."
  },
  "telemetry": {
    "latency_ms": 42,
    "gravity_signature": "base64(latency||jitter||nonce)",
    "jitter_ms": 3,
    "drift_ppm": 18
  },
  "ciphertext": "base64(aead_payload)",        // REQUIRED.
  "aad": "base64(structured_headers)",        // OPTIONAL. Associated data for AEAD.
  "signature": "base64(sig)"                  // REQUIRED. Detached signature over canonical form.
}
```

### 2.1 Capabilities

- Capabilities MUST include exactly one key encapsulation mechanism (e.g., `mlkem512`, `mlkem768`).
- Capabilities MUST include exactly one symmetric cipher (e.g., `aes256gcm`, `chacha20poly1305`).
- Gravity probes (`gravity_v1`, `gravity_v2`) describe how telemetry fields are computed. Implementers MAY omit telemetry by
  advertising `gravity_none`, but SHOULD only do so for offline batch uploads.

### 2.2 Ciphertext Generation

1. Perform KEM handshake using the receiver's `key_id`. The shared secret derives the AEAD key/nonce via HKDF-SHA3-512.
2. Serialize the ACP payload (REST body, Argus message, etc.) as canonical JSON and encrypt it using the negotiated AEAD.
3. Produce `signature` by signing the concatenation of:
   - `qge_version`
   - `envelope_id`
   - `capabilities[]`
   - `telemetry`
   - `ciphertext`
   - `aad`

Signatures MUST use deterministic schemes to prevent nonce reuse.

---

## 3. Negotiation Flow

The negotiation process is intentionally light-weight so it can ride along existing requests.

1. **Discovery** — Each participant publishes `/.well-known/qge.json` with supported capabilities, contact info, and policy flags
   like `"requires_telemetry": true`.
2. **Proposal** — The sender includes HTTP headers or Argus metadata:
   - `QGE-Version: 2025-11-30`
   - `QGE-Capabilities: mlkem768,aes256gcm,gravity_v2`
3. **Acceptance** — Receivers respond with `QGE-Accepted: mlkem768,aes256gcm,gravity_v2`. If capabilities mismatch, respond with
   `406 Not Acceptable` plus a machine-readable body enumerating supported suites.
4. **Transmission** — The sender wraps the original payload inside the QGE envelope and transmits it. Receivers MUST validate the
   signature before attempting decryption.
5. **Error Signaling** — Validation failures MUST produce `event.security.qge_failure` on Argus or HTTP `412 Precondition Failed`
   with details including `reason` (`"signature_invalid"`, `"telemetry_out_of_bounds"`, etc.).

---

## 4. Gravity Telemetry

Gravity probes act as an early-warning system for tampering or malicious replay:

- `latency_ms` is the rolling average round-trip latency for the channel. Implementers SHOULD compute over the last five samples.
- `jitter_ms` reflects the standard deviation of recent latency measurements.
- `drift_ppm` measures clock skew parts-per-million relative to a trusted timesource.
- `gravity_signature` is an HMAC (HKDF output as key) covering `latency_ms`, `jitter_ms`, `drift_ppm`, and a nonce. Receivers
  MUST validate it before trusting telemetry values.
- Gravity probes SHOULD feed into anomaly detection; if drift exceeds 100 ppm or latency spikes by >3× baseline, receivers MAY
  trigger `alert.security.possible_downgrade`.

---

## 5. Compatibility & Rollout

- QGE envelopes wrap existing payloads, so REST endpoints and Argus brokers treat them as opaque JSON blobs.
- Legacy clients MAY continue sending plaintext payloads; servers SHOULD respond with `QGE-Required: true` when policies demand
  encryption.
- Because QGE adds ~2 KB of metadata, implementers MUST raise any payload size limits accordingly (recommended +4 KB buffer).
- Merchants SHOULD maintain dual pipelines (plaintext + QGE) during migration and log adoption metrics per capability.

---

## 6. Security Considerations

- Private keys MUST be stored inside FIPS 140-3 Level 2 or higher HSMs.
- Receivers MUST enforce signature verification before decrypting to avoid oracle attacks.
- Telemetry validation MUST clamp negative values and reject out-of-range measurements.
- Implementers MUST rotate sender signing keys at least every 30 days; key IDs SHOULD be globally unique DIDs.
- Gravity probes MUST omit personally identifiable information; only statistical metadata is permitted.

---

## 7. Open Questions

1. Should the telemetry feed be standardized for multi-hop relays (agent → PSP → merchant)?
2. Do we require asynchronous attestations (e.g., TEE proofs) before trusting capability descriptors?
3. How should partial adoption be represented in the changelog (per capability vs. per entity)?

Contributors are invited to provide feedback via GitHub discussions or follow-up RFCs that refine these open questions.

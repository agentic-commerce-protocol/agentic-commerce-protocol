## Added

- Document optional `Server-Timing` response headers across ACP REST OpenAPI specs and RFCs. ACP responses should use the `acp` metric with `dur` in milliseconds, for example `Server-Timing: acp;dur=42.3`.

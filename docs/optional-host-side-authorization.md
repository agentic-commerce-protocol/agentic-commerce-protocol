# Optional host-side authorization

This note describes an optional pattern for **hosts** (agent runtimes, MCP
clients, or routers) that invoke Agentic Commerce Protocol (ACP) checkout or
payment steps. It does not change the ACP specification, OpenAPI schemas, or
JSON Schema models in this repository.

## What this is (and is not)

ACP already defines how agents, merchants, and payment providers complete
purchases. Merchant authentication, payment provider authorization, Shared
Payment Tokens / `delegate_payment` allowances, and request signing remain the
source of truth for what a caller may do on those rails.

Optional host-side authorization is an **extra** allow/deny check that a host
can run **before** it sends a sensitive ACP call (for example
`complete_checkout_session` over the MCP binding, or a `delegate_payment`
request). It answers a narrow question: given this agent, this tool or spend
intent, and this local policy, is the host willing to proceed right now?

It does **not**:

- replace ACP, the Extensions Framework, or payment handlers
- replace merchant auth, PSP authorization, or payment capture/settlement
- replace `Authorization`, `Signature`, `Timestamp`, or `Idempotency-Key`
  requirements on ACP endpoints
- require any new dependency in ACP specs or reference implementations

## Why hosts care

ACP MCP tools such as `complete_checkout_session` finalize orders and can
carry payment instrument tokens. `delegate_payment` issues vault tokens under
explicit allowance constraints. A host that brokers those calls may want a
local policy gate before the network request leaves the agent runtime, in
addition to whatever the merchant and PSP enforce later.

This is the same class of concern as the MCP binding's out-of-band auth and
[proxy trust boundary](mcp-binding.md#proxy-trust-boundary): keep secrets and
policy decisions off the model prompt surface, on the host.

## Suggested host flow

1. The agent requests an ACP checkout or payment step (REST or MCP).
2. The host classifies the call as sensitive (for example complete checkout,
   delegate payment, or any tool your local policy marks as spend-capable).
3. The host requests a signed allow or deny decision from its chosen gate.
4. The host **verifies** that decision locally.
5. On deny, the host does not invoke the ACP endpoint or MCP tool.
6. On allow, the host invokes ACP as usual. Merchant auth and the payment
   provider still enforce what is allowed on their side.

Fail closed: if verification fails or the gate is unavailable, do not execute
the sensitive step.

## Example: AffixIO as an optional gate

[AffixIO](https://www.affix-io.com) is one optional implementation of this host
pattern. It provides signed allow/deny decisions for agent tool and spend gates
(`mcpToolGate`, ACTION / Know Your Agent). The host verifies the decision
before the ACP call. AffixIO is not an ACP product, not a required dependency
of this repository, and not a substitute for merchant or PSP authorization.
It is not person KYC.

For SDK install and gate usage:

- Product: https://www.affix-io.com
- SDK source: https://github.com/AffixIO/SDK
- npm package: https://www.npmjs.com/package/affixio

Illustrative host-side sketch (Node.js). Adapt names and policy to your
runtime. Do not put AffixIO keys, merchant tokens, or payment credentials in
model prompts.

```javascript
import { AffixSDK, mcpToolGate, spendingPolicy } from "affixio";

const sdk = new AffixSDK({ apiKey: process.env.AFFIX_API_KEY });

// Local host policy only. Merchant auth and the PSP still decide what
// succeeds on their rails.
const policy = spendingPolicy()
  .currency("USD")
  .maxPerAction(50)
  .allowCategories(["payments"]);

export async function beforeAcpSpendStep(tool, meta = {}) {
  const gate = await mcpToolGate({
    sdk,
    policy,
    tool,
    agentId: meta.agentId || "agent://acp/host",
    amount: Number(meta.amount) || 0,
    currency: meta.currency || "USD",
    category: "payments",
    meta: {
      checkoutSessionId: String(meta.checkoutSessionId || ""),
      argsDigest: String(meta.argsDigest || ""),
    },
  });

  if (!gate.allowed) {
    throw new Error(gate.reason || "host gate denied ACP spend step");
  }

  return gate;
}

// Host pseudocode:
// await beforeAcpSpendStep("complete_checkout_session", { amount, currency, checkoutSessionId });
// await acpMcp.callTool("complete_checkout_session", args); // only after allow
```

Skip this example entirely if you do not want an extra host gate. ACP REST and
MCP flows continue to work with the authentication and payment controls already
defined in the specification.

## Related material in this repository

- [MCP Transport Binding](mcp-binding.md) (auth out-of-band; proxy trust boundary)
- [RFC: Delegate Payment](../rfcs/rfc.delegate_payment.md)
- [RFC: Payment Handlers](../rfcs/rfc.payment_handlers.md)
- [RFC: Agentic Checkout](../rfcs/rfc.agentic_checkout.md)

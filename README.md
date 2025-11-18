# Agentic Commerce Protocol (ACP)

The **Agentic Commerce Protocol (ACP)** is an interaction model and open standard for connecting buyers, their AI agents, and businesses to complete purchases seamlessly.

The specification is [maintained](MAINTAINERS.md) by **OpenAI** and **Stripe** and is currently in `draft`.

- **For businesses** Reach more customers. Sell to high-intent buyers by making your products and services available for purchase through AI agents—all while using your existing commerce infrastructure.
- **For AI Agents** - Embed commerce into your application. Let your users discover and transact directly with businesses in your application, without being the merchant of record.
- **For payment providers** - Grow your volume. Process agentic transactions by passing secure payment tokens between buyers and businesses through AI agents.

Learn more at [agenticcommerce.dev](https://agenticcommerce.dev).

---

## 📦 Repo Structure

```plaintext
<repo-root>/
├── rfcs/
│   └── rfc.*.md
│
├── spec/
│   ├── openapi/
│   │   └── openapi.*.yaml
│   │
│   └── json-schema/
│       └── schema.*.json
│
├── examples/
│   └── examples.*.json
│
├── changelog/
│   └──  *.md
│
├── MAINTAINERS.md
├── CONTRIBUTING.md
├── LICENSE
└── README.md
```

---

## 🔗 Quick Links

| Spec Type          | Latest Version                         | Description                                                        |
| ------------------ | -------------------------------------- | ------------------------------------------------------------------ |
| **RFC (Markdown)** | [rfcs/](rfcs/)                         | Human-readable design doc with rationale, flows, and rollout plan. |
| **OpenAPI (YAML)** | [spec/openapi/](spec/openapi/)         | Machine-readable HTTP API spec for integrating checkout endpoints. |
| **JSON Schema**    | [spec/json-schema/](spec/json-schema/) | Data models for payloads, events, and reusable objects.            |
| **Examples**       | [examples/](examples/)                 | Sample requests, responses.                                        |
| **Changelog**      | [changelog/](changelog/)               | API version history and breaking changes.                          |

---

## 🛠 Getting Started

ACP has been **first implemented by both OpenAI and Stripe**, providing production-ready reference implementations for merchants and developers:

- [OpenAI Documentation](https://developers.openai.com/commerce/)
- [Stripe Agentic Commerce Documentation](https://docs.stripe.com/agentic-commerce)

To start building with ACP:

1. Review this repo's [OpenAPI specs](spec/openapi/) and [JSON Schemas](spec/json-schema/).
2. Choose a reference implementation:
   - Use OpenAI's implementation to integrate with ChatGPT and other AI agent surfaces.
   - Use Stripe's implementation to leverage its payment and merchant tooling.
3. Follow the guides provided in the linked documentation.
4. Test using the [examples](examples/) provided in this repo.

---

## 📚 Documentation

| Area                  | Resource                                                                                 |
| --------------------- | ---------------------------------------------------------------------------------------- |
| Checkout API Spec     | [spec/openapi/openapi.agentic_checkout.yaml](spec/openapi/openapi.agentic_checkout.yaml) |
| Delegate Payment Spec | [spec/openapi/openapi.delegate_payment.yaml](spec/openapi/openapi.delegate_payment.yaml) |
| Argus C2 Protocol RFC | [rfcs/rfc.argus_c2.md](rfcs/rfc.argus_c2.md)                                             |
| Quantum Gravity Encryption RFC | [rfcs/rfc.quantum_gravity_encryption.md](rfcs/rfc.quantum_gravity_encryption.md) |

---

## 📝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for:

- Branching model
- Pull request guidelines
- Spec versioning and review process

All changes must include:

- Updated OpenAPI / JSON Schemas
- New or updated examples
- Changelog entry in `changelog/unreleased.md`

---

## 📜 License

Licensed under the [Apache 2.0 License](LICENSE).

# Agentic Commerce Protocol (ACP)

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![CLA](https://img.shields.io/badge/CLA-Required-red.svg)](legal/cla/)
[![Maintained by](https://img.shields.io/badge/Maintained%20by-OpenAI%20%26%20Stripe-00ADD8.svg)](MAINTAINERS.md)
[![Status](https://img.shields.io/badge/Status-Draft-yellow.svg)](changelog/)

The **Agentic Commerce Protocol (ACP)** is an interaction model and open standard for connecting buyers, their AI agents, and businesses to complete purchases seamlessly.

The specification is [maintained](MAINTAINERS.md) by **OpenAI** and **Stripe** and is currently in `draft`.

- **For businesses** - Reach more customers. Sell to high-intent buyers by making your products and services available for purchase through AI agents—all while using your existing commerce infrastructure.
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
│   ├── 2025-09-29/              # Initial release
│   │   ├── openapi/
│   │   │   └── openapi.*.yaml
│   │   └── json-schema/
│   │       └── schema.*.json
│   ├── 2025-12-12/              # Breaking fulfillment changes
│   │   ├── openapi/
│   │   └── json-schema/
│   ├── unreleased/              # Current development
│   │   ├── openapi/
│   │   └── json-schema/
│   └── draft/                   # Draft specifications
│
├── examples/
│   ├── 2025-09-29/              # Examples for initial release
│   ├── 2025-12-12/              # Examples for 2025-12-12
│   ├── unreleased/              # Examples for unreleased features
│   └── draft/
│
├── changelog/
│   ├── 2025-09-29.md
│   ├── 2025-12-12.md
│   └── unreleased.md
│
├── docs/
│   ├── governance.md
│   ├── principles-mission.md
│   └── sep-guidelines.md
│
├── legal/
│   └── cla/
│       ├── INDIVIDUAL.md
│       ├── CORPORATE.md
│       ├── SIGNATORIES.md
│       ├── INDIVIDUAL_PROCESS.md
│       └── CORPORATE_PROCESS.md
│
├── MAINTAINERS.md
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── LICENSE
└── README.md

```
​
---

## 🔗 Quick Links

| Spec Type          | Latest Stable                                        | Description                                                        |
| ------------------ | ---------------------------------------------------- | ------------------------------------------------------------------ |
| **RFC (Markdown)** | [rfcs/](rfcs/)                                       | Human-readable design doc with rationale, flows, and rollout plan. |
| **OpenAPI (YAML)** | [spec/2026-01-16/openapi/](spec/2026-01-16/openapi/) | Machine-readable HTTP API spec for integrating checkout endpoints. |
| **JSON Schema**    | [spec/2026-01-16/json-schema/](spec/2026-01-16/json-schema/) | Data models for payloads, events, and reusable objects.    |
| **Examples**       | [examples/2026-01-16/](examples/2026-01-16/)         | Sample requests, responses.                                        |
| **Changelog**      | [changelog/](changelog/)                             | API version history and breaking changes.                          |

---

## 📅 Versioning

ACP uses **date-based versioning** in `YYYY-MM-DD` format. Each version represents a complete snapshot of the specification at that point in time.

### Version Structure

| Directory | Purpose |
| --------- | ------- |
| `spec/<version>/` | Complete spec snapshot for a released version |
| `spec/unreleased/` | Current development (not yet released) |
| `spec/draft/` | Experimental specifications under review |
| `examples/<version>/` | Examples matching each spec version |
| `changelog/<version>.md` | Release notes for each version |

### Version Lifecycle

1. **unreleased/** - New features and changes are developed here
2. **Released** - When ready, `unreleased/` is snapshotted to a dated version (e.g., `2026-01-16/`)
3. **Deprecated** - Older versions remain available but are marked deprecated in the changelog

---

## 🛠 Getting Started

ACP has been **first implemented by both OpenAI and Stripe**, providing production-ready reference implementations for merchants and developers:

- [OpenAI Documentation](https://developers.openai.com/commerce/)
- [Stripe Agentic Commerce Documentation](https://docs.stripe.com/agentic-commerce)

To start building with ACP:

1. Review this repo's [OpenAPI specs](spec/2026-01-16/openapi/) and [JSON Schemas](spec/2026-01-16/json-schema/) for the latest stable version.
2. Choose a reference implementation:
   - Use OpenAI's implementation to integrate with ChatGPT and other AI agent surfaces.
   - Use Stripe's implementation to leverage its payment and merchant tooling.
3. Follow the guides provided in the linked documentation.
4. Test using the [examples](examples/2026-01-16/) provided in this repo.

---

## 📚 Documentation

| Area                  | Resource                                                                                                               |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Checkout API Spec     | [spec/2026-01-16/openapi/openapi.agentic_checkout.yaml](spec/2026-01-16/openapi/openapi.agentic_checkout.yaml)         |
| Delegate Payment Spec | [spec/2026-01-16/openapi/openapi.delegate_payment.yaml](spec/2026-01-16/openapi/openapi.delegate_payment.yaml)         |
| Governance            | [docs/governance.md](docs/governance.md)                                                                               |
| Project Principles    | [docs/principles-mission.md](docs/principles-mission.md)                                                               |
| SEP Guidelines        | [docs/sep-guidelines.md](docs/sep-guidelines.md)                                                                       |

---

## 📝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for:

- Branching model
- Pull request templates and guidelines
- Spec versioning and review process
- Community guidelines

### Pull Request Templates

When creating a PR, choose the appropriate template:

- **[SEP Proposal](.github/PULL_REQUEST_TEMPLATE/sep-proposal.md)** - For major protocol changes, breaking changes, or process changes
- **[Minor Improvement](.github/PULL_REQUEST_TEMPLATE/minor-improvement.md)** - For documentation fixes, bug fixes, or tooling improvements

See [docs/governance.md](docs/governance.md) for guidance on what requires a SEP.

### Contributor License Agreement (CLA)

**All contributors must sign a CLA before contributions can be accepted.**

- **Individual Contributors**: Automated via [CLA Assistant](https://cla-assistant.io/) when you submit your first PR
- **Corporate Contributors**: See [Corporate CLA Process](legal/cla/CORPORATE_PROCESS.md)

[View signed CLAs](legal/cla/SIGNATORIES.md) | [Learn more about our CLA](legal/cla/)

### All changes must include:

- Updated OpenAPI / JSON Schemas (if applicable)
- New or updated examples
- Changelog entry in `changelog/unreleased.md`

---

## 🏛 Governance

ACP is jointly governed by **OpenAI** and **Stripe** as Founding Maintainers, with a clear path toward broader community governance.

- **Governance Model**: [docs/governance.md](docs/governance.md)
- **Project Principles**: [docs/principles-mission.md](docs/principles-mission.md)
- **Maintainers**: [MAINTAINERS.md](MAINTAINERS.md)
- **Decision Process**: Consensus-based with escalation procedures
- **Future Path**: Neutral foundation stewardship as ecosystem matures

---

## 🤝 Community

- **Code of Conduct**: [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- **Discussions**: [GitHub Discussions](https://github.com/agentic-commerce-protocol/agentic-commerce-protocol/discussions)
- **Issues**: [Report bugs or request features](https://github.com/agentic-commerce-protocol/agentic-commerce-protocol/issues)
- **SEPs**: [Propose protocol enhancements](docs/sep-guidelines.md)

---

## 📜 License

Licensed under the [Apache 2.0 License](LICENSE).


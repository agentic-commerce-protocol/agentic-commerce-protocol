 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/README.md b/README.md
index 71e3a23ebc78f77549741b709dbc1c972e029925..6e96f22db73f066ad8f9c211443d31fd495e6381 100644
--- a/README.md
+++ b/README.md
@@ -1,30 +1,30 @@
 # Agentic Commerce Protocol (ACP)
 
 The **Agentic Commerce Protocol (ACP)** is an interaction model and open standard for connecting buyers, their AI agents, and businesses to complete purchases seamlessly.
 
-The specification is [maintained](MAINTAINERS.md) by **OpenAI** and **Stripe** and is currently in `draft`.
+The specification is [maintained](MAINTAINERS.md) by **OpenAI** and is currently in `draft`, with this README focused on India/Juspay adoption guidance.
 
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
diff --git a/README.md b/README.md
index 71e3a23ebc78f77549741b709dbc1c972e029925..6e96f22db73f066ad8f9c211443d31fd495e6381 100644
--- a/README.md
+++ b/README.md
@@ -32,69 +32,79 @@ Learn more at [agenticcommerce.dev](https://agenticcommerce.dev).
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
 
-ACP has been **first implemented by both OpenAI and Stripe**, providing production-ready reference implementations for merchants and developers:
+ACP has a production implementation from OpenAI, and this README highlights the India-ready flow using Juspay Express Checkout:
 
 - [OpenAI Documentation](https://developers.openai.com/commerce/)
-- [Stripe Agentic Commerce Documentation](https://docs.stripe.com/agentic-commerce)
+- [Juspay Express Checkout Documentation](https://juspay.io/in/expresscheckout)
 
 To start building with ACP:
 
 1. Review this repo's [OpenAPI specs](spec/openapi/) and [JSON Schemas](spec/json-schema/).
 2. Choose a reference implementation:
    - Use OpenAI's implementation to integrate with ChatGPT and other AI agent surfaces.
-   - Use Stripe's implementation to leverage its payment and merchant tooling.
+   - Use Juspay's Express Checkout tooling for India-first payment experiences and tokenization.
 3. Follow the guides provided in the linked documentation.
 4. Test using the [examples](examples/) provided in this repo.
 
+## 🇮🇳 Integrating with Juspay
+
+ACP now models Juspay as a first-class `payment_provider` so Indian merchants can reuse their existing Juspay Express Checkout setup. Key pointers:
+
+- The [`PaymentProvider`](spec/openapi/openapi.agentic_checkout.yaml) schema enumerates `provider: juspay` and expands `supported_payment_methods` to include UPI, netbanking, wallets, cards, and EMIs. 【F:spec/openapi/openapi.agentic_checkout.yaml†L305-L318】
+- Checkout completion requests may now carry `payment_data.provider = "juspay"` tokens returned from Juspay's payment APIs. 【F:spec/json-schema/schema.agentic_checkout.json†L286-L309】
+- Review the end-to-end [Juspay example payloads](examples/examples.agentic_checkout.juspay.json) for INR carts, localized fulfillment, and UPI flows. 【F:examples/examples.agentic_checkout.juspay.json†L1-L128】
+- Follow [Juspay Express Checkout docs](https://juspay.io/in/expresscheckout) for acquiring tokens; ACP simply transports the opaque token inside `payment_data`.
+
 ---
 
 ## 📚 Documentation
 
 | Area                  | Resource                                                                                 |
 | --------------------- | ---------------------------------------------------------------------------------------- |
 | Checkout API Spec     | [spec/openapi/openapi.agentic_checkout.yaml](spec/openapi/openapi.agentic_checkout.yaml) |
 | Delegate Payment Spec | [spec/openapi/openapi.delegate_payment.yaml](spec/openapi/openapi.delegate_payment.yaml) |
+| India (Juspay) Example | [examples/examples.agentic_checkout.juspay.json](examples/examples.agentic_checkout.juspay.json) |
 
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
 
EOF
)

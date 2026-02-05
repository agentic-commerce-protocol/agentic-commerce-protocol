# Contributing to Agentic Commerce Protocol (ACP)

Thank you for your interest in contributing! We welcome improvements, bug fixes, and new ideas. Please read these guidelines to help maintain a high-quality, consistent, and collaborative project.

---

## Table of Contents

- [Contributor License Agreement (CLA)](#contributor-license-agreement-cla)
- [Branching Model](#branching-model)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Spec Versioning & Review Process](#spec-versioning--review-process)
- [Required Updates for All Changes](#required-updates-for-all-changes)
- [Code of Conduct](#code-of-conduct)
- [Getting Help](#getting-help)

---

## Contributor License Agreement (CLA)

**All contributors must sign a Contributor License Agreement (CLA) before their contributions can be accepted.**

This is required by Section 2.4 of our [Collaboration and Governance Agreement](docs/governance.md) and ensures clear intellectual property rights for all contributors and users.

### For Individual Contributors

When you submit your first pull request:

1. The **CLA Assistant bot** will automatically comment on your PR
2. Click the link to review the [Individual CLA](legal/cla/INDIVIDUAL.md)
3. Click "I Agree" to sign electronically
4. Your signature is recorded for all future contributions

**This takes less than 1 minute and only needs to be done once.**

See [Individual CLA Process](legal/cla/INDIVIDUAL_PROCESS.md) for details.

### For Corporate Contributors

If you're contributing on behalf of your employer:

1. Your employer must sign the [Corporate CLA](legal/cla/CORPORATE.md)
2. Follow the [Corporate CLA Process](legal/cla/CORPORATE_PROCESS.md)
3. Once approved, you and your colleagues can contribute without individual CLA signatures

**Important:** Check with your employer about their IP policies before contributing.

### CLA Questions?

- **Why is a CLA required?** The CLA clarifies IP rights and protects both contributors and users. It's based on Apache Foundation's standard CLAs.
- **View signed CLAs:** [SIGNATORIES.md](legal/cla/SIGNATORIES.md)
- **Corporate CLA FAQ:** [CORPORATE_PROCESS.md](legal/cla/CORPORATE_PROCESS.md)

---

## Branching Model

- **main**: The stable, released branch. All production-ready code lives here.
- **feature branches**: For new features, bug fixes, or documentation updates, create a branch from `main`:
  - Name your branch descriptively, e.g., `feature/add-webhook-support` or `fix/typo-in-rfc`.
- **Pull Requests (PRs)**: All changes must be submitted via PR. Never commit directly to `main`.

---

## Pull Request Guidelines

### 💡 Using PR Templates (Highly Recommended!)

We've created PR templates to help make your contribution process smoother and get your changes reviewed faster! When you create a pull request, GitHub will offer you a choice of templates - **we highly recommend using them** as they guide you through what reviewers need to know.

**Choose the template that matches your contribution:**

1. **[sep-proposal.md](.github/PULL_REQUEST_TEMPLATE/sep-proposal.md)** - Great for:
   - Major protocol changes (new features, breaking changes)
   - Process changes (governance, contribution guidelines)
   - Complex or controversial changes requiring community discussion
   - Any change that requires a SEP (see [SEP Guidelines](docs/sep-guidelines.md))

2. **[minor-improvement.md](.github/PULL_REQUEST_TEMPLATE/minor-improvement.md)** - Perfect for:
   - Documentation fixes or editorial clarifications
   - Simple bug fixes
   - Minor enum or data changes
   - Tooling improvements
   - Example updates

**Not sure which template fits?** No worries! Check out [docs/governance.md](docs/governance.md) for guidance, or just pick the one that feels closest and we'll help you from there.

**Why use templates?** They help ensure you include all the info we need (like changelog entries, examples, and CLA status), which means faster reviews and merges for you! Think of them as a friendly checklist that helps both of us. 🚀

### General PR Guidelines

- **Scope**: Keep PRs focused and minimal. Separate unrelated changes (makes review easier for everyone!).
- **Description**: If using a template (recommended!), fill it out as completely as you can. Clear descriptions help us understand and review faster.
- **Tests**: If applicable, include or update tests/examples.
- **Review**: At least one maintainer will review and approve before merging.
- **Status Checks**: Ensure all CI checks pass before requesting review.
- **Linked Issues**: Reference any related issues or RFCs in the PR description.
- **CLA**: Ensure your CLA is signed (the bot will check automatically and guide you through it).

---

## Changelog Workflow

We use a directory-based changelog system to avoid merge conflicts when multiple contributors are working simultaneously.

### For Contributors: Adding a Changelog Entry

When you make a change, create a new markdown file in `changelog/unreleased/`:

1. **Create a file** with a descriptive name:
   ```bash
   # Example filenames:
   changelog/unreleased/add-payment-handlers.md
   changelog/unreleased/fix-fulfillment-schema.md
   changelog/unreleased/update-capability-negotiation.md
   ```

2. **Write your changelog entry** following this format:
   ```markdown
   ## Title of Your Change

   Brief description of what changed and why.

   ### Breaking Changes (if applicable)
   - List any breaking changes
   - Include migration guidance

   ### Changes
   - Specific change 1
   - Specific change 2

   ### Files Updated
   - `path/to/file1.json`
   - `path/to/file2.yaml`

   ### Reference
   - PR: #<pr-number>
   ```

3. **Commit the file** with your PR

### For Maintainers: Building a Release

When cutting a new release, manually combine all files in `changelog/unreleased/` into a single `changelog/YYYY-MM-DD.md` file, then remove the individual entry files.

---

## Spec Versioning & Review Process

- **Versioning**: All breaking changes or new features to the protocol/specs must increment the version (e.g., `2025-09-29` → `2025-10-01`).
- **Compatibility**: Maintain backward compatibility where possible. Document any breaking changes clearly in the changelog.
- **Review**: Major changes (especially to RFCs, OpenAPI, or JSON Schemas) require:
  - Discussion in a PR or issue
  - Approval from at least one lead maintainer (see [MAINTAINERS.md](MAINTAINERS.md))

### Specification Enhancement Proposals (SEPs)

For substantial changes to the protocol, you may need to submit a SEP:

- **What requires a SEP?** Major protocol changes, new features, breaking changes
- **Process:** See [docs/sep-guidelines.md](docs/sep-guidelines.md)
- **Discussion:** Start with a GitHub Discussion or Issue before creating a SEP

---

## Required Updates for All Changes

Every PR **must** include, as appropriate:

- [ ] **OpenAPI / JSON Schema**: Update or add to `spec/openapi/` and `spec/json-schema/` as needed.
- [ ] **Examples**: Add or update sample requests/responses in `examples/`.
- [ ] **Changelog**: Add a changelog entry file to `changelog/unreleased/` describing your change.
  - Create a new file: `changelog/unreleased/your-change-description.md`
  - Follow the format shown in the Changelog Workflow section above
- [ ] **Documentation**: Update `README.md` or relevant RFCs if behavior or usage changes.
- [ ] **CLA**: Ensure you have signed the appropriate CLA.

---

## Code of Conduct

- Be respectful and constructive in all communications.
- Assume good intent and work collaboratively.
- Report unacceptable behavior to the maintainers listed in [MAINTAINERS.md](MAINTAINERS.md).

Full Code of Conduct: [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

---

## Getting Help

- **Questions:** Open a [GitHub Discussion](https://github.com/agentic-commerce-protocol/agentic-commerce-protocol/discussions)
- **Bugs:** Create an issue using the Bug Report template
- **Features:** Create an issue using the Feature Request template
- **SEPs:** See [docs/sep-guidelines.md](docs/sep-guidelines.md)
- **Urgent matters:** Contact a lead maintainer (see [MAINTAINERS.md](MAINTAINERS.md))

We're here to help make your contribution experience great! Don't hesitate to reach out if you're unsure about anything.

---

## Project Governance

ACP is governed by Stripe and OpenAI as Founding Maintainers. Learn more:

- [Governance Model](docs/governance.md)
- [Project Principles](docs/principles-mission.md)
- [Maintainers](MAINTAINERS.md)

---

Thank you for helping make ACP better! 🎉

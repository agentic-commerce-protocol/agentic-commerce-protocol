# Agentic Commerce Protocol (ACP) Governance

## Overview

The **Agentic Commerce Protocol (ACP)** is an interaction model and open
standard for connecting buyers, their AI agents, and businesses to complete
purchases seamlessly. ACP's governance is inspired by the Model Context Protocol
(MCP) (https://modelcontextprotocol.io/community/governance) and similar
open-source standards projects such as PyTorch and Python. ACP's governance is
designed to ensure clear decision-making, transparent evolution of the
specification, and a stable foundation for long-term stewardship as the protocol
matures.

---

## Governance Structure

ACP operates under a two-tier governance model. Collectively these are known as
"The Stewards". All Stewards agree to act and make decisions in accordance with
the [ACP Principles](./principles-mission.md#core-principles).

1. **Founding Maintainers**: Entities (OpenAI and Stripe) that hold final
   decision-making authority for the specification.
2. **Maintainers (Future Tier)**: Organizations admitted in future governance
   revisions. Their membership structure and onboarding criteria will be defined
   as the ecosystem matures.

### Founding Maintainers

The **Founding Maintainers** serve as the primary stewards of the ACP project.
This tier is composed of the following organizations:

- **OpenAI** - represented by Aravind Rao, Bhavin Modi and Riley Strong
- **Stripe** - represented by Bharath Srivatsan, Prasad Wangikar, Steve Kaliski

The Founding Maintainers are co-equal. Together, they are jointly responsible
for approving all substantive specification changes, including Specification
Enhancement Proposals (SEPs), and maintaining the long-term vision and integrity
of ACP.

Each Founding Maintainer may designate a representative to act on its behalf in
day-to-day governance discussions and may change it at any time unilaterally.
The Founding Maintainers are responsible for:

- Stewarding the overall direction and integrity of ACP.
- Reviewing and approving all SEPs and governance changes.
- Appointing and recognizing future maintainers.

Decisions by the Founding Maintainers must be **unanimous** to be adopted.

### Maintainers (Future Tier)

A tier of **Maintainers** will be established as the ACP ecosystem grows. This
tier will primarily consist of **organizations** (rather than individuals)
representing diverse stakeholders in commerce, payments, and AI agent
ecosystems. The creation process, membership criteria, and voting procedures for
Maintainers will be defined in a future governance revision. Until that time,
the Founding Maintainers retain all formal governance authority.

---

## Decision-Making and SEPs

### Types of Changes

There are three categories of changes within the ACP project:

1. **Major Changes (Require SEPs)**: Any substantial, complex or controversial
   change to the protocol shall be considered a Major Change. These must follow
   the SEP process described below. Some examples of Major Changes:

- Adding, modifying, or removing features in the specification (e.g., new API
  endpoints, messages, or data structures).
- Significant changes to how the specification is defined, presented, or
  validated.
- Breaking changes that are not backwards-compatible.
- Complex or controversial topics that require community discussion.

2. **Process Changes (Require SEPs)**: Adjustments to how the project itself is
   governed (including amending this document) or its processes shall be
   considered a Process Change. This includes updates to governance roles or
   responsibilities, decision-making rules, contributor processes, or other
   structural revisions. These are non-technical but still significant changes
   that also require a SEP to ensure transparency and consensus.

3. **Minor Changes (Do Not Require SEPs)**: Minor or operational updates that do
   not materially alter the protocol nor governance structure do not require
   SEPs. These may be merged following normal pull request processes and
   approval by a Steward (other than the individual author). Approval by an
   individual from the same organization as the author is explicitly allowed for
   the sake of speed and efficiency. Some examples of Minor Changes:

- Documentation fixes or editorial clarifications
- Simple bugfixes
- Minor enum or data changes to support additional participants
- Tooling improvements

### Specification Enhancement Proposals (SEPs)

ACP follows a simplified version of the MCP SEP process. SEPs are design
documents describing proposed changes or extensions to the ACP specification.
Refer to the [SEP Guidelines](./sep-guidelines.md). All SEPs, Major Changes and
Process Changes require **unanimous approval** from Founding Maintainers. Either
may delegate day-to-day review authority on SEPs to designated representatives,
but final approval must be explicit and recorded publicly.

---

## Future Evolution and Neutral Governance

The Founding Maintainers recognize the long-term goal of transitioning ACP
governance to a neutral foundation, similar to models used by the Linux
Foundation or OpenJS Foundation. Before a full transition to a neutral
foundation, the project will first formalize the creation and operation of the
Maintainers tier. This intermediate phase will expand representation, establish
voting and sponsorship mechanisms, and help test shared governance models prior
to establishing a permanent foundation. A full transition to a neutral
foundation will be taken up by the Founding Maintainers when:

- A healthy and active community has developed under the stewardship of the
  Maintainers tier, demonstrating consistent participation and collaboration;
- ACP achieves broad adoption across independent stakeholders;
- Sufficient community and institutional participation exists to sustain
  multi-party governance; and
- Legal and structural frameworks are in place to ensure neutrality and
  continuity.

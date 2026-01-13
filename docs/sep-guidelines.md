# SEP Guidelines

- This document is heavily based on the
  [MCP SEP process](https://modelcontextprotocol.io/community/sep-guidelines),
  adapted for ACP.

> Specification Enhancement Proposal (SEP) guidelines for proposing changes to
> the Agentic Commerce Protocol

## What is a SEP?

SEP stands for Specification Enhancement Proposal. A SEP is a design document
providing information to the ACP community, or describing a new feature for the
Agentic Commerce Protocol or its processes or environment. The SEP should
provide a concise technical specification of the feature and a rationale for the
feature. We intend SEPs to be the primary mechanisms for proposing major new
features, for collecting community input on an issue, and for documenting the
design decisions that have gone into ACP. The SEP author is responsible for
building consensus within the community and documenting dissenting opinions.
Because the SEPs are maintained as text files in a versioned repository (GitHub
Issues), their revision history is the historical record of the feature
proposal.

## What qualifies a SEP?

The goal is to reserve the SEP process for changes that are substantial enough
to require broad community discussion, a formal design document, and a
historical record of the decision-making process. A regular GitHub issue or pull
request is often more appropriate for smaller, more direct changes. Consider
proposing a SEP if your change involves any of the following:

- **A New Feature or Protocol Change**: Any change that adds, modifies, or
  removes features in the Agentic Commerce Protocol. This includes:
- Adding new API endpoints or methods.
- Changing the syntax or semantics of existing data structures or messages.
- Introducing a new standard for interoperability between different
  ACP-compatible tools.
- Significant changes to how the specification itself is defined, presented, or
  validated.
- **A Breaking Change**: Any change that is not backwards-compatible.
- **A Change to Governance or Process**: Any proposal that alters the project's
  decision- making, contribution guidelines (like this document itself).
- **A Complex or Controversial Topic**: If a change is likely to have multiple
  valid solutions or generate significant debate, the SEP process provides the
  necessary framework to explore alternatives, document the rationale, and build
  community consensus before implementation begins.

## SEP Types

ACP recognizes **two kinds of SEPs**:

1. **Major Changes (Require SEPs)** - Any substantial, complex, or controversial
   change to the ACP specification. Examples include:

- Adding, modifying, or removing features in the specification.
- Significant changes to how the specification is defined, presented, or
  validated.
- Breaking changes that are not backwards-compatible.
- Complex or controversial protocol topics requiring community discussion.

2. **Process Changes (Require SEPs)** - Adjustments to how the project is
   governed or how core processes operate. This includes changes to governance
   roles, responsibilities, decision-making rules, contributor processes, or any
   structural revisions to the project itself.

## Submitting a SEP

The SEP process begins with a new idea for the Agentic Commerce Protocol. It is
highly recommended that a single SEP contain a single key proposal or new idea.
Small enhancements or patches often don't need a SEP and can be injected into
the ACP development workflow with a pull request to the ACP repo. The more
focused the SEP, the more successful it tends to be.

Each SEP must have an **SEP author** -- someone who writes the SEP using the
style and format described below, shepherds the discussions in the appropriate
forums, and attempts to build community consensus around the idea. The SEP
author should first attempt to ascertain whether the idea is SEP-able. Posting
to the ACP community forums (Discord, GitHub Discussions) is the best way to go
about this.

### SEP Workflow

SEPs should be submitted as a GitHub Issue in the
[primary repository](https://github.com/agentic-commerce-protocol/agentic-commerce-protocol).
The standard SEP workflow is:

1. You, the SEP author, create a well-formatted GitHub Issue with the `SEP` and
   `proposal` tags. The SEP number is the same as the GitHub Issue number, the
   two can be used interchangeably.
2. Find a Founding Maintainer or Maintainer (future tier) to sponsor your
   proposal. Founding Maintainers and Maintainers will regularly go over the
   list of open proposals to determine which proposals to sponsor.
3. Once a sponsor is found, the GitHub Issue is assigned to the sponsor. The
   sponsor will add the `draft` tag, ensure the SEP number is in the title, and
   assign a milestone.
4. The sponsor will informally review the proposal and may request changes based
   on community feedback. When ready for formal review, the sponsor will add the
   `in-review` tag.
5. After the `in-review` tag is added, the SEP enters formal review by the
   Founding Maintainers team. The SEP may be accepted, rejected, or returned for
   revision.
6. If the SEP has not found a sponsor within three months, Founding Maintainers
   may close the SEP as `dormant`.

### SEP Format

Each SEP should have the following parts:

1. **Preamble** -- A short descriptive title, the names and contact info for
   each author, the current status.
2. **Abstract** -- A short (~200 word) description of the technical / process
   issue being addressed.
3. **Motivation** -- The motivation should clearly explain why the existing
   protocol specification is inadequate to address the problem that the SEP
   solves. The motivation is critical for SEPs that want to change the Agentic
   Commerce Protocol. SEP submissions without sufficient motivation may be
   rejected outright.
4. **Specification** -- The technical specification should describe the syntax
   and semantics of any new protocol feature. The specification should be
   detailed enough to allow competing, interoperable implementations. A PR with
   the changes to the specification should be provided.
5. **Rationale** -- The rationale explains why particular design decisions were
   made. It should describe alternate designs that were considered and related
   work. The rationale should provide evidence of consensus within the community
   and discuss important objections or concerns raised during discussion.
6. **Backward Compatibility** -- All SEPs that introduce backward
   incompatibilities must include a section describing these incompatibilities
   and their severity. The SEP must explain how the author proposes to deal with
   these incompatibilities.
7. **Reference Implementation** -- The reference implementation must be
   completed before any SEP is given status "Final", but it need not be
   completed before the SEP is accepted. While there is merit to the approach of
   reaching consensus on the specification and rationale before writing code,
   the principle of "rough consensus and running code" is still useful when it
   comes to resolving many discussions of protocol details.
8. **Security Implications** -- If there are security concerns in relation to
   the SEP, those concerns should be explicitly written out to make sure
   reviewers of the SEP are aware of them.

### SEP States

SEPs can be one of the following states:

- `proposal`: SEP proposal without a sponsor.
- `draft`: SEP proposal with a sponsor.
- `in-review`: SEP proposal ready for review.
- `accepted`: SEP accepted by Founding Maintainers, but still requires final
  wording and reference implementation.
- `rejected`: SEP rejected by Founding Maintainers.
- `withdrawn`: SEP withdrawn.
- `final`: SEP finalized.
- `superseded`: SEP has been replaced by a newer SEP.
- `dormant`: SEP that has not found sponsors and was subsequently closed.

### SEP Review & Resolution

SEPs are reviewed by the ACP Founding Maintainers team on a bi-weekly basis.

For a SEP to be accepted it must meet certain minimum criteria:

- A prototype implementation demonstrating the proposal
- Clear benefit to the ACP ecosystem
- Community support and consensus

Once a SEP has been accepted, the reference implementation must be completed.
When the reference implementation is complete and incorporated into the main
source code repository, the status will be changed to "Final".

A SEP can also be "Rejected" or "Withdrawn". A SEP that is "Withdrawn" may be
re-submitted at a later date.

## Reporting SEP Bugs, or Submitting SEP Updates

How you report a bug, or submit a SEP update depends on several factors, such as
the maturity of the SEP, the preferences of the SEP author, and the nature of
your comments. For SEPs not yet reaching `final` state, it's probably best to
send your comments and changes directly to the SEP author. Once SEP is
finalized, you may want to submit corrections as a GitHub comment on the issue
or pull request to the reference implementation.

## Transferring SEP Ownership

It occasionally becomes necessary to transfer ownership of SEPs to a new SEP
author. In general, we'd like to retain the original author as a co-author of
the transferred SEP, but that's really up to the original author. A good reason
to transfer ownership is because the original author no longer has the time or
interest in updating it or following through with the SEP process, or has fallen
off the face of the 'net (i.e. is unreachable or not responding to email). A bad
reason to transfer ownership is because you don't agree with the direction of
the SEP. We try to build consensus around a SEP, but if that's not possible, you
can always submit a competing SEP.

# Agentic Commerce Protocol (ACP) Governance

## Overview

The **Agentic Commerce Protocol (ACP)** is an interaction model and open
standard for connecting buyers, their AI agents, and businesses to complete
purchases seamlessly. ACP's governance is designed to ensure clear
decision-making, transparent evolution of the specification, and a stable
foundation for long-term stewardship as the protocol matures.

---

## Shared Principles

ACP exists to promote open, secure, and interoperable commerce between agents,
payment providers, and sellers. All TSC members, including the Founding
Maintainers, commit to upholding the following principles. These serve as the
foundation for all governance decisions and the basis under which the Founding
Maintainers' veto authority may be exercised as a last resort.

1. **Mission Protection:** Decisions must not materially undermine ACP's core
   mission of advancing open, secure, and interoperable agent-driven commerce.

2. **Neutrality Protection:** Decisions must not privilege a specific vendor,
   platform, or payment provider in a way that harms neutrality.

3. **Security and Safety:** Changes must not introduce systemic security, fraud,
   or safety risks.

4. **Protocol Integrity:** Changes must not fracture the standard or create
   incompatible forks.

5. **Considered Decision-Making:** Particularly contentious decisions need more
   time to bake and gain community consensus, even if they may pass the TSC.

---

## The Technical Steering Committee (TSC)

The TSC is the central governing body responsible for the protocol's evolution,
specification maintenance, and technical integrity. It serves as the
decision-making authority for all matters relating to the ACP standard.

### Composition and Structure

The TSC has up to 7 seats. Each seat is held by one organization, including
OpenAI and Stripe.

Seats are filled incrementally as qualified contributors emerge.

### Membership Criteria

TSC seats are appointed by the Founding Maintainers (OpenAI and Stripe) based
on the following criteria:

1. **Shared Vision:** A demonstrated commitment to advancing agent-driven
   commerce and taking the ACP standard to the next level. Candidates must align
   with ACP's mission and long-term direction.

2. **Contributions:** A visible track record of meaningful contributions to the
   ACP repository. This includes authoring or co-authoring merged Pull Requests,
   proposing Specification Enhancement Proposals (SEPs), and/or actively
   participating in discussions by commenting, reviewing, and expressing
   technical opinions.

3. **Time Commitment:** Members are expected to dedicate a few hours per week to
   TSC responsibilities and to actively engage in weekly meetings.

The TSC reviews membership quarterly.

### Joining the TSC

Organizations interested in joining the TSC should reach out to anyone from the
TSC or Founding Maintainers for more details on the process.

### Member Expectations

- Dedicate a few hours weekly to the review of Pull Requests and SEPs.
- Actively participate in weekly TSC meetings.
- Drive discussions and provide technical guidance across official community
  channels (Discord, GitHub).
- Guide and support Domain Working Groups (DWGs) where relevant.

### Strategic Value of Membership

- Direct influence on the standards governing how AI agents interact with global
  commerce.
- Member organization logos featured on the ACP homepage and official
  documentation.
- Members may formally use the title: "Member of the ACP Technical Steering
  Committee."
- Weekly collaboration alongside technical leads from the ACP ecosystem.

### Current TSC Members

| Seat | Organization | Representative(s) |
|------|-------------|-------------------|
| 1    | OpenAI      | aravindrao-openai |
| 2    | Stripe      | prasad-stripe     |
| 3    | Meta        | lhwa              |

---

## Domain Working Groups (DWGs)

Domain Working Groups are community-driven groups focused on adapting and
extending ACP for specific industry verticals or technical domains (e.g.,
Travel, Fitness & Wellness, Grocery Delivery, Donations).

### Formation

DWGs operate outside the core TSC but require formal recognition to carry
governance weight. Any group of contributors may self-organize around a domain,
but to be recognized as an official DWG they must:

- Include members from at least two distinct organizations.
- Submit a proposal to the TSC outlining the group's scope, goals, and initial
  membership.

The TSC votes to approve or reject the proposal by simple majority.

### Autonomy

Once officially recognized, a DWG operates with a high degree of autonomy. Each
group defines its own cadence, operating norms, and the specific problems it
aims to address. Leadership within the group is self-organizing — domain experts
are expected to emerge naturally based on the work itself.

### Relationship to the TSC

- DWGs are expected to surface new features or changes back to the TSC as SEPs,
  which follow the standard SEP review and voting process.
- For standard PRs within a DWG's domain, one approval from a recognized DWG
  member counts toward the two approvals required for merging.

### Strategic Value of DWG Membership

- Shape how ACP is applied within your industry, ensuring the standard meets the
  real-world needs of your domain.
- Establish your organization as a recognized domain authority within the ACP
  ecosystem.
- DWG member organizations are listed on the ACP website under their respective
  working group.
- Gain direct input into SEPs that affect your vertical before they reach the
  broader TSC vote.
- Collaborate with peers across your industry to solve shared challenges around
  agent-driven commerce.

---

## The Technical Review Process

### Standard Pull Requests (Non-SEP)

Regular PRs that do not require a SEP can be approved by any member of the TSC.
Merging requires a minimum of two approvals from TSC members. One approval from
a recognized DWG member counts toward the two approvals required for merging PRs
within that group's domain.

### Specification Enhancement Proposals (SEPs)

SEPs are the mechanism for proposing significant changes to the ACP
specification. All SEPs are decided by a vote of the TSC. Refer to the
[SEP Guidelines](./sep-guidelines.md).

The SEP lifecycle:

1. **Sponsorship:** Every SEP must be sponsored by a TSC member to proceed. The
   sponsor is responsible for shepherding the proposal through the review
   process.

2. **Community Review:** Once sponsored, a mandatory 7-business-day public
   review window is opened for feedback and technical scrutiny. This review
   period must span across at least one instance of the weekly TSC meeting.

3. **TSC Weekly Meeting:** The TSC holds a weekly 30-minute meeting dedicated to
   discussing, debating, and voting on pending SEPs. Members who cannot attend
   may express their votes or feedback asynchronously before or after the
   meeting.

4. **Voting:** SEPs are adopted or rejected by a simple majority vote (50%+1) of
   the TSC.

### Types of Changes

There are three categories of changes within the ACP project:

1. **Major Changes (Require SEPs)**: Any substantial, complex or controversial
   change to the protocol shall be considered a Major Change. These must follow
   the SEP process described above. Some examples of Major Changes:

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
   SEPs. These may be merged following the standard pull request process with
   two approvals. Some examples of Minor Changes:

- Documentation fixes or editorial clarifications
- Simple bugfixes
- Minor enum or data changes to support additional participants
- Tooling improvements

**Pull Request Templates**: Contributors should use the appropriate PR template
when submitting changes:
- Major and Process Changes: Use [sep-proposal.md](../.github/PULL_REQUEST_TEMPLATE/sep-proposal.md)
- Minor Changes: Use [minor-improvement.md](../.github/PULL_REQUEST_TEMPLATE/minor-improvement.md)
- Administrative Changes (admins only): Use [admin.md](../.github/PULL_REQUEST_TEMPLATE/admin.md) — for CLA signatory additions, Schedule A updates, and other corporate housekeeping. Title must start with `ADMIN:`.
- Releases (admins only): Use [release.md](../.github/PULL_REQUEST_TEMPLATE/release.md) — for promoting unreleased specs, examples, and changelog entries to a dated version. Title must start with `RELEASE:`.

---

## The Founding Maintainers

OpenAI and Stripe are the Founding Maintainers of ACP. Their role is to steward
the early growth of the protocol and its governance structures.

### Responsibilities

- Appoint and remove TSC members based on the published membership criteria.
- Ensure the protocol's long-term coherence, security, and alignment with its
  founding mission.
- Each holds one seat on the TSC with the same voting rights as any other
  member.

### Governance Evolution

The Founding Maintainers' appointment authority is intended as a transitional
mechanism for the protocol's early stages. As the TSC matures and the
contributor base grows, this structure is expected to evolve toward broader
participation and shared ownership of governance decisions.

### Founding Maintainers' Reserve Authority

In order to safeguard the core principles of ACP — including neutrality,
openness, and the integrity of the standard — the Founding Maintainers (OpenAI
and Stripe) reserve a limited veto authority over TSC decisions. This authority
exists solely to protect the protocol from outcomes that could compromise its
foundational mission, such as changes that disproportionately favor a single
member, introduce conflicts of interest, or undermine the trust and fairness the
ecosystem is built on. This veto is expected to be exercised in extremely rare
situations and is not intended for day-to-day governance. The Founding
Maintainers remain committed to working within the TSC process, and any exercise
of this authority will be accompanied by a clear, written explanation shared
with the full TSC.

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

---

## Frequently Asked Questions

**Q: What is expected of organizations in a TSC member role?**

A: The primary expectation is active contribution to the development and success
of the protocol. This means authoring and reviewing PRs and SEPs, participating
in meetings, and helping advance the standard. This expectation applies equally
to all participants, regardless of size, market position, or existing
relationships with other contributors.

**Q: Can TSC members or contributors also participate in other competing or complementary protocols?**

A: Yes. There are no restrictions against working with other protocols.
Participants remain free to engage with any competing or complementary protocols
simultaneously.

**Q: What does "launch" mean for the TSC?**

A: Launch is the public announcement of the ACP governance model along with the
initial set of TSC members. The governance structure goes into effect at that
point, though not all 7 seats need to be filled. Remaining seats will be filled
over time as contributors meet the membership criteria.

**Q: How many TSC seats will be filled at launch?**

A: The exact number will depend on how many partners meet the membership
criteria ahead of the launch date.

**Q: What if a partner is hesitant to contribute because there's no guarantee of a TSC seat?**

A: We understand this is a chicken-and-egg situation. Let's work closely with
interested partners, make it clear that we want them at the table, and help them
land their first contributions. The goal is to onboard committed partners, not
to gatekeep.

**Q: Does the TSC only have room for large, well-known companies?**

A: Having recognizable names on the TSC matters for the credibility and
visibility of the standard, but the TSC is not limited to big logos. Seats are
earned through contributions and commitment. Smaller organizations that are
making strong contributions will be considered on a case-by-case basis. And even
outside the TSC, there are meaningful leadership opportunities within Domain
Working Groups where any contributor can make a significant impact.

**Q: How are contributions and proposals prioritized?**

A: Contributions that advance and expand protocol usage are prioritized based on
transparent, objective criteria. The protocol takes a strong stance on economic
incentives, user experience, and fraud prevention. Governance decisions are
applied consistently across all participants — no single organization receives
preferential treatment in how proposals are evaluated or adopted.

**Q: Can a TSC member lose their seat?**

A: Yes. Membership is reviewed quarterly. If a member organization is no longer
meeting the expectations: not engaging in meetings, not reviewing PRs or SEPs,
or not actively contributing — the TSC will first reach out and ask the
organization to re-commit. If engagement doesn't improve, the TSC may revisit
their seat. Members may also choose to step down voluntarily if their priorities
shift. The intent is not to be punitive, but to ensure every seat is held by
someone who is actively driving the standard forward.

**Q: Can anyone start a Domain Working Group?**

A: Yes, any group of contributors can self-organize around a domain. However, to
be officially recognized as a DWG — and for their approvals to carry weight in
the review process — the group must include members from at least two distinct
organizations and submit a proposal to the TSC for approval.

**Q: Can an organization hold a seat on both the TSC and a DWG?**

A: Yes. TSC membership and DWG participation are independent. An organization on
the TSC can also have representatives active in one or more DWGs. In fact, this
is encouraged — it helps ensure alignment between the core governance and
domain-specific work.

**Q: What if two DWGs propose conflicting changes to the specification?**

A: All changes to the specification ultimately go through the SEP process and
are voted on by the TSC. If two DWGs propose conflicting approaches, the TSC
will facilitate discussion between the groups during the review period and the
weekly meeting. The TSC vote determines which direction is adopted, ensuring
consistency across the protocol.

**Q: Who represents an organization on the TSC — is it always the same person?**

A: Each organization holds one seat, but the individual representing that
organization may change. It is up to the member organization to designate their
representative. We ask that organizations maintain consistency where possible so
that context and relationships are preserved, but understand that personnel
changes happen.

**Q: Is there a cost or fee associated with joining the TSC or a DWG?**

A: No. There are no membership fees. Participation in the TSC and DWGs is earned
through contributions and commitment, not financial investment. The only cost is
the time and effort to actively engage.

**Q: What happens if the TSC can't reach a majority on a SEP?**

A: Every SEP is decided by a simple majority vote. If a proposal doesn't pass by
(50%+1) vote, the author and sponsor are welcome to revise it based on the
feedback and resubmit.

**Q: Can someone contribute to ACP without being on the TSC or a DWG?**

A: Absolutely. ACP is an open standard and anyone can contribute by opening Pull
Requests, proposing SEPs, participating in discussions on GitHub and Discord, or
building implementations. As long as the Contributor License Agreement (CLA) is
signed and the code of conduct is followed, contributions are welcome from the
entire community. The TSC and DWGs are governance structures for decision-making,
not gatekeepers of contribution.

**Q: How does the TSC handle disagreements between members?**

A: All major decisions go through the SEP process with a mandatory
7-business-day review period and a weekly meeting for discussion. This gives
every member time to voice concerns and work through differences. When it comes
to a vote, a simple majority decides. The process is designed to encourage open
debate while keeping things moving forward.

**Q: What behavior is not allowed within ACP governance?**

A: ACP governance is built on mutual respect and fair play. The following are not
permitted:

- Using ACP channels or governance forums for product marketing or
  self-promotion.
- Making direct comparisons between competing products or services within ACP
  discussions.
- Pushing or pressuring the direction of the protocol to disproportionately
  favor any single member or organization.
- Blocking or stalling proposals to disadvantage a competitor.
- Using a TSC or DWG seat to gain unfair competitive intelligence.
- Misrepresenting ACP affiliation or governance roles for commercial advantage.

All participants are expected to engage in good faith, with the shared goal of
advancing the standard for the benefit of the entire ecosystem. A revised code
of conduct and detailed guidelines tailored for the TSC will be published ahead
of launch.

**Q: Under what circumstances would the Founding Maintainers use their veto?**

A: The veto is a last resort, reserved for situations that threaten the
foundational principles of the protocol. These include: decisions that materially
undermine ACPs core mission, changes that privilege a specific vendor to platform
at the expense of neutrality, changes that introduce systemic security, fraud or
safety risks, changes that fracture the standard into incompatible forks and
particularly contentious decisions that need more time to make and gain broader
consensus, even if they have enough votes to pass in TSC

**Q: Can the veto be used to push through a change that the TSC has rejected?**

A: No. The veto can only be used to block a change, never to override the TSC
and force one through. If the Founding Mainterners want to see a change adopted,
they advocate for it through the same TSC process as everyone else.

**Q: What does a veto scenario look like in practice?**

A: For illustrative purposes: imagine the TSC adopts a change that requires all
ACP implementations to depend on a proprietary API controlled by a single
company. This would compromise the neutrality of the protocol and could be
vetoed. Or suppose a specification change is adopted that exposes agents
directly to raw payment credentials, significantly increasing PCI scope for all
participants, that's a systematic safety risk worth blocking. These are extreme
scenarios, and the expectation is that most concerns like these would be resolved
through normal TSC discussion well before a veto is ever considered.

**Q: What happens after a veto is exercised?**

A: A veto does not kill a proposal permanently. It pauses the change and sends
it back to the TSC for further discussion. The Founding Maintainers must provide
a clear, written explanation for the veto. The proposal author and sponsor are
welcome to revise and resubmit the proposal based on the feedback. The goal is
to reach a better outcome, not to shut down the conversation.

**Q: Does the veto authority apply to all TSC decisions or only SEPs?**

A: It applies to only SEPs. It does not apply to routine operational decisions,
standard PRs, DWG formation or day-to-day governance matters. Those remain fully
within the TSC's authority.

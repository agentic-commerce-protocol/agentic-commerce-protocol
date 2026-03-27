# TSC Operating Model

This document defines the day-to-day operating cadence of the ACP Technical
Steering Committee. It complements the [Governance Model](./governance.md) and
[SEP Guidelines](./sep-guidelines.md).

---

## Weekly Meeting

- **Day:** Thursday (time TBD)
- **Duration:** 30 minutes
- **Who:** All TSC member organizations must attend or send a designated
  representative.
- **Agenda:** Published to the `#tsc-meetings` Discord channel at least 24 hours
  before the meeting. Any TSC member may add items.
- **Format:**
  1. Triage handoff — outgoing triage lead summarizes the week's ingress.
  2. SEP review — discuss and vote on any SEPs in the `in-review` state.
  3. Open discussion — PRs, DWG updates, and any other business.
- **Async participation:** Members who cannot attend may submit votes or feedback
  on the agenda thread before or after the meeting.

---

## Triage Rotation

Each week, one TSC member organization serves as the **triage lead**. The
rotation cycles through all TSC member organizations in seat order and
transitions at the start of the weekly Thursday meeting.

### Triage Lead Responsibilities

1. **Monitor ingress.** Review all new GitHub Issues, Pull Requests, and SEP
   proposals that arrive during the week.
2. **Provide initial response.** Leave an initial comment acknowledging receipt,
   tagging relevant reviewers, and labeling appropriately within 2 business days.
3. **Surface to the TSC.** Add noteworthy items to the next weekly meeting agenda
   so the full TSC can discuss and prioritize them.
4. **Hand off cleanly.** At the Thursday meeting, brief the incoming triage lead
   on anything still open or pending.

The rotation schedule will be maintained in a pinned post on Discord and updated
as new members join the TSC.

---

## Communication Channels

| Channel              | Purpose                                              |
|----------------------|------------------------------------------------------|
| **[Discord](https://discord.gg/53k84htnJ)** | Real-time coordination, triage discussion, community Q&A |
| **GitHub Issues/PRs**| Formal proposals, code review, SEP lifecycle         |
| **GitHub Discussions**| Open-ended technical discussion and ideation         |
| **Weekly Meeting**   | Decision-making, SEP votes, triage handoff           |

### Discord Structure

| Channel              | Purpose                                              |
|----------------------|------------------------------------------------------|
| `#announcements`     | Read-only. Releases, SEP outcomes, governance updates. |
| `#general`           | Open community discussion.                           |
| `#tsc-meetings`      | Meeting agendas, notes, and recordings.              |
| `#technical-steering-committee` | SEP ideation, review announcements, and TSC discussion. |
| `#triage`            | Active triage thread for the current rotation lead.  |
| `#working-groups`    | DWG coordination (per-DWG channels as groups form).  |

---

## SEP Lifecycle (Operational View)

This is the week-to-week flow; see [SEP Guidelines](./sep-guidelines.md) for
the full process.

1. **Ingress** — New SEP filed as a GitHub Issue with `SEP` and `proposal` tags.
   The triage lead acknowledges and flags it to the TSC.
2. **Sponsorship** — A TSC member sponsors the SEP, adds the `draft` tag, and
   assigns a milestone.
3. **Community Review** — Sponsor moves the SEP to `in-review`. A mandatory
   7-business-day review window opens, spanning at least one weekly meeting.
   The sponsor posts a notice to `#technical-steering-committee` on Discord
   with a summary and a link to the GitHub Issue so the broader community
   can provide feedback.
4. **TSC Vote** — The SEP is discussed at the weekly meeting and decided by
   simple majority (50%+1).
5. **Resolution** — Accepted SEPs move to implementation; rejected SEPs may be
   revised and resubmitted.

---

## Membership Review

TSC membership is reviewed quarterly. Organizations that are consistently absent
from meetings and not contributing to triage, reviews, or discussions may be
asked to re-commit or step down per the [Governance Model](./governance.md).

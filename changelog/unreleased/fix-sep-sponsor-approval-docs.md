## Fix SEP sponsor/approval language in docs to match governance.md

`docs/sep-guidelines.md` and `.github/PULL_REQUEST_TEMPLATE/sep-proposal.md` described the SEP sponsor and approval process in terms of "Founding Maintainers," while `docs/governance.md` defines Founding Maintainers as a distinct, two-seat role (OpenAI and Stripe) separate from the seven-seat TSC that `governance.md` actually assigns SEP sponsorship, review, and voting to. The two docs disagreed with each other and with `governance.md` on who sponsors a SEP, how it's reviewed, and what the approval bar is (bi-weekly Founding Maintainer review vs. weekly TSC meeting; unanimous Founding Maintainer approval vs. simple majority TSC vote).

This is an editorial/documentation-consistency fix — no change to `governance.md` itself, which already states the TSC-based process correctly.

### Changes
- **docs/sep-guidelines.md**: Sponsor is a TSC member (not "Founding Maintainer or Maintainer"); SEP review/voting happens at the TSC's weekly meeting with a simple-majority vote, after the mandatory 7-business-day review window; `accepted`/`rejected` states attributed to the TSC
- **.github/PULL_REQUEST_TEMPLATE/sep-proposal.md**: Sponsor checkbox now says "(TSC member)"; closing note corrected from "unanimous approval from Founding Maintainers" to "simple majority vote (50%+1) of the TSC"

### Files Updated
- `docs/sep-guidelines.md`
- `.github/PULL_REQUEST_TEMPLATE/sep-proposal.md`

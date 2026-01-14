# Individual CLA Process - How It Works

This document explains how the Individual CLA signing process works for individual contributors.

## Overview

The Individual CLA process is fully automated using CLA Assistant. When you submit your first pull request, a bot will guide you through signing the CLA. The entire process takes less than a minute.

---

## Steps for Individual Contributors

### Step 1: Submit Your First Pull Request

**What to do:**
1. Fork the repository (if you haven't already)
2. Create a branch with your changes
3. Push your changes to your fork
4. Open a pull request to the main repository

**What happens automatically:**
- The CLA Assistant bot detects that you haven't signed the CLA yet
- The bot posts a comment on your PR within a few seconds
- The bot adds a failing status check named `cla/cla-assistant`

---

### Step 2: Review and Sign the CLA

**What to do:**
1. Read the bot's comment on your PR
2. Click the link provided by the bot
3. You'll be redirected to CLA Assistant's website
4. Review the Individual CLA terms
5. Click the **"I Agree"** or **"Sign"** button
6. Authenticate with your GitHub account if prompted

**What you're agreeing to:**

By signing the Individual CLA, you agree to:
- Grant copyright and patent licenses for your contributions
- Represent that your contributions are your original work
- Comply with the Apache 2.0 License terms

See the full text at: [INDIVIDUAL.md](INDIVIDUAL.md)

**Why this is required:**

Per Section 2.4 of the Collaboration and Governance Agreement dated November 21, 2025:

> "The Parties agree to adopt a process requiring all future third-party contributors to execute the Project CLA prior to the acceptance of their contributions."

The Individual CLA:
- Clarifies intellectual property rights
- Protects both you as a contributor and the project
- Ensures all contributions are properly licensed under Apache 2.0
- Is required before any contributions can be accepted

---

### Step 3: Confirmation

**What happens automatically after signing:**
- CLA Assistant records your signature
- The bot updates the PR with a confirmation comment
- The `cla/cla-assistant` status check changes to ✅ passing
- Your pull request can now be reviewed and merged

**Your signature covers:**
- All past contributions (if any were submitted before signing)
- All future contributions from your GitHub account
- Contributions to all branches and repositories covered by this CLA

You will **never need to sign again** for this project.

---

### Step 4: Future Contributions

**What to do:**
- Simply submit pull requests as normal
- No CLA signing required

**What happens automatically:**
- CLA Assistant recognizes your GitHub account
- The `cla/cla-assistant` check automatically passes
- No bot comments or signing prompts

---

## Special Cases

### If You're Contributing as Part of Your Job

**Important:** If you're contributing on behalf of your employer, your employer may own the intellectual property rights to your work.

**What to do:**

1. **Check with your employer** about their IP policies
2. **Two options:**
   - **Option A:** Your employer signs the [Corporate CLA](CORPORATE.md)
     - Your company creates a Corporate CLA issue
     - You're added to Schedule A of authorized contributors
     - You don't need to sign Individual CLA
   - **Option B:** Your employer gives you explicit permission
     - Get written permission to contribute
     - Sign the Individual CLA
     - Keep the permission documentation

**Why this matters:**

Per Section 4 of the Individual CLA:

> "If your employer(s) has rights to intellectual property that you create that includes your Contributions, you represent that you have received permission to make Contributions on behalf of that employer, that your employer has waived such rights for your Contributions to the ACP Project, or that your employer has executed a separate Corporate CLA with the ACP Project."

If your employer owns your work and hasn't signed a Corporate CLA or given permission, your Individual CLA signature may not be valid.

---

### If the CLA Bot Doesn't Comment

**Possible reasons:**

1. **You're already signed:** You signed the CLA on a previous PR
2. **You're on the allowlist:** Your company has signed a Corporate CLA
3. **Bot is down:** Rare, but possible (check https://www.cla-assistant.io/status)
4. **Configuration issue:** Contact a maintainer

**What to do:**
- Check if you've signed before: https://cla-assistant.io/agentic-commerce-protocol/agentic-commerce-protocol
- Check if your company is listed: [SIGNATORIES.md](SIGNATORIES.md)
- If neither, comment on your PR: `@cla-assistant check`
- If still no response, contact maintainers

---

### If You Need to Update Your Signature

**Scenarios:**
- You changed your legal name
- You need to update your email address
- You want to withdraw your signature

**What to do:**
- Contact the project maintainers via GitHub Discussions
- Explain your situation
- Maintainers will work with you to resolve the issue

**Note:** You cannot "unsign" the CLA for contributions that have already been accepted, as the licenses granted are irrevocable per Section 2 and 3 of the CLA.

---

### If You're Contributing Someone Else's Work

**Important:** The CLA covers **your original work only**.

Per Section 7 of the Individual CLA:

> "Should You wish to submit work that is not Your original creation, You may submit it to the ACP Project separately from any Contribution, identifying the complete details of its source and of any license or other restriction (including, but not limited to, related patents, trademarks, and license agreements) of which you are personally aware, and conspicuously marking the work as 'Submitted on behalf of a third-party: [named here]'."

**What to do:**
1. **Do not include** third-party code in your normal contributions
2. **Create a separate issue** explaining:
   - What the third-party work is
   - Who created it
   - What license it's under
   - Why you want to include it
3. **Mark it clearly** as third-party work
4. **Wait for maintainer approval** before including it

---

## How CLA Assistant Works (Technical Details)

### What CLA Assistant Does

**When a PR is opened:**
1. CLA Assistant checks if the PR author has signed the CLA
2. It queries its database of signatures
3. It checks if the author is on the repository's allowlist
4. It posts a GitHub status check result

**When you sign:**
1. Your GitHub username is recorded
2. Your signature timestamp is stored
3. The PR is automatically updated
4. All future PRs from your account are pre-approved

### Where Your Signature is Stored

- **Location:** CLA Assistant's database (external service)
- **Public record:** https://cla-assistant.io/agentic-commerce-protocol/agentic-commerce-protocol
- **Associated with:** Your GitHub username
- **Accessible by:** Project maintainers and the public

### What Information is Collected

When you sign the CLA, CLA Assistant records:
- ✅ Your GitHub username
- ✅ Timestamp of signature
- ✅ Which repository you signed for
- ❌ Your email (not collected)
- ❌ Your real name (unless in GitHub profile)
- ❌ Any other personal information

---

## Comparison: Individual CLA vs Corporate CLA

| Aspect | Individual CLA | Corporate CLA |
|--------|---------------|---------------|
| Who signs | You (the individual) | Your employer |
| Process | Fully automated | Manual (via GitHub issue) |
| Time required | < 1 minute | 5-10 minutes + review time |
| Covers | Only you | All authorized employees |
| IP ownership | You own your work | Company owns employees' work |
| Future employees | N/A | Can be added to Schedule A |
| When to use | Personal projects, hobby contributions | Contributing as part of your job |

**Which should you use?**

- **Individual CLA:** If you own your work (personal time, hobby projects, self-employed)
- **Corporate CLA:** If your employer owns your work (contributing as part of your job)

**When in doubt:** Ask your employer or sign Individual CLA (but be aware it may not be valid if your employer owns your IP)

---

## Frequently Asked Questions

### Do I need to sign for every repository?

No. The CLA is specific to the Agentic Commerce Protocol project. If you contribute to other projects, they may have their own CLAs.

### Can I contribute before signing?

No. Per the governance agreement, all contributions must be covered by a signed CLA before acceptance. The branch protection rules enforce this.

### What if I disagree with the CLA terms?

If you disagree with the CLA terms, you cannot contribute to the project. The CLA is required by the governance agreement and cannot be waived or modified for individual contributors.

### Is the CLA the same as the Apache 2.0 License?

No. They serve different purposes:
- **Apache 2.0 License:** Governs how users can use the software
- **CLA:** Governs how contributors license their contributions to the project

The CLA ensures that all contributions are properly licensed under Apache 2.0.

### Can I contribute anonymously?

No. The CLA requires a signature associated with your GitHub account. Your GitHub username will be publicly visible in the list of signatories.

### What if I'm a minor (under 18)?

If you're under 18, you may not have legal capacity to sign contracts in your jurisdiction. You should:
1. Check your local laws
2. Have a parent/guardian review the CLA
3. Consider having your parent/guardian sign on your behalf (contact maintainers)

### Does signing give away my copyright?

No. Per Section 2 of the CLA:

> "Subject to the terms and conditions of this Agreement, You hereby grant to the ACP Project and to recipients of software distributed by the ACP Project a perpetual, worldwide, non-exclusive, no-charge, royalty-free, irrevocable copyright license..."

You **grant a license**, but you **retain copyright**. You can still use your contributions for other purposes.

---

## Privacy and Data Protection

### What data is collected?

- Your GitHub username
- Timestamp of signature
- Repository you signed for

### Who can see this data?

- Project maintainers
- Anyone who visits the CLA Assistant page for this project
- The data is **publicly accessible**

### Can I delete my data?

Your signature is recorded permanently. However, you can contact maintainers if you have concerns about your data.

### GDPR and other privacy laws

CLA Assistant processes minimal personal data (GitHub username). If you have privacy concerns under GDPR or other laws, contact the maintainers.

---

## Troubleshooting

### "The CLA check is failing but I already signed"

**Possible causes:**
- Cache delay (wait a few minutes and refresh)
- You signed with a different GitHub account
- You signed for a different repository

**What to do:**
1. Check you're using the correct GitHub account
2. Verify you signed for this specific repository
3. Comment on the PR: `@cla-assistant check`
4. If still failing, contact maintainers

### "I can't access the CLA signing page"

**Possible causes:**
- CLA Assistant service is down
- Browser blocking cookies/JavaScript
- Network firewall blocking the site

**What to do:**
1. Check https://www.cla-assistant.io/status
2. Try a different browser
3. Disable browser extensions temporarily
4. Try from a different network
5. Contact maintainers if issues persist

### "I signed but my PR still can't be merged"

**Possible causes:**
- Other status checks are failing (not just CLA)
- Branch is not up to date
- You need to push new commits after signing

**What to do:**
1. Check all status checks on the PR (not just CLA)
2. Make sure your branch is up to date with main
3. Try pushing a new commit (even an empty commit) to trigger checks

---

## For Maintainers: Managing Individual CLA Signatures

### Viewing Signatures

All Individual CLA signatures are viewable at:
https://cla-assistant.io/agentic-commerce-protocol/agentic-commerce-protocol

Click on any username to see:
- When they signed
- Their GitHub profile
- All PRs from that user

### Removing a Signature

If you need to remove a signature (rare):
1. Go to CLA Assistant dashboard
2. Find the signature
3. Click "Remove"
4. Confirm the action

**Note:** Only remove signatures if:
- Requested by the contributor
- The signature was made in error
- Legal compliance requires it

### Manually Adding Signatures

You cannot manually add Individual CLA signatures. Contributors must sign through CLA Assistant.

For corporate contributors, use the allowlist instead (see [CORPORATE_PROCESS.md](CORPORATE_PROCESS.md)).

---

## Questions?

For questions about the Individual CLA process:
- Review the full CLA text: [INDIVIDUAL.md](INDIVIDUAL.md)
- Check the list of signatories: [SIGNATORIES.md](SIGNATORIES.md)
- Compare with Corporate CLA: [CORPORATE.md](CORPORATE.md)
- Ask in [GitHub Discussions](https://github.com/agentic-commerce-protocol/agentic-commerce-protocol/discussions)


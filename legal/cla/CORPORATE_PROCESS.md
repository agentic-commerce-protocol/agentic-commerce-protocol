# Corporate CLA Process - Manual Steps Required

This document explains the manual steps required for Corporate CLA signatories and the reasons these steps are necessary.

## Overview

Unlike Individual CLA signatures (which are fully automated via CLA Assistant), Corporate CLA signatures require some manual steps by both the signing organization and project maintainers. This document explains what needs to be done and why.

---

## Steps for Organizations Signing Corporate CLA

### Step 1: Create a GitHub Issue

**What to do:**
1. Go to https://github.com/agentic-commerce-protocol/agentic-commerce-protocol/issues
2. Click "New Issue"
3. Title: `Corporate CLA: [Your Company Name]`
4. Copy the template from [CORPORATE.md](CORPORATE.md) into the issue body
5. Fill in all required information:
   - Corporation name (legal entity name)
   - Corporation address (full legal address)
   - Point of Contact (authorized representative)
   - E-Mail (contact email)
   - Date (YYYY-MM-DD format)
   - Schedule A (list of GitHub usernames authorized to contribute)
   - Schedule B (leave blank unless contributing existing software)
   - Agreement statement with your signature, title, and date
6. Add labels: `cla` and `corporate-cla`
7. Submit the issue

**Why this is required:**

Per Section 2.4 of the Collaboration and Governance Agreement dated November 21, 2025:

> "The Parties agree to adopt a process requiring all future third-party contributors to execute the Project CLA prior to the acceptance of their contributions."

The Corporate CLA (Exhibit A-1) is a legal agreement that must be executed by an authorized representative of the corporation. Creating a GitHub issue provides:

- **Public record** of the agreement
- **Transparent process** visible to all project participants
- **Traceable history** of when and by whom the CLA was signed
- **Version control** for Schedule A updates (via issue comments)
- **No email burden** on maintainers (everything in one place)

The GitHub issue serves as the **electronic signature** and **legal record** of the Corporate CLA execution.

---

### Step 2: Wait for Maintainer Review

**What to do:**
- Monitor the GitHub issue for comments from maintainers
- Respond to any questions or requests for clarification
- Wait for the `cla-signed` label to be added

**Expected timeline:** Within 5 business days

**Why this is required:**

Maintainers must verify:
- The person signing has authority to bind the corporation
- All required information is provided
- GitHub usernames in Schedule A are valid
- The agreement terms are properly acknowledged

This review ensures legal compliance and protects both the project and the contributing organization.

---

### Step 3: Confirmation

**What to expect:**
- Maintainers will add the `cla-signed` label to your issue
- Maintainers will comment confirming acceptance
- Your company will be added to [SIGNATORIES.md](SIGNATORIES.md)
- Your authorized contributors will be added to the CLA Assistant allowlist
- The issue will be closed (but remains accessible)

**Why this is required:**

This confirmation:
- Officially records your company as a CLA signatory
- Enables your authorized contributors to submit PRs without individual CLA prompts
- Creates a permanent public record of the agreement

---

### Step 4: Updating Authorized Contributors (Ongoing)

**What to do when adding or removing authorized contributors:**

1. Go to your company's original CLA issue (it will be closed but you can still comment)
2. Add a comment with the updated Schedule A
3. Maintainers will update the CLA Assistant allowlist and SIGNATORIES.md
4. Maintainers will confirm the update with a comment

**Example comment format:**

​```
## Updated Schedule A

[Initial list of designated employees. NB: authorization is not tied to particular Contributions.]

- @user1 - Employee Name
- @user2 - Employee Name
- @user3 - Employee Name (ADDED)
- ~~@user4 - Former Employee (REMOVED)~~

Updated by: [Your Name]
Date: [YYYY-MM-DD]
​```

**Why this is required:**

Per Section 8 of the Corporate CLA:

> "It is your responsibility to notify the ACP Project when any change is required to the list of designated employees authorized to submit Contributions on behalf of the Corporation, or to the Corporation's Point of Contact with the ACP Project."

This ensures:
- Only current employees can contribute on behalf of your company
- Former employees are removed promptly (security and legal compliance)
- New employees are authorized before contributing
- Accurate records of who is authorized at any given time

**Important:** You must update Schedule A when:
- A new employee will contribute to the project
- An employee leaves the company
- An employee changes roles and should no longer contribute
- Your Point of Contact changes

---

## Steps for Maintainers Processing Corporate CLA

### Step 1: Review the Corporate CLA Issue

**What to do:**
1. Verify all required fields are completed
2. Check that the person signing has authority to bind the corporation (verify their title)
3. Validate GitHub usernames in Schedule A are real accounts
4. Ensure the agreement statement is properly filled out

**Why this is required:**

Maintainers must ensure:
- Legal validity of the signature
- Completeness of the agreement
- Accuracy of information for tracking purposes

---

### Step 2: Add GitHub Users to CLA Assistant Allowlist

**What to do:**
1. Go to https://cla-assistant.io/
2. Sign in and navigate to the repository
3. Click "Configure"
4. Find the "Allowlist" field
5. Add the GitHub usernames from Schedule A (comma-separated, no @ symbol):
   ​```
   existing-user1,existing-user2,new-user1,new-user2,new-user3
   ​```
6. Click "Update" to save

**Why this is required:**

CLA Assistant is the automated tool that checks whether contributors have signed a CLA before allowing PR merges. However, CLA Assistant only knows about **Individual CLA** signatures by default.

For Corporate CLA signatories, we must **manually tell CLA Assistant** which GitHub users are covered by a Corporate CLA. This is done via the "allowlist" feature.

**How the allowlist works:**
- When a PR is opened, CLA Assistant checks if the author has signed the Individual CLA
- If not, it checks if the author's username is in the allowlist
- If the username is in the allowlist, CLA Assistant marks the check as ✅ passed
- If not in the allowlist, the contributor is prompted to sign Individual CLA

**Why manual entry is necessary:**

CLA Assistant cannot automatically verify:
- Whether someone actually works for a company
- Whether a company has signed a Corporate CLA
- Which GitHub usernames belong to which company's employees

This manual step ensures:
- Only properly authorized contributors are allowed
- Corporate CLA coverage is properly tracked
- No unauthorized contributions are accepted

**Security considerations:**

The allowlist is **username-based** and relies on:
- Trust that the corporation only lists actual employees
- Corporations promptly removing departed employees
- Good faith compliance with CLA terms

This is a standard practice in open-source projects and balances security with operational simplicity.

---

### Step 3: Update SIGNATORIES.md

**What to do:**
1. Edit `/legal/cla/SIGNATORIES.md`
2. Add a new row to the Corporate CLA table:
   ​```markdown
   | Company Name | 2025-12-16 | Contact Name | @user1, @user2, @user3 | #123 |
   ​```
3. Commit and push the change

**Why this is required:**

SIGNATORIES.md serves as:
- **Public record** of all CLA signatories
- **Quick reference** for maintainers and contributors
- **Transparency** showing which organizations have signed
- **Historical record** required by the Governance Agreement

Per Section 2.4(b) of the Governance Agreement:

> "The Parties agree to adopt a process requiring all future third-party contributors to execute the Project CLA prior to the acceptance of their contributions."

Maintaining this record ensures compliance with the Governance Agreement and provides transparency to the community.

---

### Step 4: Label, Comment, and Close the Issue

**What to do:**
1. Add labels: `cla-signed` and `corporate-cla`
2. Post a confirmation comment (see template in MAINTAINER_GUIDE.md)
3. Close the issue

**Why this is required:**

- **Labels** allow filtering and tracking of CLA issues
- **Comment** confirms acceptance and provides reference
- **Closing** indicates the process is complete while keeping the issue accessible for future updates

The closed issue remains the **permanent record** of the Corporate CLA signature and the place where Schedule A updates are tracked.

---

### Step 5: Process Schedule A Updates (Ongoing)

**What to do when a company posts an updated Schedule A:**

1. Review the comment with updated Schedule A
2. Update the CLA Assistant allowlist:
   - Add new usernames
   - Remove departed employees' usernames
3. Update SIGNATORIES.md with the new list
4. Post a confirmation comment
5. **Do not close or reopen** the issue (it stays closed)

**Why this is required:**

Per Corporate CLA Section 8, corporations must notify the project of changes to authorized contributors. Maintainers must:
- Update the allowlist so new contributors can contribute
- Remove former employees so they cannot contribute on behalf of the company
- Maintain accurate records in SIGNATORIES.md

**Important security note:** Promptly removing departed employees from the allowlist is critical. If a former employee contributes after leaving the company, there may be IP ownership issues.

---

## Why Not Fully Automated?

You might wonder: "Why can't this be fully automated like Individual CLAs?"

### Technical Limitations

**CLA Assistant does not support:**
- Corporate CLA signatures
- Automatic verification of employment status
- GitHub organization membership checking
- Automatic allowlist updates

**Why these features don't exist:**
- Employment status is not public information
- GitHub orgs don't always match company structure
- Not all companies use GitHub organizations
- Legal authority to bind a corporation requires human verification

### Legal Requirements

Corporate CLAs require:
1. **Authorized signatory** - Only certain people can legally bind a corporation
2. **Schedule A management** - Companies must explicitly list authorized contributors
3. **Verification** - Someone must verify the signer has authority
4. **Ongoing updates** - Companies must manage their authorized contributor list

These cannot be fully automated while maintaining legal validity.

### Best Practice in Open Source

This manual process is **standard practice** in open source. Similar processes are used by:
- Apache Software Foundation
- Linux Foundation projects  
- CNCF projects
- Most major open-source projects with CLAs

The manual steps are minimal and only required:
- Once when signing (not per contribution)
- When updating authorized contributors (typically infrequent)

---

## Summary: Why Manual Steps Are Necessary

### For Organizations

Manual steps ensure:
- ✅ Legal validity of the Corporate CLA signature
- ✅ Proper authorization by someone with corporate authority
- ✅ Accurate tracking of authorized contributors
- ✅ Compliance with the Governance Agreement
- ✅ Public transparency and record-keeping

### For Maintainers

Manual steps ensure:
- ✅ Verification of signatory authority
- ✅ Proper configuration of CLA enforcement
- ✅ Accurate tracking of covered contributors
- ✅ Security (only authorized people contribute)
- ✅ Compliance with legal requirements

### Trade-offs

**Manual effort required:**
- ~10 minutes for corporation to create initial issue
- ~5 minutes for maintainer to process each Corporate CLA
- ~2 minutes to update Schedule A (as needed)

**Benefits gained:**
- Legal protection for the project and contributors
- Clear IP ownership and licensing
- Compliance with Apache 2.0 License requirements
- Compliance with Governance Agreement
- Transparent, auditable process

---

## Questions?

For questions about the Corporate CLA process:
- Review [CORPORATE.md](CORPORATE.md) for the full CLA text
- Review [MAINTAINER_GUIDE.md](MAINTAINER_GUIDE.md) for maintainer instructions
- Check [SIGNATORIES.md](SIGNATORIES.md) for examples of signed CLAs
- Ask in [GitHub Discussions](https://github.com/agentic-commerce-protocol/agentic-commerce-protocol/discussions)


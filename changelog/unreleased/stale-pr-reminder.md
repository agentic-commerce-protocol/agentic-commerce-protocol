# Add Stale PR Reminder Workflow

**Added** -- Stale PR reminder via GitHub Actions

## Overview
Adds a manually-triggered workflow using `actions/stale@v10` to identify and remind authors of PRs inactive for 90+ days. Comments are posted as
`github-actions[bot]`. Includes a dry-run mode for previewing affected PRs before sending reminders. No auto-close behavior — closing remains a manual maintainer
decision.

## Changes
- **Workflow**: Added `stale-reminder.yml` with `workflow_dispatch` trigger and `dry_run` input toggle
- **Label**: Requires new `stale` label (gray `#CFD3D7`, description: "PR inactive for 90+ days")
- **Auto-reset**: Any PR activity (comment, commit, or review) removes the `stale` label and resets the staleness clock
- **Scope**: PRs only — issues are excluded; draft PRs are exempt

### Files Added
- `.github/workflows/stale-reminder.yml`

<!-- 
  This template is for cutting a new spec release (admins only).
  
  Use this for:
  - Promoting unreleased specs, examples, and changelog entries to a dated version
  
  This template requires the PR title to start with "RELEASE:".
-->

# RELEASE: [Version Date, e.g. 2026-02-19]

## 📦 Release Summary

<!-- Brief overview of what this release includes. -->



---

## 🔗 Included Changes

<!-- List the changelog entries being promoted from changelog/unreleased/. -->

- [ ] `changelog/unreleased/...`

---

## ✅ Release Checklist

- [ ] Unreleased changelog entries combined into `changelog/YYYY-MM-DD.md`
- [ ] Individual `changelog/unreleased/` entry files removed
- [ ] Specs promoted from `spec/unreleased/` to `spec/YYYY-MM-DD/`
- [ ] Examples promoted from `examples/unreleased/` to `examples/YYYY-MM-DD/`
- [ ] Version references updated across specs and schemas
- [ ] Previous version marked as deprecated in changelog (if applicable)

---

**Process**: Release PRs require approval from another admin. See [governance.md](../../docs/governance.md) for details.

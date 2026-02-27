#!/usr/bin/env node
/**
 * Validates PR title and description against minor-improvement, SEP, admin, or release template.
 * Expects PR_TITLE and PR_BODY in environment (set by GitHub Actions).
 */

const title = process.env.PR_TITLE || '';
const body = process.env.PR_BODY || '';

const MIN_TITLE_LENGTH = 10;
const PLACEHOLDER_MINOR = '[Short Descriptive Title]';
const PLACEHOLDER_SEP = 'SEP: [Short Descriptive Title]';
const PLACEHOLDER_ADMIN = 'ADMIN: [Short Description of Admin Action]';
const PLACEHOLDER_RELEASE = 'RELEASE: [Version Date, e.g. 2026-02-19]';

const MINOR_SECTIONS = [
  '## 🔧 Type of Change',
  '## 📝 Description',
  '## 🎯 Motivation and Context',
  '## 🧪 Testing',
  '## 📸 Screenshots / Examples',
  '## ✅ Checklist',
  '## 🔍 Scope Verification',
  '## 📚 Additional Notes',
];

const SEP_SECTIONS = [
  '## 📋 SEP Metadata',
  '## 🎯 Abstract',
  '## 💡 Motivation',
  '## 📐 Specification',
  '## 🤔 Rationale',
  '## 🔄 Backward Compatibility',
  '## 🛠️ Reference Implementation',
  '## 🔒 Security Implications',
  '## ✅ Pre-Submission Checklist',
  '## 📚 Additional Context',
  '## 🙋 Questions for Reviewers',
];

const ADMIN_SECTIONS = [
  '## 🔑 Admin Action',
  '## 📝 Summary',
  '## 🔗 Reference',
  '## ✅ Admin Checklist',
];

const RELEASE_SECTIONS = [
  '## 📦 Release Summary',
  '## 🔗 Included Changes',
  '## ✅ Release Checklist',
];

const errors = [];

function detectType() {
  const hasSepMarkers =
    body.includes('## 📋 SEP Metadata') && body.includes('## 🎯 Abstract');
  const hasMinorMarkers =
    body.includes('## 🔧 Type of Change') && body.includes('## 📝 Description');
  const hasAdminMarkers =
    body.includes('## 🔑 Admin Action') && body.includes('## ✅ Admin Checklist');
  const hasReleaseMarkers =
    body.includes('## 📦 Release Summary') && body.includes('## ✅ Release Checklist');
  if (hasReleaseMarkers && !hasSepMarkers && !hasMinorMarkers && !hasAdminMarkers) return 'release';
  if (hasAdminMarkers && !hasSepMarkers && !hasMinorMarkers) return 'admin';
  if (hasSepMarkers && !hasMinorMarkers) return 'sep';
  if (hasMinorMarkers) return 'minor';
  return null;
}

function validateTitle(type) {
  const t = title.trim();
  if (!t) {
    errors.push('PR title is empty.');
    return;
  }
  if (t.length < MIN_TITLE_LENGTH) {
    errors.push(`PR title is too short (minimum ${MIN_TITLE_LENGTH} characters).`);
    return;
  }
  if (type === 'sep') {
    if (!t.startsWith('SEP:')) {
      errors.push('SEP PRs must have a title starting with "SEP: " (e.g. "SEP: My new SEP proposal").');
      return;
    }
    const afterPrefix = t.slice(4).trim();
    if (!afterPrefix || afterPrefix === '[Short Descriptive Title]') {
      errors.push('SEP title must not be the placeholder "SEP: [Short Descriptive Title]".');
    }
  } else if (type === 'admin') {
    if (!t.startsWith('ADMIN:')) {
      errors.push('Admin PRs must have a title starting with "ADMIN: " (e.g. "ADMIN: Add Acme Corp to CLA signatories").');
      return;
    }
    const afterPrefix = t.slice(6).trim();
    if (!afterPrefix || afterPrefix === '[Short Description of Admin Action]') {
      errors.push('Admin title must not be the placeholder "ADMIN: [Short Description of Admin Action]".');
    }
  } else if (type === 'release') {
    if (!t.startsWith('RELEASE:')) {
      errors.push('Release PRs must have a title starting with "RELEASE: " (e.g. "RELEASE: 2026-02-19").');
      return;
    }
    const afterPrefix = t.slice(8).trim();
    if (!afterPrefix || afterPrefix === '[Version Date, e.g. 2026-02-19]') {
      errors.push('Release title must not be the placeholder "RELEASE: [Version Date, e.g. 2026-02-19]".');
    }
  } else {
    if (t === PLACEHOLDER_MINOR || t === PLACEHOLDER_SEP || t === PLACEHOLDER_ADMIN || t === PLACEHOLDER_RELEASE) {
      errors.push(`PR title must not be the placeholder "${t}".`);
    }
    const RESERVED_PREFIXES = ['SEP:', 'ADMIN:', 'RELEASE:'];
    const mismatch = RESERVED_PREFIXES.find((p) => t.toUpperCase().startsWith(p));
    if (mismatch) {
      errors.push(
        `PR title starts with "${mismatch}" but the description uses the Minor Improvement template. Please use the matching template for ${mismatch} PRs.`
      );
    }
  }
}

function validateSections(requiredSections, typeLabel) {
  const missing = requiredSections.filter((heading) => !body.includes(heading));
  if (missing.length > 0) {
    errors.push(
      `PR description is missing required ${typeLabel} section(s):\n  - ${missing.join('\n  - ')}`
    );
  }
}

function validateKeySectionsHaveContent(type) {
  const checksMap = {
    sep: [
      { heading: '## 🎯 Abstract', minLength: 50 },
      { heading: '## 💡 Motivation', minLength: 30 },
      { heading: '## 📐 Specification', minLength: 30 },
    ],
    minor: [
      { heading: '## 📝 Description', minLength: 30 },
      { heading: '## 🎯 Motivation and Context', minLength: 20 },
    ],
    admin: [
      { heading: '## 📝 Summary', minLength: 20 },
    ],
    release: [
      { heading: '## 📦 Release Summary', minLength: 20 },
    ],
  };
  const checks = checksMap[type] || [];

  for (const { heading, minLength } of checks) {
    const idx = body.indexOf(heading);
    if (idx === -1) continue;
    const start = idx + heading.length;
    const nextHeading = body.indexOf('\n## ', start);
    const sectionBody =
      nextHeading === -1 ? body.slice(start) : body.slice(start, nextHeading);
    const text = sectionBody
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (text.length < minLength) {
      errors.push(
        `Section "${heading}" should have at least ~${minLength} characters of content (excluding comments).`
      );
    }
  }
}

function main() {
  if (!body.trim()) {
    errors.push('PR description (body) is empty.');
  } else {
    const type = detectType();
    if (!type) {
      errors.push(
        'PR description does not match any template. It must include the required sections from the Minor Improvement, SEP Proposal, Admin, or Release template. See .github/PULL_REQUEST_TEMPLATE/'
      );
    } else {
      validateTitle(type);
      const sectionMap = { sep: SEP_SECTIONS, minor: MINOR_SECTIONS, admin: ADMIN_SECTIONS, release: RELEASE_SECTIONS };
      const labelMap = { sep: 'SEP', minor: 'Minor Improvement', admin: 'Admin', release: 'Release' };
      validateSections(sectionMap[type], labelMap[type]);
      validateKeySectionsHaveContent(type);
    }
  }

  if (errors.length > 0) {
    console.error('PR description validation failed:\n');
    errors.forEach((e) => console.error('  •', e));
    console.error('\nPlease update the PR title and/or description to match the template.');
    process.exit(1);
  }
  console.log('PR title and description validation passed.');
  process.exit(0);
}

main();

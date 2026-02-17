# Cursor rules for Coach App

## Purpose
This repo builds an internal recruitment intelligence engine for football clubs.
It is an internal tool and future investor demo.
It is NOT a self serve SaaS with club logins.

## Product identity
This is a confidential executive search intelligence platform.
It is used by directors of football, CEOs, ownership groups, and private equity stakeholders.
It must feel institutional, board ready, and diligence grade.
It is not a generic SaaS dashboard.
Every page should feel suitable for board level screen sharing or PDF export.

## Non negotiables
1. Do not change routing, middleware, Supabase logic, database schema, auth flows, or folder structure unless explicitly requested.
2. Do not add new dependencies unless explicitly requested.
3. Do not remove existing features. Only improve UI, UX, component structure, and polish.
4. Keep build green. After changes, the app must compile and run locally.

## Allowed changes by default
1. Tailwind classes and styling
2. globals.css tokens and theme variables
3. Reusable UI components and internal component structure
4. Copy and microcopy improvements
5. Accessibility improvements (focus states, contrast, keyboard support)
6. Small performance wins that do not alter behaviour (memo, simple refactors)

## Design direction
We use a hybrid design system:
1. Dark shell and navigation (premium, confident, low noise)
2. Light data surfaces for dense tables and forms (clean, readable, executive)

Use these existing tokens and classes:
1. Dark surfaces: card surface, card inset
2. Light surfaces: card light, bg light hover, border light, text light fg, text light muted
3. Borders should be subtle. Avoid harsh solid lines.
4. Spacing rhythm: use 32px gaps between major blocks. Use consistent padding inside cards.

5. Layouts should feel like executive briefings, not analytics dashboards.
6. Reduce decorative metrics. Prioritize intelligence, risk visibility, and decision support.
7. Fewer cards, stronger hierarchy.

## Visual standards
1. Prefer rounded xl for major cards and panels.
2. Buttons should be restrained, consistent height, consistent radius.
3. Avoid neon colours and heavy glow.
4. Use tabular nums for metrics.
5. Keep typography tight and editorial. Avoid oversized headings.
6. Keep layouts aligned to a grid. Avoid random one off spacing.

7. Avoid startup SaaS aesthetics. No playful or gamified UI patterns.
8. Surfaces should feel like advisory documentation, not product marketing.

## UX standards
1. Every page needs a clear header (title, subtitle, primary action if relevant).
2. Use progressive disclosure. Keep default views simple.
3. Provide empty states with next action.
4. Loading states should match final layout.
5. Error states should be actionable.

6. Each page should follow a briefing structure where possible:
   - Context
   - Intelligence
   - Risk
   - Recommendation or action

## Product intent and language
This product supports a managed service workflow:
1. We approach clubs, directors of football, CEOs, agents, coaches.
2. We maintain a curated database of coaches and staff.
3. We generate shortlists with fit scoring and due diligence.

Use language like:
1. Mandate
2. Shortlist
3. Intelligence
4. Due diligence
5. Source tier
6. Confidence

Avoid language like:
1. Self serve
2. Workspace admin
3. Subscription

## Intelligence model rules
Intelligence items must support:
1. Source tier (Tier 1, Tier 2, Tier 3)
2. Confidence (High, Medium, Low)
3. Type tags (availability, contract, reputation, appointment, sacking, general)
4. Clear timestamps and provenance fields where available

## Code standards
1. Prefer small components, one responsibility.
2. Keep props stable. Avoid breaking prop interfaces.
3. Prefer extracting repeated UI into components in src components ui.
4. Keep page files readable. Move helpers into components when reused.
5. Keep types in src lib types.


## Execution Protocol

### Hard rules
- Do not change routing or folder structure
- Do not touch Supabase queries, auth, middleware
- Do not rename files or move pages
- Only change styling, component structure, and reusable UI components

### Work method
- One page at a time
- Max 2 files per change unless explicitly requested
- Always run npm run build after each change

### Design system enforcement
- Dark shell for navigation and global background
- Light data surfaces must use card-light
- No hardcoded hex values
- Use design tokens only

### Build discipline
- State exact files to be modified before editing
- Confirm restricted areas are untouched
- Keep diffs minimal and scoped
- After changes, run npm run build and confirm all routes compile
- Do not proceed to next batch until build is green

## What to do before large UI changes
1. Read the relevant files first.
2. State the exact files you will change.
3. Confirm no restricted areas are being touched.
4. Implement in small steps.
5. Run npm run build.

## Safe refactor guidance
Allowed refactors:
1. Rename CSS utility groupings by extracting to components
2. Replace hard coded colours with tokens
3. Replace duplicated layout blocks with shared components

Not allowed refactors unless asked:
1. Moving routes
2. Changing URL structure
3. Changing Supabase queries and security assumptions
4. Changing auth requirements

## Output expectations for AI edits
1. Keep diffs minimal and scoped.
2. Do not introduce dead code or unused imports.
3. Do not leave TODOs without explaining why.
4. If a change affects multiple pages, do it in batches and keep the app usable after each batch.

### Executive alignment requirement
Before making structural UI changes, ensure the page aligns with the executive advisory positioning defined above.
If a design feels like a generic dashboard, refactor toward a confidential briefing format instead.
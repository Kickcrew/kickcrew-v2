
# KICKCREW Esports — Agent Development Rules

## 1. Project Identity

KICKCREW Esports is a Kenya-based esports organization building an esports ecosystem across Africa.

The website supports:

- Competitive esports teams
- Tournament organization
- Community events
- Gaming academy and education
- Coaching and mentorship
- Talent development
- Streaming and content creation
- Partnerships and sponsorships
- Merchandise
- News and media
- Careers and volunteer opportunities
- Digital innovation
- Youth empowerment through gaming

The project should feel like a professional esports organization while remaining welcoming to new players and gaming communities.

Brand direction:

- Primary: Black `#000000`
- Secondary: White `#FFFFFF`
- Accent: Gold `#D4AF37`
- Optional neutral: Dark Gray `#2B2B2B`
- Heading font: Bebas Neue
- Body font: Montserrat
- Alternative body font: Poppins
- Visual style: modern, premium, high-contrast esports
- Avoid unnecessary visual clutter.

Primary brand message:

"Building Africa's Next Generation of Esports Champions."

---

## 2. Technology Stack

The project currently uses:

- Next.js 16.2.10
- React 19.2.4
- TypeScript
- Tailwind CSS 4
- Supabase
- `@supabase/ssr`
- `@supabase/supabase-js`
- Framer Motion
- Lucide React
- React CountUp
- React Datepicker
- ESLint

Use the existing stack unless there is a clear technical reason to change it.

Do not introduce another framework, state-management library, UI library, database layer, or date library without first evaluating whether the existing architecture already provides the required functionality.

---

## 3. General Development Principles

Before modifying code:

1. Inspect the existing implementation.
2. Understand how the affected feature currently works.
3. Reuse existing utilities, types, components, and services where appropriate.
4. Make the smallest safe change that solves the problem.
5. Preserve existing functionality unless the requested change explicitly requires changing it.
6. Do not rewrite large sections of working code unnecessarily.
7. Do not create duplicate implementations of existing functionality.
8. Do not remove working validation or security controls simply to make a feature easier to implement.

Prefer maintainable, explicit code over clever abstractions.

When a requirement is unclear, preserve existing behavior rather than inventing a new behavior.

---

## 4. Next.js 16 Rules

This project uses Next.js 16.

Next.js 16 has breaking changes compared with older Next.js versions.

Before implementing unfamiliar Next.js functionality, consult the relevant documentation available in:

`node_modules/next/dist/docs/`

Pay particular attention to:

- Route handler context
- Async request APIs
- `cookies()`
- `headers()`
- Dynamic route parameters
- Middleware/proxy conventions
- Server and client component boundaries

For dynamic route handlers, follow the Next.js 16 parameter conventions used by the project.

Do not copy older Next.js examples without verifying that they are compatible with Next.js 16.

The current project contains a `middleware.ts` file. Do not migrate it to the newer `proxy` convention unless that migration is explicitly requested or separately planned.

---

## 5. TypeScript and Shared Domain Types

Shared domain types belong under:

`lib/types/`

Current domain areas include:

- `player.ts`
- `team.ts`
- `registration.ts`
- `match.ts`
- `standing.ts`
- `tournament.ts`

Prefer importing shared types rather than recreating equivalent interfaces inside:

- React components
- API routes
- tournament services
- admin pages

Do not create multiple competing definitions of the same domain object.

If a shared type is incomplete, first inspect all usages before changing it.

Do not automatically populate currently empty type files unless the feature being implemented requires those types.

Maintain accurate nullability based on the database and existing API behavior.

---

## 6. Supabase Architecture

Supabase is the project's database and authentication platform.

The project currently uses:

- `lib/supabase.ts` for the existing browser/client-side Supabase usage.
- `lib/supabase-server.ts` for server-side Supabase access.

Use the existing server client pattern for server-side operations.

The server client uses Next.js 16's asynchronous `cookies()` API.

Do not bypass the established Supabase client architecture without a clear reason.

Do not expose service-role credentials to browser/client code.

Do not move privileged database operations into client components.

---

## 7. Authentication and Authorization

The `/admin` area is protected by Supabase authentication.

`middleware.ts` currently:

- checks the authenticated Supabase user
- protects `/admin/*`
- allows `/admin/login`
- redirects unauthenticated admin users to `/admin/login`
- redirects authenticated users away from `/admin/login`

Do not weaken these protections.

Authentication and authorization are separate concerns.

Being authenticated does not automatically mean that a user should be allowed to perform every administrative mutation.

When adding or modifying administrative API routes, preserve appropriate authorization checks and follow the existing security architecture.

Never remove authentication checks merely to make an API request work.

---

## 8. API Route Rules

API routes are located under:

`app/api/`

Existing API areas include:

- applications
- divisions
- games
- matches
- players
- teams
- tournament registrations
- tournaments

Follow the existing response structure:

```ts
{
  success: boolean,
  message?: string,
  ...
}
```

Validate request data before performing database mutations.

Use appropriate HTTP status codes.

Do not trust IDs or values supplied by the client.

When a referenced database entity must exist, verify its existence before creating dependent records.

Handle database errors explicitly.

Avoid exposing unnecessary database internals in public API responses.

---

## 9. Match Domain Rules

A match must represent either:

- team vs team

or:

- player vs player

Mixed team/player participant matches are not allowed.

A participant cannot play against itself.

When creating or modifying match logic, preserve these rules unless the product requirements explicitly change.

Matches may contain:

- tournament
- game
- teams
- players
- round
- match number
- status
- scores
- winner information
- next match information

Do not casually change match participant semantics because tournament advancement depends on them.

---

## 10. Tournament System

Tournament functionality is a core part of KICKCREW.

Supported tournament formats include:

- Round Robin
- Round Robin + Knockout
- Group Stage + Knockout
- Knockout / Single Elimination

Tournament functionality may include:

- tournament creation
- registration
- participant qualification
- group stages
- round robin fixtures
- standings
- knockout brackets
- match results
- automatic advancement
- winner propagation
- BYEs
- next-match assignment

Tournament generation and advancement logic is domain-critical.

Do not rewrite tournament logic unless the requested change requires it.

Before changing tournament behavior, inspect:

- tournament format normalization
- fixture generation
- round naming
- match numbering
- standings calculation
- qualification logic
- knockout bracket generation
- winner advancement

Preserve existing behavior for formats that are not part of the requested change.

---

## 11. Round Robin Detection

The application currently uses round names to distinguish round-robin fixtures.

Examples include:

- `Round 1`
- `Round 2`
- `Leg 1 - Round 1`
- `Leg 2 - Round 1`

Round-robin detection must not incorrectly classify knockout rounds as round robin.

Double-leg round robin should retain the distinction between legs.

Do not replace existing round-name conventions with a new naming scheme unless the entire dependent system is updated consistently.

---

## 12. Knockout Detection and Advancement

Knockout rounds may include names such as:

- Round of 32
- Round of 16
- Round of 8
- Quarterfinal
- Semifinal
- Final
- Third Place

Knockout matches must not be misclassified as round-robin matches.

The knockout advancement system can:

- determine the winner
- identify team or player matches
- place winners into the next match
- use the appropriate next-match slot
- handle BYE-generated winners

Do not change winner propagation or next-match assignment without examining:

`lib/tournament/advance-knockout-match.ts`

and the administrative tournament-stage components that depend on it.

---

## 13. Tournament Dates and Date/Time Inputs

Tournament-related dates include:

- registration start
- registration end
- tournament start
- tournament end

Existing API validation requires:

- valid dates
- registration end after registration start
- tournament end after tournament start
- registration ending no later than tournament start
- registration opening no later than tournament start

Preserve these business rules.

For user-facing date/time entry, use an appropriate date/time picker.

Do not replace date/time pickers with plain text inputs.

The project already includes `react-datepicker`.

Date/time values must be handled consistently between:

- UI
- API
- database

Be careful with timezone conversion and serialization.

---

## 14. Admin UI

Administrative functionality should remain consistent with the existing admin architecture.

Relevant areas include:

- applicants
- registrations
- matches
- tournaments
- tournament stages
- groups
- standings
- knockout brackets

Prefer existing reusable components.

Do not create a second version of an existing table, form, status badge, upload component, or tournament control when an existing component can be extended safely.

---

## 15. Forms and Validation

Validate important values on both:

- client/UI side for user experience
- server/API side for security and data integrity

Never rely exclusively on client-side validation.

Date/time fields should use date/time pickers.

Forms should provide clear validation messages without exposing implementation details.

Do not silently discard invalid user input.

---

## 16. UI and Brand Consistency

Preserve the KICKCREW visual system:

- black and gold primary palette
- high contrast
- premium esports appearance
- strong typography
- clean layouts
- sharp visual hierarchy
- responsive design

Avoid introducing unrelated colors or visual styles.

Reuse existing:

- buttons
- cards
- containers
- section titles
- animations
- navigation
- team cards
- admin UI patterns

Do not redesign unrelated pages while implementing a functional feature.

---

## 17. Security

Security takes priority over convenience.

Never:

- expose secrets
- expose service-role keys to the client
- disable authentication to solve an admin problem
- bypass database authorization without justification
- trust client-supplied ownership or authorization claims
- commit `.env.local`
- commit credentials or tokens
- use destructive database operations casually

When modifying database access, consider Supabase RLS and the difference between authenticated and privileged operations.

---

## 18. Git Safety

The repository is the source of truth.

Before making substantial changes:

- inspect `git status`
- understand the current branch
- avoid overwriting unrelated local work

Do not:

- force-push
- rewrite history
- reset or clean the repository destructively
- delete unrelated changes
- commit generated secrets

Never use:

```bash
git add .
```

blindly when unrelated local changes may exist.

Stage only the files relevant to the intended change.

Create focused commits with clear messages.

---

## 19. Verification

After code changes, run appropriate checks.

At minimum, for significant application changes:

```bash
npm run build
```

For lint-related changes:

```bash
npm run lint
```

If a change affects TypeScript, APIs, tournament logic, or shared types, verify the complete application build.

Do not declare a change complete solely because the editor shows no errors.

If a build failure is unrelated to the change, identify and report it clearly rather than hiding or rewriting unrelated code.

---

## 20. Dependency Changes

Do not install a new dependency simply because it is convenient.

First check whether the existing dependencies already solve the problem.

If a new dependency is necessary:

1. explain why it is needed
2. check compatibility with the current Next.js/React versions
3. install it intentionally
4. verify the build

Avoid unnecessary dependency growth.

---

## 21. File and Code Changes

Prefer targeted modifications.

Do not:

- rewrite entire files unnecessarily
- remove comments that explain important business logic
- rename public API fields without a migration plan
- change database column names casually
- alter route paths without checking all consumers
- remove working functionality to simplify implementation

When a full-file replacement is safer, preserve all unrelated existing behavior.

---

## 22. Existing Build Warnings

The current project has a Next.js warning concerning the deprecated `middleware.ts` convention.

Do not treat this warning as a reason to perform an unrelated migration.

Address it separately when planned.

A successful build with this warning should not be considered a failed build.

---

## 23. Working Style for Agents

For non-trivial changes:

1. Inspect first.
2. Explain the intended change.
3. Identify affected files.
4. Make the smallest safe implementation.
5. Verify the result.
6. Report exactly what changed.
7. Report any remaining warnings or known limitations.

Do not make speculative architectural changes.

Do not assume that an apparently simple UI change is isolated if it affects:

- tournament generation
- standings
- qualification
- match advancement
- Supabase data
- authentication
- API contracts

KICKCREW's tournament system is interconnected. Preserve those relationships.

---

## 24. Priority Order

When requirements conflict, prioritize:

1. Security and data integrity
2. Correct tournament behavior
3. Existing application architecture
4. Type safety
5. API correctness
6. User experience
7. Visual consistency
8. Minimal implementation complexity

Never sacrifice security or tournament data integrity merely for convenience.
```
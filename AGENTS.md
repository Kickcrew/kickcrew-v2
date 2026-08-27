<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes - APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in node_modules/next/dist/docs/ before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# KICKCREW Development Rules

## Project Overview

KICKCREW is an esports organization website built with:

- Next.js 16
- TypeScript
- Tailwind CSS
- Supabase
- Git/GitHub

## Coding Rules

- Use TypeScript strictly.
- Do not use `any` unless absolutely necessary.
- Check existing types before creating new ones.
- Prefer reusable components.
- Explain significant changes before modifying files.
- Preserve existing working functionality.

## Tournament System Rules

The tournament system includes:

- Registrations
- Fixtures
- Round robin stages
- Single leg matches
- Double leg matches
- Knockout stages
- Qualification logic
- Standings calculation

Never modify tournament logic without checking how it affects:
- Match generation
- Standings
- Qualification
- Knockout advancement

## Supabase Rules

- Check existing database relationships before changing queries.
- Remember Supabase relations may return objects or arrays.
- Do not break existing API routes.

## UI/Brand Rules

Maintain KICKCREW branding:

Colors:
- Black #000000
- White #FFFFFF
- Gold #D4AF37

Style:
- Premium esports aesthetic
- Clean layouts
- Sharp modern design

## Development Workflow

Before making major changes:

1. Explain the planned changes.
2. Identify affected files.
3. Check possible side effects.

After changes:

1. Explain modified files.
2. Mention possible risks.
3. Suggest testing steps.
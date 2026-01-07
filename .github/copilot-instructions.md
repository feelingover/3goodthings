# Project Context: Documentation Structure

Please assume the following documentation structure has been created as a shared source of truth. It defines the complete project context and should inform all your responses.

## Documentation Structure

All files are Markdown format, located under the `.claude/` directory. This structure follows Claude Code best practices:

### Main Documentation

- **`.claude/CLAUDE.md`**: Project guide, current focus, commonly used commands
- **`.claude/progress.md`**: Complete Sprint 1-3 development history, Git information, technical highlights

### Rules (Topic-Specific Guidelines)

- **`.claude/rules/architecture.md`**: System architecture, data models, component structure, design patterns
- **`.claude/rules/development.md`**: Technology stack, development environment setup, Cloudflare Workers configuration, build/deploy procedures
- **`.claude/rules/testing.md`**: Test strategies, patterns, current coverage (75%, 82% pass rate), CI/CD integration
- **`.claude/rules/design-principles.md`**: Material Design 3 implementation rules, UI/UX principles, accessibility guidelines

### Legacy Documentation

- **`CLAUDE.md`** (root): Development progress records (Sprint 1-3), includes quick reference to new `.claude/` structure

## Copilot Agent Instructions

When reviewing or generating code, **always reflect the context above**. Especially prioritize alignment with:
- **Architecture and patterns** (`.claude/rules/architecture.md`)
- **Technologies and constraints** (`.claude/rules/development.md`)
- **Current project focus** (`.claude/CLAUDE.md` - "現在のフォーカス" section)
- **Design principles** (`.claude/rules/design-principles.md` - Material Design 3)
- **Testing approach** (`.claude/rules/testing.md`)

If a file update or code change is ambiguous, consider asking:
> "Does this align with the architecture or design principles in `.claude/rules/`?"

## Key Technologies

- React 19 + TypeScript + Vite
- Material Design 3 (CSS variables)
- IndexedDB (Dexie.js)
- OpenAI API via Cloudflare Workers
- PWA (Service Worker + Workbox)
- Jest + React Testing Library

## Current Status

- Sprint 3 completed: Performance optimization, App.tsx refactoring (-25% lines), React.memo optimization
- Next: Sprint 4 - Engagement features (statistics, reminders)

## Final Notes

This documentation is maintained using Claude Code. You are not expected to edit it directly, but all your work should remain consistent with its contents.


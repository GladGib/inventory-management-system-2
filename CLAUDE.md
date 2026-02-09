# Project Overview

Inventory Management System for Malaysian SMEs (Demo Auto Parts Sdn Bhd).

## Tech Stack

| Layer    | Technology                                        |
| -------- | ------------------------------------------------- |
| Frontend | Next.js 14, React 18, Ant Design 5, Tailwind CSS |
| Backend  | NestJS 10, Prisma 5, PostgreSQL                   |
| Mobile   | Flutter (warehouse operations)                    |
| Infra    | Docker Compose (PostgreSQL + pgAdmin)             |

## Project Structure & Commands

See [INDEX.md](INDEX.md) for the full project structure, directory layout, and all available commands.

---

# Prisma Schema Changes (IMPORTANT)

When modifying `backend/prisma/schema.prisma`, ALWAYS create a migration:

```bash
cd backend && npx prisma migrate dev --name descriptive_name
```

**Never** use `prisma db push` and commit without a migration. This causes schema drift that breaks fresh setups.

---

# Available Tools

## MCP Servers

- **Context7** - Look up current documentation for any library. Use `resolve-library-id` first, then `query-docs`.
- **Playwright** - Browser automation for testing and interacting with the running web app.

## Skills (invoke with Skill tool)

| Skill                | When to use                                          |
| -------------------- | ---------------------------------------------------- |
| `frontend-design`    | Build polished UI components and pages               |
| `ui-ux-pro-max`      | Design systems, palettes, typography, and UI reviews |
| `webapp-testing`     | Test the running web app with Playwright             |
| `git-commit-helper`  | Generate commit messages from staged changes         |
| `openspec-new`       | Start a new structured change with OpenSpec          |
| `openspec-continue`  | Continue creating artifacts for an in-progress change|
| `openspec-ff`        | Fast-forward through all artifacts at once           |
| `openspec-apply`     | Implement tasks from an OpenSpec change              |
| `openspec-verify`    | Verify implementation matches the change artifacts   |
| `openspec-archive`   | Archive a completed change                           |
| `openspec-explore`   | Think through ideas before starting a change         |
| `openspec-sync-specs`| Sync delta specs to main specs                       |

## Agents (invoke with Task tool, subagent_type parameter)

| Agent                 | When to use                                         |
| --------------------- | --------------------------------------------------- |
| `frontend-developer`  | React/Next.js components, state, UI logic           |
| `fullstack-developer` | End-to-end features spanning backend and frontend   |
| `code-reviewer`       | Code quality, security, and maintainability reviews  |
| `ui-ux-designer`      | UI/UX feedback and design critique                  |
| `Jenny`               | Verify implementation matches project specifications |
| `context-manager`     | Multi-agent coordination and context preservation   |
| `Explore`             | Codebase search and exploration (built-in)          |
| `Plan`                | Design implementation approaches (built-in)         |

---

# Pre-Delivery Checklist

## Accessibility
- [ ] Color contrast 4.5:1 minimum for text
- [ ] All images have alt text
- [ ] Form inputs have labels
- [ ] Focus states visible for keyboard navigation

## Responsive
- [ ] Test at 375px, 768px, 1024px, 1440px
- [ ] No horizontal scroll on mobile
- [ ] Touch targets minimum 44x44px

## Before Claiming Complete
- [ ] Run verification: `cd backend && npm test` and `cd web && npm run build`
- [ ] Manually verify key flows work in the browser

# MyDesk Invoicing PRD

## Original Problem Statement
Build **MyDesk · Invoicing** as a single-page React app (hash routing + localStorage persistence) for freelancers/small studios, with full invoicing workflow, projects/milestones, client management, settings, dark Linear-style UI, and no backend.

## Architecture Decisions
- Frontend-only React app using modular files under src/mydesk
- State centralized in StoreProvider with localStorage key mydesk_invoicing_v1
- Hash router implemented in-app (window.location.hash) with shell layout (sidebar/topbar/breadcrumbs)
- Shared UI primitives in ui.js; screen modules for Dashboard, Invoices, Invoice Detail, Editor, Projects, Clients, Settings
- CSS design system in App.css with dark-theme tokens, responsive grids, cards, table/menu patterns

## Implemented
- Complete screen set and route map per spec
- Invoice lifecycle actions: create, draft, send, reminder, mark paid, delete, duplicate, timeline log
- Invoice editor with live preview, line-items add/remove, totals, save draft / save & send
- Project milestone tracking + invoice generation from completed milestones
- Client CRUD modals + per-client stats + new-invoice shortcut
- Settings: business profile, logo upload/remove, reset demo data
- PDF/print export via generated print HTML in new tab
- Global search, sidebar counts, toasts, seeded data, overdue refresh on load
- Bug fixes delivered now: row action View route, milestone send-invoice route, row-menu alignment/position, contrast/readability/layout polish

## Prioritized Backlog
### P0
- Bulk invoice actions (multi-select: reminders/mark paid)
- Tax + discount support in invoice editor

### P1
- Recurring invoices scheduler
- Improved onboarding empty states after reset

### P2
- Alternate invoice list views (kanban/group by client)
- Enhanced printable template variants

## Next Tasks
1. Add bulk select + batch actions to invoices table
2. Add tax/discount fields and totals logic in editor/detail/PDF
3. Add recurring invoice generator with cadence controls


## Update: Recurring Invoices (Monthly)
- Added dedicated route and screen: `#/recurring`
- Added recurring template model and persistence in store (`recurringTemplates`)
- Added actions: create template from invoice, run now, pause/resume, edit, delete
- Added recurring generation history table + navigation to generated invoice detail
- Added quick links from Invoices and Invoice Detail into recurring workflow
- Fixed recurring select hydration warning by using option `label` text values


## Update: Slack-style Light Theme System
- Applied app-wide Slack-inspired light visual language using provided plum/cream token direction
- Replaced global stylesheet with full tokenized system (colors, typography, spacing, radii, shadows)
- Updated shell and all major surfaces/components: sidebar, topbar, cards, tables, pills, forms, modals, toasts, banners, charts, recurring templates
- Preserved all existing business flows/routes while changing only presentation
- Added readability polish for muted text and extra safe bottom spacing to avoid floating badge overlap

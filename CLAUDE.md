# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Vite)
npm run build     # Production build
npm run lint      # Run ESLint
npm run preview   # Preview production build
```

No test runner is configured in this project.

## Architecture

This is a React 19 + Vite SPA for a Ukrainian IT education platform (DBLAB). It has two distinct sections sharing the same codebase:

**Public site** (`/`) — served via `MainLayout`, includes:
- `/` — HomePage
- `/courses`, `/courses/:courseId` — course listing and details
- `/directions`, `/directions/:directionId` — development directions
- `/schedule` — schedule page
- `/contact` — contact page

**Admin panel** (`/apanel`) — served via `AdminLayout` + `AdminPageLayout` (sidebar nav + `<Outlet>`). All admin routes require a JWT auth token. The sidebar links to entity management pages (teachers, disciplines, skills, levels, chapters, languages, development directions, discipline-teacher relations, discipline-skill relations, lessons, events, materials).

### Auth

`react-auth-kit` v3 is used for auth state. The token is stored in a cookie (`_auth`). The `useAuthHeader()` hook returns `"Bearer <token>"` — all admin API calls strip the `"Bearer "` prefix and send only the raw token in the `Authorization` header.

### API

`src/config/api.js` exports `API_CONFIG.BASE_URL`, which reads from `VITE_API_BASE_URL` env var and falls back to the production server. To point at a local backend, create a `.env.local` file:

```
VITE_API_BASE_URL=http://localhost:5000
```

### Admin CRUD pattern

Every admin entity page follows the same pattern:
1. The page component (e.g. `src/pages/adminPages/disciplines.jsx`) defines a `columns` array describing the fields, their display types (`text`, `textarea`, `select`, `multiselect`), and optional `endpoint` for many-to-many relations.
2. It renders `<AdminTableComponent tableName endpoint idField columns />`.
3. `AdminTableComponent` handles all CRUD (GET `/getFromDb`, POST `/create`, PUT `/:id`, DELETE `/delete/:id`), opens `UniversalModalComponent` for add/edit, and fires toast notifications via `NotificationContext` (provided by `AdminPageLayout`).
4. Many-to-many fields (`isMulti: true`) have their own `endpoint` and are managed separately via `handleAdditionalFields` (delete-all then re-insert on save).

### Notifications

`ModalNotificationComponent` is rendered at the `AdminPageLayout` level and exposed via `NotificationContext` (a `createRef` to the component's imperative `addNotification` method). Consume it with `useContext(NotificationContext)`.

### Styling

Each component has a co-located CSS file under a `styles/` subdirectory next to the component. No CSS-in-JS or utility framework is used.

Spaces 4 formatting using across the files.

## Component Architecture

Always split UI into focused, single-responsibility components. For any feature or page:
- **Page component** (`src/pages/`) — owns state, assembles sub-components, no inline UI logic.
- **Display components** (`src/components/`) — pure/presentational, receive props only; each in its own file with a co-located CSS file under `styles/`.
- **Examples of required separation:** a modal lives in its own component file, a card lives in its own file, a list/grid of cards lives in its own file.

Never bundle multiple unrelated components in a single file. If a component grows beyond its single responsibility, extract it.
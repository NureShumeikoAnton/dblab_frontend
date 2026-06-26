# Fixes & Known Issues

Reported: 26.06.2026 via team chat.

| # | Name | Description | Approximate file | Status |
|---|------|-------------|-----------------|--------|
| 1 | Chapters — dropdown scroll | Scroll in dropdown list not working, user had to navigate with keyboard | `src/components/styles/MultiSelect.css` | ✅ Fixed |
| 2 | Chapters — skills column layout | Skills displayed vertically (mark above text) instead of inline in multi-select dropdown | `src/components/styles/MultiSelect.css`, `src/components/styles/CommentComponents.css` | ✅ Fixed |
| 3 | Schedule — lessons limit | Only 4 lessons actually save; the rest report success but don't persist and don't appear on the schedule | `src/pages/SchedulePage.jsx` | 🔴 Open |
| 4 | Schedule — recurrence not working | Weekly and bi-weekly lesson recurrence has no effect | `src/pages/SchedulePage.jsx` | 🔴 Open |
| 5 | Schedule — events missing | Events that exist in the DB are not displayed on the schedule (e.g. event on 23.06.2026) | `src/pages/SchedulePage.jsx` | 🔴 Open |
| 6 | Schedule — event materials missing | Materials attached to events exist in DB but are not shown on the schedule | `src/pages/SchedulePage.jsx` | 🔴 Open |
| 7 | Dev Directions — delete 500 | 500 error on delete caused by FK constraint: chapters reference the direction with no cascade | `src/components/AdminTableComponent.jsx`, backend `Relations.js` | ⚠️ Partially fixed (error message improved; backend cascade fix required) |
| 8 | Results — add 500 | 500 error when adding a result; assigned to Anastasia | `src/pages/adminPages/results.jsx` | 🟡 In progress (Anastasia) |
| 9 | Library — resource links hang | App freezes when adding a resource; link-type reference table is empty in DB — needs seed data (Article, Video, Download, Text Documentation, Other) | `src/pages/LibraryPage.jsx` | 🔴 Open (DB seed required) |
| 10 | Library — unauthenticated access | Library pages are accessible without login; features silently fail for unauthenticated users | routing / auth guards | 🔴 Open (Artem) |
| 11 | Login — frontend/backend inconsistency | Frontend always sends email as the `login` field even when user types a username; backend supports login by username OR email | `src/components/AuthModalComponent.jsx` | 🔴 Open |
| 12 | Teachers — image upload 500 | Backend now uses a two-step upload (create, then `POST /:id/upload-photo` with multer/sharp), but frontend still sends photo as base64 in the create body which the backend ignores/errors on | `src/pages/adminPages/teachers.jsx`, `src/components/AdminTableComponent.jsx` | 🔴 Open |
| 13 | FD check — orphan attributes | Validation must reject any attribute that has no incoming FD dependency (every attribute must depend on at least the PK) | `src/utils/normalizationAlgorithm.js` | 🔴 Open |
| 14 | FD check — missing PK determinant | Validation must require at least one FD whose determinant is exactly the full PK (simple or composite) | `src/utils/normalizationAlgorithm.js` | 🔴 Open |
| 15 | FD builder — no undo | No way to undo the last drawn arrow in the FD stage; user must delete the whole FD and redraw to correct a mistake | `src/components/FDToolbar.jsx`, `src/store/editorStore.js` | 🔴 Open |
| 16 | Attribute deletion — investigate | Deleting an attribute succeeds even when it is not placed on any stage; need to clarify what conditions are actually checked before allowing deletion | `src/store/editorStore.js` | 🔴 Investigate |
| 17 | FD stage — duplicate FK on link | Linking two tables (e.g. Table_1 → Item) creates an extra FK even when a FK already exists (e.g. "платеж"); seen on project id 15 | `src/components/RelationshipToolbar.jsx`, `src/store/editorStore.js` | 🔴 Investigate |
| 18 | Show FD button — static label | Button always reads "Показати ФЗ" regardless of state; label should toggle to "Сховати ФЗ" when FDs are visible | `src/components/ShowFDsToggle.jsx` | 🔴 Open |
| 19 | Editor header — undo/redo buttons | Undo/redo is wired to keyboard shortcuts but there are no clickable buttons in the editor header | `src/components/EditorHeader.jsx` | 🔴 Open |
| 20 | FD check — table with no FDs not flagged | A table with zero FDs passes validation silently instead of being treated as an error; fixed once issue 13 check is in place | `src/utils/normalizationAlgorithm.js` | 🔴 Open |
| 21 | 2NF — FD not redrawn after attribute move | Moving an attribute from one table to another in 2NF mode should auto-recreate any FD that previously involved that attribute | `src/store/editorStore.js`, `src/utils/normalizationAlgorithm.js` | 🔴 Open |
| 22 | Images — display check | Verify that teacher/resource images render correctly now that the backend serves them via `/photo/file/:filename` | `src/pages/adminPages/teachers.jsx` | 🔴 Investigate |
| 23 | 1NF — repeating groups severity | 1NF-D check severity is already `warning` in code, but the message text still says "repeating groups violate 1NF" — wording must be softened to match the non-blocking intent | `src/utils/normalizationAlgorithm.js` | ⚠️ Partially done (severity correct, message wording needs fix) |

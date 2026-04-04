# Implementation Phases — Visual DB Schema Editor

Each phase ends with a clear visual or interactive test you can perform before moving on.
API calls are deferred to the final phases — all earlier phases use mock/hardcoded data.

---

## Phase 1 — Zustand Store Skeleton + Mock Fixtures

**Build:**
- Install `zustand` and `immer`
- Create `src/store/editorStore.js` with the full state shape from SPEC.md §15 (empty arrays, correct types)
- Create `src/store/mockData.js` with realistic hardcoded fixtures: 1 project, 4 stages, 3 tables, ~8 attributes, 2 relationships, 2 FDs

**Test:**
- Open React DevTools → Zustand panel
- Confirm store shape matches SPEC.md
- Confirm mock data loads into store on editor page mount

---

## Phase 2 — My Projects Page (UI only, no API)

**Build:**
- Route `/projects` → `ProjectsPage`
- Project card grid (name, description, created date, NF progress placeholder dots)
- Empty state illustration + CTA
- "New Project" button → modal with Name + Description fields (submit just console.logs, no API)
- Link from main nav to `/projects`

**Test:**
- Open `/projects`
- See project cards rendered from `mockData.js`
- See empty state when mock data is cleared
- Open New Project modal, fill fields, submit → console.log output, modal closes

---

## Phase 3 — Editor Page Layout Shell

**Build:**
- Route `/projects/:projectId` → `EditorPage`
- `EditorToolbar` (top): project name text, disabled Save button, disabled Show FDs toggle
- `AttributePanel` (right): static placeholder list of attribute names, two disabled buttons at top
- `StageBar` (bottom): four stage buttons (0NF active by default), disabled Check NF Rules button
- `EditorCanvas` (center): gray placeholder `<div>` with "Canvas goes here" text
- "Open" button on project cards navigates to `/projects/:id`

**Test:**
- Open `/projects/1`
- See all four layout zones in correct positions
- Stage buttons are visible and clickable (no logic yet)
- Toolbar and panel are visible with correct placeholder content
- Page is responsive — no layout overflow

---

## Phase 4 — Tables on Canvas (React Flow + mock data)

**Build:**
- Install `@xyflow/react`
- Replace canvas placeholder with `<ReactFlow>` component
- `TableNode` custom node:
  - Header: table name + color bar on the left edge
  - Attribute rows: `name (data_type)`, bold + `*` suffix if `is_PK`
  - Minimum width, scrollable if many attributes
- Load mock tables as RF nodes; mock relationships as plain RF edges (no custom styling yet)
- Tables are draggable; positions update in Zustand

**Test:**
- Open `/projects/1`
- See mock tables rendered on canvas
- Drag tables — they move and stay in new position
- Pan canvas (click+drag on empty area)
- Zoom with scroll wheel

---

## Phase 5 — Relationship Edges (crow's foot)

**Build:**
- `RelationshipEdge` custom RF edge type
- Renders crow's foot notation at each end based on `cardinality_t1` / `cardinality_t2`
- Colored line using `color` field from mock data
- Replace plain edges from Phase 4 with this custom type

**Test:**
- Open `/projects/1` — see styled relationship lines between mock tables
- Verify each cardinality variant renders correctly (1, 0..1, 1..*, 0..*)
- Edge color matches mock data color

---

## Phase 6 — FD Edges (arrows + bracket visual) + Show/Hide Toggle

**Build:**
- `FDEdge` custom RF edge type:
  - Left side: individual arrows from each `FD_Start` attribute handle to each `FD_End` attribute handle
  - Right side: colored bracket grouping all `FD_End` attributes of the same FD
- Each attribute row in `TableNode` exposes a left handle (source) and right handle (target)
- "Show FDs" toggle in toolbar — hides/shows all FD edges (UI state only, not persisted)

**Test:**
- Open `/projects/1` — see FD arrows on the left side of a table
- See colored brackets on the right side grouping dependent attributes
- Click "Show FDs" toggle — FD edges disappear and reappear
- Relationship edges remain visible when FDs are hidden

---

## Phase 7 — Table Interactions (edit, delete, context menu)

**Build:**
- Right-click on table header → context menu: "Edit table", "Add relationship to..." (disabled for now), "Delete table"
- "Edit table" → `TableEditModal`: name field + 10-color palette picker → confirm updates store
- "Delete table" → removes table from current stage in store; attributes return to unused pool
- Double-click on table header → same `TableEditModal`

**Test:**
- Right-click table header → menu appears
- Edit table name → header updates immediately
- Change table color → color bar on table updates
- Delete table → table disappears from canvas
- Deleted table's attributes reappear as "unused" in the attribute panel

---

## Phase 8 — Attribute Panel — Creating Attributes

**Build:**
- Attribute panel reads `visibleAttributes(currentStageIndex)` from store
- "Add to this stage" button → `NewAttributeModal`: name + data_type select → adds to `attributePool` with `introduced_at_stage_Id` = current stage
- "Add global attribute" button → same modal but `introduced_at_stage_Id` = 0NF
- Retired attributes shown greyed-out in panel

**Test:**
- Click "Add to this stage" on 2NF stage → fill modal → attribute appears in panel for 2NF, 3NF
- Switch to 1NF → that attribute is NOT in the panel
- Click "Add global attribute" → attribute appears in panel on all stages
- Verify data_type options match SPEC.md

---

## Phase 9 — Drag Attribute → New Table

**Build:**
- Attribute items in the panel are draggable (HTML5 drag or `@dnd-kit`)
- Drop onto empty canvas area → creates a new `Table` in the current stage's store with:
  - Default name: `"Table_1"` (auto-increment)
  - Random color from palette
  - The dropped attribute as its first `TableAttribute` row

**Test:**
- Drag an attribute from panel → drop on empty canvas → new table appears
- New table has correct attribute as first row
- Attribute no longer appears as "unused" in panel (it's now placed)
- Drag a second attribute → another new table appears with sequential name

---

## Phase 10 — Drag Attribute → Existing Table

**Build:**
- Table node accepts drop events
- Dropping an attribute from the panel onto an existing table:
  - Adds it as a new `TableAttribute` row at the bottom
  - Attribute removed from unused pool in panel

**Test:**
- Drag attribute → hover over existing table (table highlights as drop target)
- Drop → attribute row appears at bottom of table
- Attribute no longer in panel unused list
- Drag a second attribute → drops into same table → both rows visible

---

## Phase 11 — Attribute Row Editing (PK, FK, alias)

**Build:**
- Double-click on an attribute row inside a table → `TableAttributeEditModal`:
  - Alias (text input)
  - Is Primary Key (checkbox) → row renders bold and special indicator to appropriate field
  - Is Foreign Key (checkbox)
- Context menu on attribute row (right-click): "Edit", "Remove from table" (returns to unused pool)

**Test:**
- Double-click attribute row → modal opens pre-filled
- Set as PK → row goes bold with `*`
- Set alias → row displays alias instead of original name
- Right-click → "Remove from table" → row disappears, attribute back in panel

---

## Phase 12 — Stage Switching + Initialization Dialog

**Build:**
- Stage bar buttons switch `currentStageIndex` in store
- Each stage has isolated tables/relationships/FDs (already in store shape)
- First-time opening an uninitialized stage → `StageInitDialog`:
  - "Start empty" → blank canvas
  - "Copy from previous stage" → deep-copies tables + layout from previous stage (no FDs/relationships copied)
- Stage button shows green dot when all checklist items for that stage are checked

**Test:**
- Build some tables in 0NF
- Click 1NF → dialog appears → "Start empty" → blank canvas
- Switch back to 0NF → tables still there
- Click 2NF → dialog → "Copy from 1NF" → tables from 1NF appear (if 1NF is empty, copies 0NF)
- Switching stages is instant with no data loss

---

## Phase 13 — Relationship Creation Flow

**Build:**
- Right-click table header → "Add relationship to..." → canvas enters selection mode:
  - Other tables highlight on hover
  - Cursor changes
  - Pressing `Escape` cancels
- Click target table → `RelationshipEditModal`:
  - Type (select)
  - Color (palette)
  - Cardinality both sides (select)
- Confirm → crow's foot edge appears on canvas
- Double-click existing relationship edge → same modal pre-filled + Delete button

**Test:**
- Right-click → "Add relationship" → canvas in selection mode (other tables glow)
- Press Escape → mode cancelled, nothing created
- Click target → modal appears → fill fields → confirm → edge appears
- Double-click edge → edit modal → change color → edge color updates
- Delete from modal → edge disappears

---

## Phase 14 — FD Drawing

**Build:**
- Drag from a left handle on an attribute row to another attribute's left handle (within the same table)
- Releasing creates a `FDEdge` config modal:
  - Color (palette)
  - Level (partial / full / transitive)
  - Which end is "start" (determinant) and which is "end" (dependent)
- Multiple attributes can be added to the same FD via the edit modal (FD_Start / FD_End lists)
- Double-click FD edge → `FDEditModal` with full start/end attribute lists + Delete
- Orphaned FD (attribute removed from table) → edge renders with warning indicator (dashed + warning icon)

**Test:**
- Drag from attribute handle → see preview edge → release on another attribute → modal appears
- Confirm → FD arrow and bracket appear
- Toggle "Show FDs" → FDs hide and show
- Add a second attribute to the FD's "end" list → bracket grows to include it
- Remove an attribute from the table that's in an FD → edge shows warning state

---

## Phase 15 — NF Violation Checklist Modal

**Build:**
- "Check NF Rules" button in stage bar → `NFViolationChecklistModal`
- Hardcoded rules per stage (see SPEC.md §12)
- Checkboxes persist in Zustand (`violationChecks` array)
- Stage button in stage bar shows a green dot when all boxes for that stage are checked

**Test:**
- Open 1NF checklist → see 4 rules, all unchecked
- Check all → modal shows all green → close → 1NF stage button shows green dot
- Reopen modal → checkboxes still checked
- Switch stage → different rules shown

---

## Phase 16 — Save State (local only, no API)

**Build:**
- "Save" button becomes active (clickable)
- Unsaved changes dot (●) appears next to Save button whenever store state changes
- Clicking Save → clears the dot → logs "saving..." to console (no real API yet)
- Autosave timer: every 30s, if dot is present, fire the same save action
- `isSaving` flag in store → Save button shows loading state during save

**Test:**
- Open editor → dot is absent (no changes)
- Drag a table → dot appears
- Click Save → dot disappears, "saving..." in console
- Wait 30s after making a change without saving → "autosave..." in console → dot clears

---

## Phase 17 — My Projects Page — API Integration

**Build:**
- Replace mock data with real API calls:
  - `GET /projects` → load project list
  - `POST /projects` → New Project modal submit creates real project → redirect to editor
  - `DELETE /projects/:id` → delete project card
- Loading state (skeleton cards)
- Error state (toast notification)

**Test:**
- Open `/projects` → real projects load from backend
- Create new project → appears in list, redirects to editor
- Delete project → removed from list
- Disconnect backend → error toast appears

---

## Phase 18 — Editor Page — Load from API

**Build:**
- On `/projects/:projectId` mount: `GET /projects/:projectId`
- Populate entire Zustand store from API response
- Loading state (spinner over canvas)
- 404 / error state

**Test:**
- Create a project via API (or Phase 17)
- Open `/projects/:id` → data loads, canvas shows correct state
- Open URL for non-existent project → error state shown

---

## Phase 19 — Editor Save — API Integration

**Build:**
- Wire Save button to `PUT /projects/:projectId/stages/:stageId` (batch save, see API.md)
- Wire autosave (30s) to same endpoint
- On save failure → non-blocking toast "Autosave failed — click Save to retry"
- Attribute create/update/retire → `POST|PUT /projects/:projectId/attributes`

**Test:**
- Build schema in editor → Save → reload page → state restored from API
- Retire an attribute → save → reload → attribute still greyed
- Disconnect backend during autosave → failure toast appears, dot remains
- Reconnect → click Save → succeeds, dot clears

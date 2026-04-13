# Visual Database Schema Editor — Feature Specification

## 1. Overview

A visual, interactive database schema editor embedded in the DBLAB student platform. Students create projects containing a schema that they manually build and refine across four normalization stages (0NF → 1NF → 2NF → 3NF). Each stage is an independent canvas snapshot. The tool teaches normalization by requiring students to manually construct each stage and self-verify NF compliance via a hardcoded checklist.

---

## 2. Tech Stack

| Concern | Choice | Rationale |
|---|---|---|
| Canvas / graph rendering | **React Flow** (`@xyflow/react` v12) | Node-based, handles edge routing, built-in pan/zoom, custom node/edge types, active community |
| Local state | **Zustand** with **immer** middleware | Single store, nested immutable updates, easy serialization for save |
| Routing | React Router (already in project) | New routes added under `/projects` |
| Styling | Co-located CSS files (project convention) | No CSS-in-JS or utility framework |
| Auth | `react-auth-kit` (existing) | Student role already distinguished via `role` field on User |

---

## 3. Routes & Navigation

```
/projects                    → ProjectsPage   (student dashboard)
/projects/new                → redirect → creates project + redirect to editor
/projects/:projectId         → EditorPage        (main editor)
```

**Entry point:** Students reach `/projects` from the main navigation (public site). Auth-protected — redirect to login if no valid token.

---

## 4. Data Model → Frontend State Mapping

```
Project
  ├── stages: Stage[4]          (0NF, 1NF, 2NF, 3NF — always exactly 4)
  │     ├── tables: Table[]
  │     │     ├── tableAttributes: TableAttribute[]  (ordered list of rows)
  │     │     └── relationships: Relationship[]      (edges to other tables)
  │     ├── fdStages: FD_Stage[]                     (which FDs are active here)
  │     └── violationChecks: boolean[]               (hardcoded rules, checked off)
  │
  └── attributes: Attribute[]   (project-level attribute pool)
        ├── introduced_at_stage_Id
        └── retired_at_stage_Id
```

**FD structure (project-level, used across stages):**
```
FunctionalDependency
  ├── fd_Id
  ├── color
  ├── level                      integer — bracket lane:
  │                              positive = left side (1=nearest, 2=next out…)
  │                              negative = right side (−1=nearest, −2=next out…)
  ├── fdStages: FD_Stage[]       (which stages include this FD)
  │     └── type: 'partial' | 'full' | 'transitive'
  ├── fdStarts: FD_Start[]       (determinant attributes)
  └── fdEnds: FD_End[]           (dependent attributes)
```

> See `SCHEMA.md` for full DB schema. The frontend store denormalizes
> `FunctionalDependency` + `FD_Stage` into a single object per stage FD entry.

---

## 5. UI Layout

```
┌──────────────────────────────────────────────────────────────┐
│  TOOLBAR: [Project Name] [Save ●] [Show FDs toggle]          │
├─────────────────────────────────────────┬────────────────────┤
│                                         │  ATTRIBUTE PANEL   │
│                                         │  ┌──────────────┐  │
│           REACT FLOW CANVAS             │  │[+] Add to    │  │
│                                         │  │    this stage│  │
│           (tables as nodes,             │  │[+] Add global│  │
│            relationships as edges,      │  ├──────────────┤  │
│            FD arrows as edges)          │  │ attr_name    │  │
│                                         │  │ attr_name    │  │
│                                         │  │ ~~retired~~  │  │
│                                         │  │ attr_name    │  │
│                                         │  └──────────────┘  │
├─────────────────────────────────────────┴────────────────────┤
│  STAGE BAR:  [ 0NF ]  [ 1NF ]  [ 2NF ]  [ 3NF ]  [✓ Check] │
└──────────────────────────────────────────────────────────────┘
```

- **Toolbar** (top): project name (editable inline), Save button (dot indicator when unsaved changes exist), Show/Hide FDs toggle button.
- **Canvas** (center-left): React Flow viewport with pan/zoom.
- **Attribute Panel** (right): scrollable list of attributes available at the current stage. Two action buttons at the top.
- **Stage Bar** (bottom): four stage buttons; active stage is highlighted. `[✓ Check NF Rules]` button opens the violation checklist modal.

---

## 6. Canvas Behavior

### Pan & Zoom
Standard React Flow pan (click+drag on empty canvas) and scroll-to-zoom. Minimap optional (deferred).

### Table Nodes
- Rendered as custom React Flow nodes with a header (table name, color swatch) and a list of attribute rows.
- Draggable anywhere on canvas; position is persisted per stage.
- Table background color comes from the table's `color` field (fixed palette).

### Drop Zones
- Each table node is a drop target.
- Dragging an attribute from the side panel:
  - **Drop onto a table** → attribute is added to that table as a new `TableAttribute` row.
  - **Drop onto empty canvas** → a new table is created with that attribute as its first row.

### Canvas Serialization
Node positions (`{x, y}`) are stored in a `layout` JSON field on each `Stage`. This is separate from the relational data so positions can be saved without re-POSTing all entities.

---

## 7. Stage System

### Stage Identifiers
The four stages correspond to `stage.form` values: `"0NF"`, `"1NF"`, `"2NF"`, `"3NF"`. They are created automatically when a project is created.

### Switching Stages
Clicking a stage button in the Stage Bar loads that stage's canvas. All pending changes to the current stage are auto-saved before switching (prompt if autosave is disabled).

### First-Time Stage Initialization
When a student navigates to a stage that has no tables yet (empty canvas), a dialog appears:

```
┌─────────────────────────────────────────────────┐
│  Initialize 2NF stage                           │
│                                                 │
│  How would you like to start?                   │
│                                                 │
│  [ Start empty ]  [ Copy from 1NF ]            │
└─────────────────────────────────────────────────┘
```

"Copy from previous stage" duplicates the tables, their attribute assignments, and layout positions from the immediately preceding stage. FDs and relationships are **not** copied (student must re-draw them for the new stage).

### Attribute Visibility Per Stage
An attribute appears in the side panel for stage `S` if:
- `introduced_at_stage_Id` ≤ S, **and**
- `retired_at_stage_Id` is null **or** `retired_at_stage_Id` > S

Retired attributes are shown **greyed-out** in the panel for stages ≥ their retirement stage. They cannot be dragged onto the canvas but their names remain visible.

---

## 8. Attribute Management

### Side Panel

| Button | Action |
|---|---|
| **Add to this stage** | Opens "New Attribute" modal. `introduced_at_stage_Id` = current stage. |
| **Add global attribute** | Same modal but `introduced_at_stage_Id` = 0NF stage. Available in all stages. |

### Attribute Modal Fields
- Name (text, required)
- Data Type (select: INT, VARCHAR, TEXT, DATE, BOOLEAN, DECIMAL, TIMESTAMP, UUID)

### Retiring an Attribute
Each attribute in the side panel has a kebab/context menu with:
- **Hide starting from this stage** → sets `retired_at_stage_Id` = current stage. The attribute disappears from canvas placement in this and later stages; shown greyed-out in the panel.

### Attribute Rows Within a Table
Double-clicking an attribute row in a table opens an edit modal:
- Alias (optional display name override)
- Is Primary Key (checkbox) — renders row in **bold** with `*` suffix
- Is Foreign Key (checkbox)
- Data type override is not supported at the TableAttribute level (inherits from Attribute)

---

## 9. Table Management

### Creating a Table
- Drag an attribute from the side panel to empty canvas → table created with a default name (e.g., `"Table_1"`) and a randomly selected palette color.
- Alternatively: double-click empty canvas → "New Table" modal, then add attributes.

### Editing a Table
Double-click on the **table header** opens a modal:
- Table Name (text, required)
- Color (fixed palette picker: 10 colors)

### Deleting a Table
Right-click on table header → **Delete table**. Attributes are returned to the "unused" pool (their `TableAttribute` records are deleted; the `Attribute` records persist).

### Context Menu on Table Header (right-click)
```
┌─────────────────────────────┐
│ ✏  Edit table               │
│ 🔗 Add relationship to...   │
│ 🗑  Delete table             │
└─────────────────────────────┘
```

---

## 10. Relationship Management

### Creating a Relationship
1. Right-click table header → **Add relationship to...**
2. Canvas enters "relationship target selection" mode (other tables highlight).
3. Student clicks the target table.
4. A **Relationship Config Modal** appears:

| Field | Type |
|---|---|
| Type | select: `identifying`, `non-identifying`, `many-to-many` |
| Color | palette picker |
| Cardinality (this table side) | select: `1`, `0..1`, `1..*`, `0..*` |
| Cardinality (target table side) | select: `1`, `0..1`, `1..*`, `0..*` |

5. Relationship is rendered as a React Flow edge in **crow's foot notation** (custom edge type).

### Editing / Deleting a Relationship
Double-click on the edge → same config modal pre-filled. Delete button in modal removes the relationship.

### Self-referential Relationships
Supported — user can select the same table as both source and target. React Flow renders a looped edge.

---

## 11. Functional Dependency Management

FDs are **within-table only** and rendered as React Flow edges between attribute-level handles.

### Architecture Note
Each attribute row in a table node exposes two React Flow **handles**:
- **Left handle** (source) — drag from here to start an FD.
- **Right handle** — used for the bracket grouping visual (target of FDs that have the same color/group).

The FD bracket visual on the right (as shown in the reference image) is rendered by a custom React Flow edge type that draws a colored bracket connecting multiple target attribute handles.

### Creating an FD
1. User drags from the **left handle** of a source attribute row.
2. Drops onto the **left handle** of a target attribute row (within the same table).
3. **FD Config Modal** appears:

| Field | Type |
|---|---|
| Color | palette picker |
| Type | select: `partial`, `full`, `transitive` (maps to `FD_Stage.type`) |
| Level | integer — bracket lane (auto-suggested, user can override) |
| This attribute is | select: `start (determinant)`, `end (dependent)` |

4. To add more attributes to the same FD (multi-attribute determinant or multiple dependents), the user can open the FD's edit modal and add additional `FD_Start` or `FD_End` entries.

### Show / Hide FDs
The toolbar **"Show FDs"** toggle button hides all FD edges from the canvas without deleting them. State is UI-only (not persisted).

### Editing / Deleting an FD
Double-click on an FD edge → FD Edit Modal with list of start/end attributes, color, level, and a delete button.

---

## 12. NF Violation Checklist

Opened via **[✓ Check NF Rules]** button in the Stage Bar. Renders as a modal panel.

### Hardcoded Rules Per Stage

**0NF — Unnormalized Form**
- [ ] All data for the domain is captured (no missing entities)
- [ ] Primary key is identified
- [ ] Repeating groups and multi-valued fields are visible and documented

**1NF — First Normal Form**
- [ ] All attribute values are atomic (no multi-valued or composite attributes)
- [ ] No repeating groups / arrays
- [ ] Every row is uniquely identified by a primary key
- [ ] Attribute names are unambiguous within each table

**2NF — Second Normal Form**
- [ ] Schema is in 1NF
- [ ] Every non-key attribute is fully functionally dependent on the entire primary key
- [ ] No partial dependencies exist (verified via FD annotations)
- [ ] Tables have been decomposed to remove partial dependencies

**3NF — Third Normal Form**
- [ ] Schema is in 2NF
- [ ] No transitive dependencies (non-key → non-key attribute dependencies)
- [ ] All transitive dependencies decomposed into separate tables
- [ ] FD annotations confirm no non-key attribute determines another non-key attribute

### Behavior
- Checkboxes are persisted per project/stage to the backend.
- Students check them off manually — no automated validation.
- The Stage Bar stage button shows a small indicator (e.g., green dot) when all rules for that stage are checked.

---

## 13. My Projects Page (`/projects`)

### Layout
- Page header: "My Projects" + "New Project" button.
- Grid of project cards. Each card shows:
  - Project name
  - Description (truncated)
  - Created date
  - NF progress indicator (which stages have all checklist items checked)
  - "Open" button → navigates to `/projects/:projectId`
- Empty state: illustration + "Create your first project" CTA.

### New Project Modal
Fields:
- Name (required)
- Description (optional, textarea)

On submit: `POST /projects` → redirect to `/projects/:projectId`.

---

## 14. Save & Autosave

### Explicit Save
- "Save" button in toolbar. Sends full stage state (tables, attributes, relationships, FDs, layout positions) to the backend via a batch update endpoint.
- Button shows an unsaved-changes dot (●) when there are pending changes.

### Autosave
- Every **30 seconds**, if there are unsaved changes, the same save operation fires silently.
- On success: dot clears. On failure: a non-blocking toast notification appears ("Autosave failed — click Save to retry").

### On Stage Switch
- Before switching stages, if there are unsaved changes, autosave fires synchronously. If it fails, the user is warned but can still switch (changes remain in Zustand and will be saved when they return).

---

## 15. Zustand Store Structure

```
EditorStore (single store, immer middleware)
│
├── project: { id, name, description }
├── currentStageIndex: 0 | 1 | 2 | 3
├── stages: StageState[4]
│     ├── stageId: string
│     ├── form: "0NF" | "1NF" | "2NF" | "3NF"
│     ├── initialized: boolean
│     ├── tables: Table[]
│     │     ├── id, name, color, position: {x,y}
│     │     └── tableAttributes: TableAttribute[]
│     │           └── id, attributeId, is_PK, is_FK, alias, order
│     ├── relationships: Relationship[]
│     │     └── id, table1Id, table2Id, type, color, cardinality_t1, cardinality_t2
│     ├── fds: FunctionalDependency[]          (denorm. FD + FD_Stage)
│     │     ├── id, color
│     │     ├── level: number                  (integer bracket lane)
│     │     ├── type: 'partial'|'full'|'transitive'
│     │     ├── starts: FD_Start[]  (attributeId)
│     │     └── ends: FD_End[]      (attributeId)
│     └── violationChecks: boolean[]   (index maps to hardcoded rule)
│
├── attributePool: Attribute[]
│     └── id, name, data_type, introduced_at_stage_Id, retired_at_stage_Id
│
└── ui: {
      showFDs: boolean,
      hasUnsavedChanges: boolean,
      isSaving: boolean,
      activeModal: null | ModalDescriptor
    }
```

**Selectors (derived):**
- `visibleAttributes(stageIndex)` — filters `attributePool` by introduced/retired stage
- `unusedAttributes(stageIndex)` — visible attributes not present in any table in this stage
- `reactFlowNodes(stageIndex)` — maps tables to RF node objects
- `reactFlowEdges(stageIndex)` — maps relationships + (if showFDs) FDs to RF edge objects

---

## 16. Component Tree

```
EditorPage
├── EditorToolbar
│     ├── ProjectNameInput
│     ├── SaveButton
│     └── ShowFDsToggle
├── EditorCanvas (React Flow Provider)
│     ├── TableNode (custom RF node)
│     │     ├── TableHeader (right-click menu, double-click edit, color indicator)
│     │     └── AttributeRow[] (left handle for FD drag, right handle for FD target)
│     ├── RelationshipEdge (custom RF edge — crow's foot)
│     └── FDEdge (custom RF edge — arrow/bracket)
├── AttributePanel
│     ├── AddToStageButton
│     ├── AddGlobalButton
│     └── AttributeItem[] (draggable, greyed if retired)
├── StageBar
│     ├── StageButton[4] (0NF/1NF/2NF/3NF with completion dot)
│     └── CheckNFRulesButton
└── Modals (rendered via portal)
      ├── TableEditModal
      ├── AttributeEditModal
      ├── TableAttributeEditModal
      ├── RelationshipEditModal
      ├── FDEditModal
      ├── NewAttributeModal
      ├── NewProjectModal
      ├── NFViolationChecklistModal
      └── StageInitDialog
```

---

## 17. Edge Cases & Decisions

| Scenario | Behavior |
|---|---|
| Drag attribute already in a table to another table | Creates a second `TableAttribute` record (same attribute can exist in multiple tables across stages) |
| Delete table with attributes that have FDs | FDs are deleted cascadingly (frontend handles cleanup in Zustand before save) |
| Relationship between a table and itself (self-referential) | Allowed; React Flow renders a looped edge |
| Student switches stage mid-drag | Drag is cancelled; unsaved changes autosave fires |
| Two attributes with the same name in the pool | Allowed (DB permits it); displayed with name + data_type to distinguish |
| Retiring an attribute that is currently placed in a table | The `TableAttribute` row remains visible in the current stage but the attribute is greyed in the panel for future stages. The student must manually remove it from tables in later stages. |
| FD whose start/end attribute is removed from a table | FD becomes "orphaned" — not rendered on the canvas. Stays in the store and re-appears if the attribute is re-added to a table. Student can delete it via the FD edit modal. |
| Copying stage with relationships pointing to deleted tables | Only relationships where both table IDs still exist are copied |
| Autosave fails | Non-blocking toast; unsaved dot remains; no data loss (Zustand still holds state) |

---

## 18. Out of Scope (MVP)

- Automated NF violation detection (algorithmic)
- Collaborative real-time editing
- Undo / redo (deferred to later)
- Export to SQL DDL or image
- Linking projects to lessons/courses
- Admin-created reference schema templates
- Minimap
- Keyboard shortcuts beyond standard browser shortcuts

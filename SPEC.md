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

- **Toolbar** (top): project name (editable inline), Save button (dot indicator when unsaved changes exist), Show/Hide FDs toggle button. When a **table node** is selected, the toolbar content is replaced by the **Table Toolbar** (see §9). When an **FD** is selected, the toolbar content is replaced by the **FD Toolbar** (see §11). Table and FD selection are mutually exclusive.
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

"Copy from previous stage" duplicates the tables, their attribute assignments, layout positions, FDs, and relationships from the immediately preceding stage. All IDs are suffixed with `-copy-{stageIndex}` and FD/relationship table references are remapped to the new table IDs.

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
**Clicking** an attribute row **selects** it (sets `ui.selectedTableAttribute`). The top toolbar is replaced by the **Attribute Row Toolbar**:

```
┌──────────────────────────────────────────────────────────┐
│  Alias: [ alias input ]  [ ☐ PK ]  [ ☐ FK ]  ✕          │
└──────────────────────────────────────────────────────────┘
```

- **Alias input**: optional display name override; placeholder shows original attribute name. Debounced 300 ms; blank value commits `null` (reverts to original name).
- **PK toggle**: marks the row as Primary Key (bold + PK badge); updates immediately.
- **FK toggle**: marks the row as Foreign Key (FK badge); updates immediately.
- **✕ button** or clicking the canvas background deselects the row and restores the default toolbar.

Selecting an attribute row clears any active table or FD selection (mutually exclusive).

Right-clicking an attribute row opens a context menu:
```
┌─────────────────────────────┐
│ 🗑  Remove from table        │
└─────────────────────────────┘
```
"Remove from table" deletes the `TableAttribute` record immediately; the attribute returns to the panel's unused pool. If the removed row was selected, the toolbar reverts to default.

---

## 9. Table Management

### Creating a Table
- Drag an attribute from the side panel to empty canvas → table created with a default name (e.g., `"Table_1"`) and a randomly selected palette color.
- Alternatively: double-click empty canvas → "New Table" modal, then add attributes.

### Editing a Table
Clicking the **table header** (the colored top bar with the table name) **selects** the table. The top toolbar is replaced by the **Table Toolbar**:

```
┌──────────────────────────────────────────────────────────┐
│  [ table name input ]  [● ● ● ● ● ● ● ● ● ●]  ✕         │
└──────────────────────────────────────────────────────────┘
```

- **Name input**: updates the table header live on each keystroke (blank values are not committed).
- **Color palette**: 10 fixed colors; clicking a swatch updates the table's border color immediately.
- **✕ button** or clicking the canvas background deselects the table and restores the default toolbar.
- Clicking an attribute row within the table clears table selection and selects the row instead.

`selectedTableId` is stored in `ui` (not persisted). It is cleared on stage switch and when the table is deleted.

### Deleting a Table
Right-click on table header → **Delete table**. Attributes are returned to the "unused" pool (their `TableAttribute` records are deleted; the `Attribute` records persist). Any FDs referencing the table's attributes are removed cascadingly.

### Context Menu on Table Header (right-click)
```
┌─────────────────────────────┐
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
- **Left handle** (source/target) — used for FDs rendered on the left side of the table (positive `level`).
- **Right handle** (source/target) — used for FDs rendered on the right side of the table (negative `level`).

Handles are half-circle tabs visible on hover, when the attribute participates in an FD, or while a connection is being drawn. The source handle turns blue during drag; a valid hover target turns lighter blue.

The FD bracket visual is rendered by a custom React Flow edge type (`FDEdge`) that draws a colored bracket outside the table: vertical spine + horizontal stubs per attribute, with arrowheads on dependent (end) attributes.

### Creating an FD
1. User drags from the **left handle** of a source attribute row to the left handle of a target row within the same table (or right-to-right for a right-side bracket).
2. On release, an FD is created **automatically** using these merge rules:

| Condition | Result |
|---|---|
| Source attribute is already a **start** in an existing FD on this side, AND the target attribute is not yet used on this side | **Extend** existing FD: target added as a new end. Same color and level. |
| Source attribute is already a start, BUT target is already used on this side | **New FD** at the next outward lane |
| Source attribute is not a start in any FD on this side | **New FD** at the next outward lane |

- **Level auto-assignment**: new FDs take `max(existing levels on this side) + 1` (lane 1, 2, 3 outward).
- **Color auto-assignment**: first color from the palette not yet used by another FD on this table+side.
- **Type** defaults to `full`; change it via the FD Toolbar after creation.

### FD Toolbar (contextual editing)
Clicking any line or spine of an FD bracket **selects** that FD and replaces the normal EditorToolbar content with the FD Toolbar:

```
┌──────────────────────────────────────────────────────────┐
│  FD:  [● color swatch ▾]  Type: [full ▾]  Level: [← 1 →]  [🗑 Delete]  ✕ │
└──────────────────────────────────────────────────────────┘
```

| Control | Behaviour |
|---|---|
| Color swatch | Opens inline 10-color palette; updates `fd.color` immediately |
| Type select | `partial \| full \| transitive`; updates `fd.type` immediately |
| Level stepper `← →` | Increments or decrements `Math.abs(level)` (min 1); sign (left/right side) is preserved |
| Delete | Removes the FD; closes toolbar |
| ✕ | Deselects FD; normal toolbar restores |

All changes are applied immediately to the store (no confirm step). Clicking on the canvas background also deselects the FD and restores the normal toolbar.

> **`selectedFDId`** is stored in `ui` (not persisted). It is cleared on stage switch.

### Show / Hide FDs
The toolbar **"Show FDs"** toggle button hides all FD edges from the canvas without deleting them. State is UI-only (not persisted).

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
      activeModal: null | ModalDescriptor,
      selectedTableId: null | string,
      selectedFDId: null | string,
      selectedTableAttribute: null | { tableId: string, tableAttributeId: string }
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
│     ├── [default mode]
│     │     ├── ProjectNameInput
│     │     ├── SaveButton
│     │     └── ShowFDsToggle
│     ├── [attribute row selected — ui.selectedTableAttribute is set]  ← highest priority
│     │     └── AttributeRowToolbar
│     │           ├── AliasInput (debounced; blank commits null)
│     │           ├── PKToggle (checkbox; updates is_PK immediately)
│     │           ├── FKToggle (checkbox; updates is_FK immediately)
│     │           └── CloseButton (clears selectedTableAttribute)
│     ├── [table selected — ui.selectedTableId is set]
│     │     └── TableToolbar
│     │           ├── NameInput (live updates table name)
│     │           ├── ColorPalette (10 swatches, immediate update)
│     │           └── CloseButton (clears selectedTableId)
│     └── [FD selected — ui.selectedFDId is set]
│           └── FDToolbar
│                 ├── ColorSwatch (inline 10-color palette)
│                 ├── TypeSelect (partial | full | transitive)
│                 ├── LevelStepper (← level →)
│                 ├── DeleteFDButton
│                 └── CloseButton (clears selectedFDId)
├── EditorCanvas (React Flow Provider)
│     ├── TableNode (custom RF node)
│     │     ├── TableHeader (right-click menu, color indicator; click selects table)
│     │     └── AttributeRow[] (left handle for left-side FDs, right handle for right-side FDs)
│     ├── RelationshipEdge (custom RF edge — crow's foot)
│     └── FDEdge (custom RF edge — bracket; click selects FD)
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
      ├── RelationshipEditModal
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
| Delete table with attributes that have FDs | FDs become orphaned — not rendered on canvas (no table hosts their attributes), but remain in the store. Student can delete them via the FD toolbar. |
| Relationship between a table and itself (self-referential) | Allowed; React Flow renders a looped edge |
| Student switches stage mid-drag | Drag is cancelled; unsaved changes autosave fires |
| Two attributes with the same name in the pool | Allowed (DB permits it); displayed with name + data_type to distinguish |
| Retiring an attribute that is currently placed in a table | The `TableAttribute` row remains visible in the current stage but the attribute is greyed in the panel for future stages. The student must manually remove it from tables in later stages. |
| FD whose start/end attribute is removed from a table | FD becomes "orphaned" — not rendered on the canvas. Stays in the store and re-appears if the attribute is re-added to a table. Student can delete it via the FD edit modal. |
| Copying stage with relationships pointing to deleted tables | Only relationships where both table IDs still exist are copied |
| Autosave fails | Non-blocking toast; unsaved dot remains; no data loss (Zustand still holds state) |
| `initialized` flag not in DB schema | `Stage.initialized` is frontend-only. At API load time (Phase 18), derive it as `tables.length > 0`. Within a session, `initializeStageEmpty` sets it to `true` in memory so the init dialog does not reappear after "Start empty" is chosen — even though no tables are saved. |

---

## 18. Out of Scope (MVP)

- Automated NF violation detection (algorithmic)
- Collaborative real-time editing
- Undo / redo (deferred to later)
- Export to SQL DDL or image
- Linking projects to lessons/courses
- Admin-created reference schema templates
- Minimap

---

## 19. Open Design Question — FD Table Ownership in the DB Schema

### Problem

In the current backend schema (`SCHEMA.md`), a `FunctionalDependency` is a project-level entity linked to stages via `FD_Stage`. Its determinant attributes are stored in `FD_Start`, which references the project-level `Attribute` pool. The same attribute (e.g. `member_id`) can appear in multiple tables within the same stage — this is intentional, as foreign-key attributes are reused across tables.

Because `FD_Stage` has no reference to a `Table`, the backend cannot determine which specific table an FD "belongs to" when start attributes are shared across tables. For example, if `member_id` exists in both `Members` and `Loans`, an FD `{member_id} → {member_name}` is ambiguous: it could belong to either table.

In the frontend this was resolved by adding a `tableId` field to the FD store object (frontend-only for now). Without it, the FD rendering and normalization checks broke: FDs from one table were incorrectly matched to another table that shared the same attribute.

### Proposed Fix

Add `table_Id` as a foreign key to `FD_Stage`:

```
FD_Stage
  fd_stage_Id  PK
  type         'partial' | 'full' | 'transitive'
  fd_Id        FK → FunctionalDependency
  stage_Id     FK → Stage
  table_Id     FK → Table   ← proposed addition
```

`FD_Stage` is the right place (not `FunctionalDependency`) because table ownership is per-stage: the same underlying FD could theoretically be reused across stages, and the owning table may differ per stage.

### Question for the Teacher

Is the proposed `table_Id` on `FD_Stage` the correct normalization decision, or should FD table ownership be derived at query time by joining through `FD_Start → Attribute → Table_Attribute → Table`? The join-based approach avoids the extra column but requires that start attributes uniquely identify one table per stage (which is not guaranteed when the same attribute is an FK in multiple tables).

---

### Те саме питання українською

**Проблема**

У поточній схемі БД (`SCHEMA.md`) `FunctionalDependency` є сутністю на рівні проєкту та зв'язується зі стадіями через `FD_Stage`. Атрибути-детермінанти зберігаються в `FD_Start`, що посилається на загальний пул атрибутів проєкту. Один і той самий атрибут (наприклад, `member_id`) може входити до кількох таблиць у межах однієї стадії — це є навмисним, оскільки атрибути зовнішніх ключів повторно використовуються в різних таблицях.

Оскільки `FD_Stage` не містить посилання на `Table`, бекенд не може визначити, якій саме таблиці належить ФЗ, якщо атрибути-детермінанти присутні в кількох таблицях. Наприклад, якщо `member_id` існує і в `Members`, і в `Loans`, то ФЗ `{member_id} → {member_name}` є неоднозначною: вона може належати будь-якій із цих таблиць.

На фронтенді це вирішено додаванням поля `tableId` до об'єкта ФЗ у стані (поки що лише на рівні клієнта). Без цього поля рендеринг ФЗ і алгоритми перевірки нормальних форм працювали некоректно: ФЗ однієї таблиці помилково зіставлялися з іншою таблицею, що мала спільний атрибут.

**Пропоноване рішення**

Додати `table_Id` як зовнішній ключ до `FD_Stage`:

```
FD_Stage
  fd_stage_Id  PK
  type         'partial' | 'full' | 'transitive'
  fd_Id        FK → FunctionalDependency
  stage_Id     FK → Stage
  table_Id     FK → Table   ← пропоноване поле
```

`FD_Stage` є правильним місцем (а не `FunctionalDependency`), оскільки належність до таблиці є контекстом конкретної стадії: одна й та сама ФЗ теоретично може бути перевикористана на різних стадіях, і таблиця-власник може змінюватись.

**Питання до викладача**

Чи є пропонований `table_Id` в `FD_Stage` правильним рішенням з точки зору нормалізації, чи належність ФЗ до таблиці має визначатися на рівні запиту через ланцюжок `FD_Start → Attribute → Table_Attribute → Table`? Підхід із JOIN-запитом дозволяє уникнути додаткового стовпця, але вимагає, щоб атрибути-детермінанти однозначно ідентифікували одну таблицю в межах стадії — що не гарантується, коли один і той самий атрибут є зовнішнім ключем у кількох таблицях.
- Keyboard shortcuts beyond standard browser shortcuts

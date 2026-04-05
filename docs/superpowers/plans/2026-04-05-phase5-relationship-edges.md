# Phase 5 — Relationship Edges Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace plain default React Flow edges with a custom `RelationshipEdge` component that renders crow's foot ER notation, anchored at attribute-row-level handles on each table node.

**Architecture:** Each attribute row in `TableNode` gets two invisible React Flow handles (`left-{ta.id}` and `right-{ta.id}`). Relationship edges use the right handle of the source attribute and the left handle of the target attribute, giving them precise row-level anchoring. `RelationshipEdge` draws an orthogonal SVG path with crow's foot cardinality markers near each table border.

**Tech Stack:** React 19, `@xyflow/react` (already installed), Zustand + immer, plain SVG (no SVG marker defs — markers are inline JSX paths)

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `PHASES.md` | Modify | Update Phase 5/6/13 to reflect design decisions from brainstorming |
| `src/store/mockData.js` | Modify | Add `ta1Id`/`ta2Id` to relationships; vary cardinalities to cover all 4 variants |
| `src/store/editorStore.js` | Modify | Add `ta1Id`/`ta2Id` to relationship shape; update `reactFlowEdges` to pass `sourceHandle`/`targetHandle` |
| `src/components/TableNode.jsx` | Modify | Add `<Handle>` (left + right) to each attribute row |
| `src/components/styles/TableNode.css` | Modify | Add `.react-flow__handle` overrides (opacity 0, no pointer-events for now) |
| `src/components/RelationshipEdge.jsx` | **Create** | Custom RF edge: orthogonal path + crow's foot SVG markers |
| `src/components/styles/RelationshipEdge.css` | **Create** | Edge path and label styles |
| `src/components/EditorCanvas.jsx` | Modify | Register `relationshipEdge` edge type; update edge mapping to pass `sourceHandle`/`targetHandle` |

---

## Task 1 — Update PHASES.md

**Files:**
- Modify: `PHASES.md`

Update Phase 5, Phase 6, and Phase 13 in PHASES.md to document the brainstorming design decisions.

- [ ] **Step 1: Replace Phase 5 Build section**

Open `PHASES.md`. Find the `## Phase 5` section. Replace the **Build** and **Test** blocks with:

```markdown
## Phase 5 — Relationship Edges (crow's foot)

**Build:**
- Add left + right `<Handle>` components (opacity 0) to each attribute row in `TableNode`
  - `id: "left-{ta.id}"` — future FD source drag handle (Phase 6)
  - `id: "right-{ta.id}"` — relationship anchor; pair: source exits right, target enters left
- Add `ta1Id` / `ta2Id` (nullable tableAttribute IDs) to Relationship shape in store + mock data
- `RelationshipEdge` custom RF edge type:
  - Orthogonal routing (`getSmoothStepPath` with `borderRadius: 0`)
  - 4 cardinality markers at each end: `'1'` `'0..1'` `'1..*'` `'0..*'`
  - Solid line for `identifying`, dashed `(6 3)` for `non-identifying`
  - Colored via `relationship.color`
- Register `relationshipEdge` in `EditorCanvas`; build edges with `sourceHandle`/`targetHandle`
- Mock data covers all 4 cardinality variants across stages

**Test:**
- Open `/projects/1` → tables render; edges connect at specific attribute rows (not table centers)
- Drag tables — edges follow and re-route correctly
- Verify all 4 cardinality variants render (1NF shows `0..1`→`1..*`, 2NF shows `1`→`0..*`)
- `identifying` relationship = solid line; `non-identifying` = dashed
- "Show FDs" toggle off → relationship edges remain, FD edges gone
```

- [ ] **Step 2: Update Phase 6 Build section**

Find `## Phase 6`. In the **Build** list, prepend this note to the attribute handle bullet:

```markdown
- Each attribute row in `TableNode` already has `left-{ta.id}` and `right-{ta.id}` handles from Phase 5 (opacity 0). Phase 6 makes left handles interactive: visible on hover, draggable to start an FD.
```

- [ ] **Step 3: Update Phase 13 relationship creation bullet**

Find `## Phase 13` (or wherever "Add relationship to..." is described). Add/replace the relationship creation flow description with:

```markdown
**Relationship creation flow (Phase 13):**
- Right-click table header → context menu → "Add relationship to..."
- Canvas enters selection mode; a preview line draws from the source table's center
- User clicks the target table → `RelationshipEditModal` opens with:
  - **From attribute** `<select>` — lists tableAttributes of source table (pre-select PK if present)
  - **To attribute** `<select>` — lists tableAttributes of target table (pre-select FK if present)
  - Type (`identifying` / `non-identifying` / `many-to-many`)
  - Color picker
  - Cardinality selectors (`cardinality_t1` / `cardinality_t2`)
- On confirm: `addRelationship(stageIndex, { ..., ta1Id, ta2Id })` — edge renders at row level
- If user leaves attribute selectors empty → `ta1Id: null, ta2Id: null` → edge falls back to table center
```

- [ ] **Step 4: Commit**

```bash
git add PHASES.md
git commit -m "docs: update PHASES.md with Phase 5/6/13 design decisions from brainstorming"
```

---

## Task 2 — Extend mock data with `ta1Id`/`ta2Id` and varied cardinalities

**Files:**
- Modify: `src/store/mockData.js`

Add `ta1Id`/`ta2Id` fields to all mock relationships. Update cardinalities to cover all 4 variants across stages.

- [ ] **Step 1: Update 1NF relationship**

In `STAGE_1NF`, replace the `relationships` array:

```js
relationships: [
    {
        id: 'rel-1-1',
        table1Id: 'tbl-1-1',
        table2Id: 'tbl-1-2',
        ta1Id: 'ta-1-1',   // Members.member_id (PK)
        ta2Id: null,        // Books has no FK for member_id in 1NF — falls back to center
        type: 'non-identifying',
        color: '#9B59B6',
        cardinality_t1: '0..1',   // varied for cardinality test coverage
        cardinality_t2: '1..*',
    },
],
```

- [ ] **Step 2: Update 2NF relationships**

In `STAGE_2NF`, replace the `relationships` array:

```js
relationships: [
    {
        id: 'rel-2-1',
        table1Id: 'tbl-2-1',
        table2Id: 'tbl-2-3',
        ta1Id: 'ta-2-1',   // Members.member_id (PK)
        ta2Id: 'ta-2-7',   // Loans.member_id (FK)
        type: 'identifying',
        color: '#9B59B6',
        cardinality_t1: '1',
        cardinality_t2: '0..*',
    },
    {
        id: 'rel-2-2',
        table1Id: 'tbl-2-2',
        table2Id: 'tbl-2-3',
        ta1Id: 'ta-2-4',   // Books.book_id (PK)
        ta2Id: 'ta-2-8',   // Loans.book_id (FK)
        type: 'identifying',
        color: '#2980B9',
        cardinality_t1: '1',
        cardinality_t2: '0..*',
    },
],
```

- [ ] **Step 3: Open dev server and verify mock data still loads**

```bash
npm run dev
```

Navigate to `http://localhost:5173/projects/1`. Open browser console — no errors. Tables and (plain) edges render.

- [ ] **Step 4: Commit**

```bash
git add src/store/mockData.js
git commit -m "feat: add ta1Id/ta2Id to mock relationships, vary cardinalities for all 4 variants"
```

---

## Task 3 — Extend store Relationship shape + `reactFlowEdges` selector

**Files:**
- Modify: `src/store/editorStore.js`

Add `ta1Id`/`ta2Id` to the relationship schema comment and update the `reactFlowEdges` selector to pass `sourceHandle`/`targetHandle`.

- [ ] **Step 1: Update the `reactFlowEdges` selector**

In `editorStore.js`, find the `reactFlowEdges(stageIndex)` method (line ~431). Replace the `relEdges` mapping inside it:

```js
const relEdges = stage.relationships.map((rel) => ({
    id: rel.id,
    type: 'relationshipEdge',
    source: rel.table1Id,
    target: rel.table2Id,
    sourceHandle: rel.ta1Id ? `right-${rel.ta1Id}` : null,
    targetHandle: rel.ta2Id ? `left-${rel.ta2Id}` : null,
    data: { relationship: rel },
}));
```

- [ ] **Step 2: Add JSDoc comment above relationship actions**

Find the `// ─── Relationship actions ───` comment block (line ~271). Add a JSDoc above it:

```js
/**
 * Relationship shape:
 * { id, table1Id, table2Id,
 *   ta1Id: string|null,  -- tableAttribute ID for source row handle (right-{ta1Id})
 *   ta2Id: string|null,  -- tableAttribute ID for target row handle (left-{ta2Id})
 *   type: 'identifying'|'non-identifying'|'many-to-many',
 *   color: string, cardinality_t1: string, cardinality_t2: string }
 */
```

- [ ] **Step 3: Verify dev server still loads without errors**

Check `http://localhost:5173/projects/1` — tables and plain edges still render (RelationshipEdge not registered yet, so React Flow will log a warning and fall back to default, which is expected).

- [ ] **Step 4: Commit**

```bash
git add src/store/editorStore.js
git commit -m "feat: update reactFlowEdges selector to pass sourceHandle/targetHandle for row-level anchoring"
```

---

## Task 4 — Add React Flow handles to TableNode attribute rows

**Files:**
- Modify: `src/components/TableNode.jsx`
- Modify: `src/components/styles/TableNode.css`

Add invisible left + right handles to every attribute row.

- [ ] **Step 1: Add Handle import to TableNode.jsx**

At the top of `src/components/TableNode.jsx`, add to the import line:

```js
import { Handle, Position } from '@xyflow/react';
```

Full import block after change:

```js
import { useMemo } from 'react';
import { Handle, Position } from '@xyflow/react';
import useEditorStore from '../store/editorStore.js';
import './styles/TableNode.css';
```

- [ ] **Step 2: Add handles inside each attribute row**

In `TableNode.jsx`, find the `return (...)` inside `sorted.map((ta) => { ... })`. Wrap the existing row `<div>` with a relative-positioned fragment and add handles. Replace the entire `sorted.map` return block:

```jsx
return (
    <div
        key={ta.id}
        className={`table-node__row${ta.is_PK ? ' table-node__row--pk' : ''}`}
    >
        <Handle
            type="source"
            position={Position.Left}
            id={`left-${ta.id}`}
            className="table-node__handle"
        />
        <div className="table-node__key-col">
            {ta.is_PK && <span className="table-node__badge table-node__badge--pk">PK</span>}
            {ta.is_FK && !ta.is_PK && <span className="table-node__badge table-node__badge--fk">FK</span>}
        </div>
        <span className="table-node__attr-name">{displayName}</span>
        <span className="table-node__attr-type">{attr.data_type}</span>
        <Handle
            type="source"
            position={Position.Right}
            id={`right-${ta.id}`}
            className="table-node__handle"
        />
    </div>
);
```

- [ ] **Step 3: Add handle styles to TableNode.css**

Append to the end of `src/components/styles/TableNode.css`:

```css
/* Attribute row handles — invisible anchors for edge connections.
   Phase 6 will make the left handle interactive (hover-visible, draggable). */
.table-node__handle {
    width: 8px;
    height: 8px;
    background: transparent;
    border: none;
    pointer-events: none;
    opacity: 0;
    min-width: unset;
    min-height: unset;
}
```

- [ ] **Step 4: Verify handles don't break layout**

Open `http://localhost:5173/projects/1`. Tables should look exactly the same visually — no extra dots or spacing. Open React DevTools → confirm each row in `TableNode` renders two Handle elements.

- [ ] **Step 5: Commit**

```bash
git add src/components/TableNode.jsx src/components/styles/TableNode.css
git commit -m "feat: add invisible left/right handles to TableNode attribute rows"
```

---

## Task 5 — Create RelationshipEdge component

**Files:**
- Create: `src/components/RelationshipEdge.jsx`
- Create: `src/components/styles/RelationshipEdge.css`

Custom edge: orthogonal SVG path + crow's foot markers at each end.

- [ ] **Step 1: Create RelationshipEdge.css**

Create `src/components/styles/RelationshipEdge.css`:

```css
.relationship-edge__path {
    fill: none;
    stroke-linecap: square;
}

.relationship-edge__path--dashed {
    stroke-dasharray: 6 3;
}
```

- [ ] **Step 2: Create RelationshipEdge.jsx**

Create `src/components/RelationshipEdge.jsx`:

```jsx
import { getSmoothStepPath, Position } from '@xyflow/react';
import './styles/RelationshipEdge.css';

/**
 * Draws crow's foot cardinality markers.
 * @param {number} x      - Handle X (sourceX or targetX)
 * @param {number} y      - Handle Y (sourceY or targetY)
 * @param {'right'|'left'} side - Which side of the table the handle is on
 * @param {string} cardinality  - '1' | '0..1' | '1..*' | '0..*'
 * @param {string} color
 */
function CardinalityMarker({ x, y, side, cardinality, color }) {
    // d: +1 means we draw markers extending rightward (away from a right-side handle)
    //    -1 means we draw markers extending leftward (away from a left-side handle)
    const d = side === 'right' ? 1 : -1;

    // Positions of marker elements along the path
    const bar1X = x + d * 6;    // first vertical bar
    const bar2X = x + d * 13;   // second vertical bar (used by '1' and '1..*')
    const footX = x + d * 16;   // tip of crow's foot spread lines
    const circleX = x + d * 20; // center of circle (for 0-based cardinalities)

    const sw = 2;      // stroke width for bars/lines
    const halfH = 8;   // half-height of vertical bars
    const spread = 8;  // vertical spread of crow's foot tips

    const sharedProps = { stroke: color, strokeWidth: sw, strokeLinecap: 'square' };

    switch (cardinality) {
        case '1':
            // Two parallel vertical bars (mandatory one)
            return (
                <g>
                    <line x1={bar1X} y1={y - halfH} x2={bar1X} y2={y + halfH} {...sharedProps} />
                    <line x1={bar2X} y1={y - halfH} x2={bar2X} y2={y + halfH} {...sharedProps} />
                </g>
            );

        case '0..1':
            // Circle + one vertical bar (zero or one)
            return (
                <g>
                    <circle cx={circleX} cy={y} r={4} fill="white" stroke={color} strokeWidth={sw} />
                    <line x1={bar1X} y1={y - halfH} x2={bar1X} y2={y + halfH} {...sharedProps} />
                </g>
            );

        case '1..*':
            // One bar + crow's foot lines (one or many)
            return (
                <g>
                    <line x1={bar1X} y1={y - halfH} x2={bar1X} y2={y + halfH} {...sharedProps} />
                    <line x1={bar2X} y1={y} x2={footX} y2={y - spread} {...sharedProps} />
                    <line x1={bar2X} y1={y} x2={footX} y2={y + spread} {...sharedProps} />
                    <line x1={bar2X} y1={y} x2={footX} y2={y} {...sharedProps} />
                </g>
            );

        case '0..*':
            // Circle + crow's foot lines (zero or many)
            return (
                <g>
                    <circle cx={circleX} cy={y} r={4} fill="white" stroke={color} strokeWidth={sw} />
                    <line x1={bar1X} y1={y} x2={footX} y2={y - spread} {...sharedProps} />
                    <line x1={bar1X} y1={y} x2={footX} y2={y + spread} {...sharedProps} />
                    <line x1={bar1X} y1={y} x2={footX} y2={y} {...sharedProps} />
                </g>
            );

        default:
            return null;
    }
}

const RelationshipEdge = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
}) => {
    const { relationship } = data;
    const {
        color = '#9B59B6',
        type: relType = 'non-identifying',
        cardinality_t1 = '1',
        cardinality_t2 = '0..*',
    } = relationship;

    const isDashed = relType === 'non-identifying';

    const [edgePath] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        borderRadius: 0,   // sharp orthogonal corners
        offset: 30,        // minimum horizontal run before bending
    });

    // Source position is Position.Right → side 'right'
    // Target position is Position.Left → side 'left'
    const sourceSide = sourcePosition === Position.Right ? 'right' : 'left';
    const targetSide = targetPosition === Position.Left ? 'left' : 'right';

    return (
        <>
            <path
                id={id}
                className={`relationship-edge__path${isDashed ? ' relationship-edge__path--dashed' : ''}`}
                d={edgePath}
                stroke={color}
                strokeWidth={2.5}
            />
            <CardinalityMarker
                x={sourceX}
                y={sourceY}
                side={sourceSide}
                cardinality={cardinality_t1}
                color={color}
            />
            <CardinalityMarker
                x={targetX}
                y={targetY}
                side={targetSide}
                cardinality={cardinality_t2}
                color={color}
            />
        </>
    );
};

export default RelationshipEdge;
```

- [ ] **Step 3: Verify the file has no syntax errors**

```bash
npm run lint
```

Expected: no errors related to `RelationshipEdge.jsx`.

- [ ] **Step 4: Commit**

```bash
git add src/components/RelationshipEdge.jsx src/components/styles/RelationshipEdge.css
git commit -m "feat: create RelationshipEdge component with crow's foot SVG markers"
```

---

## Task 6 — Wire RelationshipEdge into EditorCanvas

**Files:**
- Modify: `src/components/EditorCanvas.jsx`

Register the custom edge type and update the edges `useMemo` to use `'relationshipEdge'` and pass handle IDs.

- [ ] **Step 1: Import RelationshipEdge**

In `EditorCanvas.jsx`, add the import after the existing imports:

```js
import RelationshipEdge from './RelationshipEdge.jsx';
```

- [ ] **Step 2: Register edgeTypes at module level**

In `EditorCanvas.jsx`, directly below the existing `const nodeTypes = { ... }` block (line ~10), add:

```js
// edgeTypes must be defined at module level — same reason as nodeTypes.
const edgeTypes = {
    relationshipEdge: RelationshipEdge,
};
```

- [ ] **Step 3: Update the edges useMemo — relationship mapping**

Find the `const edges = useMemo(() => {` block. Replace the `relEdges` mapping:

```js
const relEdges = relationships.map((rel) => ({
    id: rel.id,
    type: 'relationshipEdge',
    source: rel.table1Id,
    target: rel.table2Id,
    sourceHandle: rel.ta1Id ? `right-${rel.ta1Id}` : null,
    targetHandle: rel.ta2Id ? `left-${rel.ta2Id}` : null,
    data: { relationship: rel },
}));
```

- [ ] **Step 4: Pass edgeTypes to ReactFlow**

In the `<ReactFlow ... >` JSX, add the `edgeTypes` prop:

```jsx
<ReactFlow
    nodes={localNodes}
    edges={edges}
    nodeTypes={nodeTypes}
    edgeTypes={edgeTypes}
    onNodesChange={onNodesChange}
    onNodeDragStart={handleNodeActivate}
    onNodeDragStop={handleNodeDragStop}
    onNodeClick={handleNodeActivate}
    fitView
    fitViewOptions={{ padding: 0.2 }}
    minZoom={0.2}
    maxZoom={2}
    panOnScroll={false}
    zoomOnScroll={true}
    panOnDrag={true}
    deleteKeyCode={null}
    selectionKeyCode={null}
>
```

- [ ] **Step 5: Visual verification**

Open `http://localhost:5173/projects/1`. Switch to each stage:

**1NF stage** — expect:
- One purple edge between Members and Books
- Source end (Members side): `0..1` marker (circle + one bar)
- Target end (Books side): `1..*` marker (bar + crow's foot)
- Dashed line (non-identifying)
- Edge connects at `ta-1-1` row on Members (member_id), Books side connects to center (ta2Id is null)

**2NF stage** — expect:
- Purple edge: Members.member_id → Loans.member_id (FK row)
  - Source: `1` (two bars), target: `0..*` (crow's foot + circle)
  - Solid line (identifying)
- Blue edge: Books.book_id → Loans.book_id (FK row)
  - Source: `1` (two bars), target: `0..*` (crow's foot + circle)
  - Solid line (identifying)
- Drag any table — edges re-route correctly

**FD toggle** — toggle "Show FDs" off → relationship edges remain visible.

- [ ] **Step 6: Commit**

```bash
git add src/components/EditorCanvas.jsx
git commit -m "feat: register RelationshipEdge type in EditorCanvas, wire row-level handles"
```

---

## Task 7 — Final verification pass

No code changes — confirm all spec requirements are met.

- [ ] **Step 1: Verify all 4 cardinality variants**

In 1NF: hover near the edge. The Members end shows circle+bar (`0..1`), Books end shows bar+crow's foot (`1..*`).
In 2NF: both relationships show two-bar `1` on the PK side and circle+crow's foot `0..*` on the FK side.

All 4 variants rendered: `1`, `0..1`, `1..*`, `0..*` ✓

- [ ] **Step 2: Verify line styles**

1NF relationship (non-identifying) → dashed line ✓
2NF relationships (identifying) → solid lines ✓

- [ ] **Step 3: Verify edge routing**

Drag Members table far left or below Loans. Edge should re-route orthogonally (right-angle bends, no diagonals or bezier curves).

- [ ] **Step 4: Verify FD edges unaffected**

Turn "Show FDs" on (if toggle is available). FD edges still render as plain `type: 'default'` (they will be replaced in Phase 6) — this is expected and not a regression.

- [ ] **Step 5: Run linter**

```bash
npm run lint
```

Expected: 0 errors, 0 warnings related to Phase 5 files.

- [ ] **Step 6: Final commit (if any cleanup needed)**

```bash
git add -p   # review any outstanding changes
git commit -m "feat: Phase 5 complete — relationship edges with crow's foot notation"
```

---

## Self-Review Notes

- **Spec coverage:** All sections covered — handles (Task 4), store shape (Task 3), mock data (Task 2), RelationshipEdge (Task 5), EditorCanvas wiring (Task 6), PHASES.md (Task 1).
- **Type consistency:** `ta1Id`/`ta2Id` used consistently in mockData, store comment, and EditorCanvas edges mapping. Handle IDs: `right-${ta.id}` and `left-${ta.id}` — consistent in TableNode and edge sourceHandle/targetHandle.
- **No placeholders:** All code blocks contain complete, runnable code.
- **Phase 6 readiness:** Left handles exist in DOM from Task 4 — Phase 6 only needs to add CSS hover + pointer-events to make them interactive. No structural changes needed.
- **Many-to-many:** The `relType === 'many-to-many'` case renders two crow's foot ends (both use cardinality_t1/t2 markers independently — `CardinalityMarker` handles any value from either end, so no special case needed).

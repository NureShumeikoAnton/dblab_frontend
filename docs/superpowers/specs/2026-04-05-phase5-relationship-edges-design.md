# Phase 5 — Relationship Edges Design Spec

**Date:** 2026-04-05  
**Branch:** feat/normalization-ui  
**Scope:** RelationshipEdge custom React Flow component + TableNode handle infrastructure

---

## Context

Phase 4 left relationship edges rendering as plain `type: 'default'` React Flow lines. Phase 5 replaces these with a custom `RelationshipEdge` component that renders crow's foot ER notation. During brainstorming, the original spec's table-center connection approach was revised to attribute-row-level anchors — relationships now connect at the specific attribute rows (e.g. PK row → FK row), making the schema semantically readable.

---

## Core Design Decisions

### 1. Shared handles per attribute row
Every attribute row in `TableNode` gets **two React Flow handles**:
- **Left handle** — `id: "left-{attributeId}"` — used by FD flow (Phase 6, drag to start FD)
- **Right handle** — `id: "right-{attributeId}"` — used by relationship flow (Phase 5/13)

Same physical handle, workflow decides which edge type is created. No separate handle sets needed.

### 2. Relationship vs FD visual distinction

| Property | Relationship edge | FD edge (Phase 6) |
|---|---|---|
| Stroke width | 2.5px | 1.5px |
| Line style | Solid (non-identifying: dashed) | Thin arrow |
| Notation | Crow's foot cardinality markers | None |
| Color | `relationship.color` field | `fd.color` field |
| Creation | Right-click → modal | Drag from left handle |
| Cross-table? | Yes | No (within same table) |

### 3. Orthogonal routing with straight exit segment
Edge path: **5–10px straight horizontal exit** from handle, then orthogonal bends to target.

```
  handle ──────┐
               │
               └──────── target
```

This ensures crow's foot perpendicular bars are always drawn at 90° and look clean regardless of table layout. Implemented by passing `type: 'step'` or a custom orthogonal path to `getSmoothStepPath` / manual SVG path construction with an initial horizontal offset.

### 4. Store shape update
Add `attr1Id` and `attr2Id` (nullable strings) to the `Relationship` object:

```js
{
  id, table1Id, table2Id,
  attr1Id: string | null,   // ← new: source attribute row handle
  attr2Id: string | null,   // ← new: target attribute row handle
  type: 'identifying' | 'non-identifying' | 'many-to-many',
  color, cardinality_t1, cardinality_t2
}
```

`attr1Id` / `attr2Id` are nullable to support backwards compatibility. When null, the edge falls back to connecting at the table center (default React Flow behavior).

### 5. Crow's foot notation

Four cardinality variants rendered as SVG markers at each end of the edge:

| Value | Marker | Visual |
|---|---|---|
| `'1'` | Single bar | `\|` |
| `'0..1'` | Circle + bar | `○\|` |
| `'1..*'` | Crow's foot + bar | `>\|` |
| `'0..*'` | Crow's foot + circle | `>○` |

Markers drawn in the `RelationshipEdge` SVG component, 8–12px from the handle exit point, on top of the initial straight exit segment.

Relationship type maps to line style:
- `identifying` → solid line
- `non-identifying` → dashed line (`stroke-dasharray: "6 3"`)
- `many-to-many` → crow's foot on both ends

---

## Files to Create / Modify

| File | Action | What changes |
|---|---|---|
| `src/components/TableNode.jsx` | Modify | Add `<Handle>` components (left + right) to each attribute row |
| `src/components/styles/TableNode.css` | Modify | Handle dot styles (faint by default, colored when edge attached) |
| `src/components/RelationshipEdge.jsx` | **Create** | Custom RF edge: orthogonal path + crow's foot SVG markers |
| `src/components/styles/RelationshipEdge.css` | **Create** | Edge and marker styles |
| `src/components/EditorCanvas.jsx` | Modify | Register `relationshipEdge` edge type; pass `sourceHandle`/`targetHandle` from relationship data |
| `src/store/editorStore.js` | Modify | Add `attr1Id`/`attr2Id` to Relationship shape + `addRelationship`/`updateRelationship` actions |
| `src/store/mockData.js` | Modify | Add `attr1Id`/`attr2Id` to mock relationships (PK→FK pairings) |

---

## PHASES.md Changes Required

### Phase 5 — update test criteria to reflect:
- Tables rendered with left + right handles on each attribute row
- Relationships connect at attribute row level (not table center)
- All 4 cardinality variants visible in mock data
- Crow's foot markers render at correct Y position (row-level)
- Orthogonal routing with straight exit

### Phase 6 — note that left handles already exist (from Phase 5); FD drag uses them
- No need to add new handles in Phase 6, just wire the drag event

### Phase 13 — relationship creation flow update:
- Right-click header → "Add relationship to..."
- Canvas enters selection mode, preview line from **table center** (not row level)
- Click target table → `RelationshipEditModal` opens with:
  - **From attribute** dropdown (attrs in source table)
  - **To attribute** dropdown (attrs in target table)
  - Type, color, cardinality fields (existing spec)
- On confirm: edge created with `sourceHandle: "right-{attr1Id}"`, `targetHandle: "right-{attr2Id}"`
  - If user leaves attribute selectors empty → `attr1Id`/`attr2Id` = null → edge connects at table center (fallback)

---

## Implementation Notes

### Handle rendering in TableNode
```jsx
import { Handle, Position } from '@xyflow/react';

// Inside each attribute row:
<Handle
  type="source"
  position={Position.Left}
  id={`left-${ta.attributeId}`}
  style={{ opacity: 0 }}   // hidden; Phase 6 will make it interactive on hover
/>
<Handle
  type="source"
  position={Position.Right}
  id={`right-${ta.attributeId}`}
  style={{ opacity: 0 }}   // hidden; colored dot appears when edge is attached
/>
```

Both handles are typed as `"source"` — React Flow allows source→source connections when edges are created programmatically (not via drag). This avoids the source/target distinction causing issues with Phase 13's programmatic edge creation.

### Edge path construction in RelationshipEdge
Use `getStraightPath` or manual SVG for the initial 8px exit, then `getSmoothStepPath` with `borderRadius: 0` for orthogonal bends:

```jsx
// Pseudo-code for exit offset
const exitOffset = 8;
const adjustedSourceX = isSourceRight ? sourceX + exitOffset : sourceX - exitOffset;
// Then use getSmoothStepPath(adjustedSourceX, sourceY, ...) with borderRadius: 0
```

### EditorCanvas edge mapping
```js
const relEdges = relationships.map((rel) => ({
  id: rel.id,
  type: 'relationshipEdge',
  source: rel.table1Id,
  target: rel.table2Id,
  sourceHandle: rel.attr1Id ? `right-${rel.attr1Id}` : null,
  targetHandle: rel.attr2Id ? `right-${rel.attr2Id}` : null,
  data: { relationship: rel },
}));
```

---

## Verification (Phase 5 complete when)

1. Open `/projects/1` → mock tables render; attribute rows have invisible handles on left + right (opacity: 0 — anchors only, no visible dots in Phase 5)
2. Three mock tables connected by colored crow's foot edges at attribute row level
3. All 4 cardinality variants are represented in mock data and render correctly
4. Orthogonal routing: edges exit horizontally before bending
5. Non-identifying relationship renders as dashed line
6. Identifying relationship renders as solid line
7. Drag tables → edges follow and re-render correctly
8. "Show FDs" toggle is off → no FD edges; relationship edges remain

# UPDATE_01 — Add Detailed Diff to ConflictResolutionModal

## Goal

Currently the modal shows only counts (N tables, N FDs). This update adds a line-by-line diff so the user can see **exactly what changed** before picking a version.

---

## What data is available

Both sides are already in memory when the modal opens:

| Side | Variable in `EditorPage.jsx` | Shape |
|---|---|---|
| Server | `conflictData.rawApiData` (raw) / run through `deserializeFromAPI` | `{ project, attributePool, stages }` |
| Local | `conflictData.localData.snapshot` | `{ attributePool, stages }` — same shape |

`attributePool[i]` = `{ id, name, data_type, introduced_at_stage_Id }`  
`stages[i].tables[j]` = `{ name, color, tableAttributes: [{ attributeId, is_PK, is_FK, alias }] }`  
`stages[i].fds[k]` = `{ level, type, tableId, starts: [{ attributeId }], ends: [{ attributeId }] }`  
`stages[i].relationships[k]` = `{ type, cardinality_t1, cardinality_t2, table1Id, table2Id }`

Both sides use the same field names after deserialization — direct comparison works.

---

## Step 1 — Write a diff function in `serializer.js`

Add `buildDiff(serverDeserialized, localData)` below `compareStructural`.

```js
export function buildDiff(serverDeserialized, localData) {
    const srv = serverDeserialized;
    const loc = localData?.snapshot;
    if (!loc) return null;

    // Helper: diff two arrays by a key string
    const diffByKey = (a, b, keyFn, labelFn) => {
        const aKeys = new Map(a.map(x => [keyFn(x), x]));
        const bKeys = new Map(b.map(x => [keyFn(x), x]));
        const added    = b.filter(x => !aKeys.has(keyFn(x))).map(x => ({ type: 'added',   label: labelFn(x) }));
        const removed  = a.filter(x => !bKeys.has(keyFn(x))).map(x => ({ type: 'removed', label: labelFn(x) }));
        return [...removed, ...added];
    };

    // Attribute pool diff
    const attrDiff = diffByKey(
        srv.attributePool, loc.attributePool,
        a => `${a.name}:${a.data_type}`,
        a => `${a.name} (${a.data_type})`
    );

    // Per-stage diffs
    const stageDiffs = srv.stages.map((srvStage, i) => {
        const locStage = loc.stages[i] ?? { tables: [], fds: [], relationships: [] };

        const tableDiff = diffByKey(
            srvStage.tables, locStage.tables,
            t => t.name,
            t => t.name
        );

        // FD diff — key by table name + sorted attribute list
        const attrName = (pool, attrId) =>
            pool.find(a => a.id === attrId)?.name ?? attrId;

        const fdKey = (pool, fd) => {
            const starts = fd.starts.map(s => attrName(pool, s.attributeId)).sort().join(',');
            const ends   = fd.ends.map(e => attrName(pool, e.attributeId)).sort().join(',');
            return `${starts}->${ends}`;
        };

        const fdDiff = diffByKey(
            srvStage.fds, locStage.fds,
            fd => fdKey(srv.attributePool, fd),
            fd => fdKey(srv.attributePool, fd)  // label same as key here
        );

        return { form: srvStage.form, tableDiff, fdDiff };
    });

    return { attrDiff, stageDiffs };
}
```

Export it alongside `compareStructural`.

---

## Step 2 — Pass diff data through `conflictData`

In `EditorPage.jsx`, import `buildDiff` and compute it when a conflict is detected:

```js
import { loadFromLocal, deserializeFromAPI, compareStructural, buildDiff } from '../utils/serializer.js';

// inside the .then() branch where hasConflict is true:
const diff = buildDiff(serverDeserialized, localData);
setConflictData({ rawApiData, localData, serverSummary, localSummary, diff });
```

---

## Step 3 — Add a `DiffSection` to `ConflictResolutionModal.jsx`

Add a new section between the column summary and the action buttons.

```jsx
const DiffLine = ({ type, label }) => (
    <div className={`crm-diff-line crm-diff-line--${type}`}>
        <span className="crm-diff-line__sign">{type === 'added' ? '+' : '−'}</span>
        {label}
    </div>
);

const DiffSection = ({ diff }) => {
    if (!diff) return null;

    const hasAttrChanges = diff.attrDiff.length > 0;
    const stagesWithChanges = diff.stageDiffs.filter(
        s => s.tableDiff.length > 0 || s.fdDiff.length > 0
    );
    if (!hasAttrChanges && stagesWithChanges.length === 0) return null;

    return (
        <div className="crm-diff">
            <div className="crm-diff__title">What changed (local vs server)</div>
            {hasAttrChanges && (
                <div className="crm-diff__group">
                    <div className="crm-diff__group-label">Attributes</div>
                    {diff.attrDiff.map((d, i) => <DiffLine key={i} {...d} />)}
                </div>
            )}
            {stagesWithChanges.map(s => (
                <div key={s.form} className="crm-diff__group">
                    <div className="crm-diff__group-label">{s.form}</div>
                    {s.tableDiff.map((d, i) => (
                        <DiffLine key={`t${i}`} type={d.type} label={`Table: ${d.label}`} />
                    ))}
                    {s.fdDiff.map((d, i) => (
                        <DiffLine key={`f${i}`} type={d.type} label={`FD: ${d.label}`} />
                    ))}
                </div>
            ))}
        </div>
    );
};
```

In `ConflictResolutionModal`, accept `diff` as a prop and render `<DiffSection diff={diff} />` between `.crm-columns` and `.crm-actions`.

In `EditorPage.jsx`, pass it:
```jsx
<ConflictResolutionModal
    ...
    diff={conflictData.diff}
/>
```

---

## Step 4 — Add CSS for the diff section

Add to `ConflictResolutionModal.css`:

```css
.crm-diff {
    border-top: 1px solid #e2e8f0;
    padding-top: 18px;
    margin-bottom: 24px;
}

.crm-diff__title {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: var(--text-light);
    margin-bottom: 12px;
}

.crm-diff__group {
    margin-bottom: 10px;
}

.crm-diff__group-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-color);
    margin-bottom: 4px;
}

.crm-diff-line {
    display: flex;
    align-items: baseline;
    gap: 6px;
    font-size: 12px;
    padding: 2px 0;
    font-family: monospace;
}

.crm-diff-line--added   { color: #16a34a; }
.crm-diff-line--removed { color: #dc2626; }

.crm-diff-line__sign {
    font-weight: 700;
    width: 10px;
    flex-shrink: 0;
}
```

---

## Notes

- The diff is **local vs server** — green `+` means "exists in local, not in server"; red `−` means "exists in server, not in local".
- FD keys use attribute **names** (not IDs) so the diff is human-readable.
- If the diff section gets too long, wrap `.crm-diff` in `max-height: 200px; overflow-y: auto;`.
- Relationship diffs are not included above but can be added with the same `diffByKey` pattern, keying by `type + cardinality + table names`.

/**
 * Serializer — converts Zustand editor store state to the API payload format and back.
 *
 * PUT /project/updateProjectFull/:id uses sequential 1-based integers as cross-reference
 * keys (not UUIDs). Field names also differ from the store (colour vs color, ispk vs is_PK, etc).
 * See SPEC_API_NEW.md for the full mapping.
 *
 * Fields NOT included in the API payload (localStorage-only or derived on load):
 *   - table.position          → localStorage
 *   - tableAttribute.order    → derived from array index on load
 *   - stage.initialized       → derived from tables.length > 0 on load
 *   - stage.violationChecks   → localStorage only
 *   - fd.type                 → not persisted (no DB column); always null after reload
 *   - attr.retired_at_stage_Id → not in DB model; always null after reload
 */

const localKey = (projectId) => `dblab_editor_${projectId}`;

// Maps store stageId strings to the 1-based integer the backend expects for
// introduced_at_stage_id on the PUT payload.
const STAGE_INDEX = {
    'stage-1nf': 1,
    'stage-fds': 2,
    'stage-2nf': 3,
    'stage-3nf': 4,
};

/**
 * Returns the project metadata payload for PUT /project/:id.
 */
export function serializeProjectMeta(store) {
    const { project } = store;
    return {
        name: project.name,
        description: project.description,
    };
}

/**
 * Returns the content payload for PUT /project/updateProjectFull/:id.
 *
 * All local UUIDs are replaced with sequential 1-based integers so the backend
 * can resolve cross-references within the same transaction.
 */
export function serializeForAPI(store) {
    const { attributePool, stages } = store;

    // attr local id → sequential integer (1-based)
    const attrIndexMap = {};
    attributePool.forEach((attr, i) => {
        attrIndexMap[attr.id] = i + 1;
    });

    // table local id → sequential integer (1-based, ordered across all stages)
    const tableIndexMap = {};
    let tableCounter = 0;
    stages.forEach((stage) => {
        stage.tables.forEach((table) => {
            tableCounter++;
            tableIndexMap[table.id] = tableCounter;
        });
    });

    return {
        attributePool: attributePool.map((attr, i) => ({
            attribute_id: i + 1,
            name: attr.name,
            data_type: attr.data_type,
            introduced_at_stage_id: STAGE_INDEX[attr.introduced_at_stage_Id] ?? 1,
        })),
        stages: stages.map((stage) => ({
            form: stage.form,
            tables: stage.tables.map((table) => ({
                name: table.name,
                colour: table.color,
                tableAttributes: [...table.tableAttributes]
                    .sort((a, b) => a.order - b.order)
                    .map((ta) => ({
                        attribute_id: attrIndexMap[ta.attributeId],
                        ispk: ta.is_PK,
                        isfk: ta.is_FK,
                        pseudonim: ta.alias ?? null,
                    })),
            })),
            relationships: stage.relationships.map((rel) => ({
                type: rel.type,
                colour: rel.color,
                cardinal1: rel.cardinality_t1,
                cardinal2: rel.cardinality_t2,
                table1_id: tableIndexMap[rel.table1Id],
                table2_id: tableIndexMap[rel.table2Id],
            })),
            fds: stage.fds.map((fd) => ({
                colour: fd.color,
                level: fd.level,
                type: fd.type,
                table_id: tableIndexMap[fd.tableId],
                starts: fd.starts.map((s) => ({ attribute_id: attrIndexMap[s.attributeId] })),
                ends:   fd.ends.map((e)   => ({ attribute_id: attrIndexMap[e.attributeId] })),
            })),
        })),
    };
}

/**
 * Converts the GET /project/:id response into the shape the editor store expects.
 *
 * Key transformations:
 *   - fds are nested inside table objects in the response → lifted to stage.fds[]
 *   - tableAttribute.order is absent → derived from array index
 *   - table.position is absent → set to {x:0,y:0} (overridden by loadLocalState)
 *   - stage.violationChecks is absent → set to [] (overridden by loadLocalState)
 *   - fd.type is undefined (not in DB) → defaulted to null
 */
export function deserializeFromAPI(data) {
    const project = {
        id: data.project_Id,
        name: data.name,
        description: data.description,
    };

    // Sort by numeric ID suffix so the pool is always in insertion/sequential order
    // regardless of how Sequelize/MySQL returns rows when multiple hasMany are JOINed.
    const numId = (prefixedId, prefix) =>
        parseInt(prefixedId?.replace(prefix, '') ?? '0', 10);

    const attributePool = (data.attributePool ?? [])
        .slice()
        .sort((a, b) => numId(a.id, 'attr-') - numId(b.id, 'attr-'))
        .map((attr) => ({
            id: attr.id,
            name: attr.name,
            data_type: attr.data_type,
            introduced_at_stage_Id: attr.introduced_at_stage_Id,
            retired_at_stage_Id: attr.retired_at_stage_Id ?? null,
        }));

    const stages = (data.stages ?? []).map((stage) => {
        // Lift FDs from inside each table object up to the stage level
        const allFds = (stage.tables ?? []).flatMap((table) =>
            (table.fds ?? []).map((fd) => ({
                id: fd.id,
                color: fd.color,
                level: fd.level,
                type: fd.type ?? null,
                tableId: fd.tableId,
                starts: fd.starts ?? [],
                ends:   fd.ends   ?? [],
            }))
        );

        const tables = (stage.tables ?? []).map((table, tableIndex) => ({
            id: table.id,
            name: table.name,
            color: table.color,
            position: { x: tableIndex * 280, y: 80 }, // default grid; overridden by loadLocalState
            tableAttributes: (table.tableAttributes ?? [])
                .slice()
                .sort((a, b) => numId(a.id, 'ta-') - numId(b.id, 'ta-'))
                .map((ta, i) => ({
                    id: ta.id,
                    attributeId: ta.attributeId,
                    is_PK: ta.is_PK,
                    is_FK: ta.is_FK,
                    alias: ta.alias ?? null,
                    order: i,
                })),
        }));

        return {
            stageId: stage.stageId,
            form: stage.form,
            initialized: tables.length > 0,
            tables,
            relationships: stage.relationships ?? [],
            fds: allFds,
            violationChecks: [],
        };
    });

    return { project, attributePool, stages };
}

/**
 * Persists positions, violationChecks, and a full structural snapshot to localStorage.
 * Positions are keyed by table name (not ID) because IDs change on every server save.
 */
export function serializeToLocal(projectId, store) {
    const { stages, attributePool } = store;
    const positions = {};
    const violationChecks = {};

    stages.forEach((stage, i) => {
        positions[i] = {};
        stage.tables.forEach((table) => {
            if (table.position) {
                // Key by table name, not ID — IDs change after every server save (delete+reinsert).
                positions[i][table.name] = { x: table.position.x, y: table.position.y };
            }
        });
        violationChecks[i] = [...stage.violationChecks];
    });

    const snapshot = {
        attributePool: attributePool.map(({ id, name, data_type, introduced_at_stage_Id, retired_at_stage_Id }) => ({
            id, name, data_type, introduced_at_stage_Id, retired_at_stage_Id: retired_at_stage_Id ?? null,
        })),
        stages: stages.map((stage) => ({
            stageId: stage.stageId,
            form: stage.form,
            initialized: stage.initialized,
            tables: stage.tables.map(({ id, name, color, tableAttributes }) => ({ id, name, color, tableAttributes })),
            relationships: stage.relationships,
            fds: stage.fds,
        })),
    };

    try {
        localStorage.setItem(
            localKey(projectId),
            JSON.stringify({ lastSavedAt: new Date().toISOString(), snapshot, positions, violationChecks })
        );
    } catch {
        // Quota exceeded or private browsing — silently ignore
    }
}

// ─── Conflict detection ───────────────────────────────────────────────────────

function buildFingerprint(attrPool, stages) {
    const attrs = (attrPool ?? []).map((a) => `${a.name}:${a.data_type}`).sort().join(',');
    const stagesStr = (stages ?? []).map((s) => {
        const tables = (s.tables ?? []).map((t) => t.name).sort().join(',');
        return `${s.form}|t:${tables}|f:${(s.fds ?? []).length}|r:${(s.relationships ?? []).length}`;
    }).join(';');
    return `${attrs}__${stagesStr}`;
}

function buildSummary(attrPool, stages, lastSavedAt) {
    return {
        attrCount: (attrPool ?? []).length,
        stages: (stages ?? []).map((s) => ({
            form: s.form,
            tableCount: (s.tables ?? []).length,
            fdCount: (s.fds ?? []).length,
            relCount: (s.relationships ?? []).length,
        })),
        lastSavedAt: lastSavedAt ?? null,
    };
}

/**
 * Compares server-deserialized data against the local snapshot.
 * Returns { hasConflict: false } when no local snapshot exists (first load).
 * Returns { hasConflict: true, serverSummary, localSummary } when structural data differs.
 */
export function compareStructural(serverDeserialized, localData) {
    if (!localData?.snapshot) return { hasConflict: false };

    const { snapshot } = localData;
    const serverFP = buildFingerprint(serverDeserialized.attributePool, serverDeserialized.stages);
    const localFP  = buildFingerprint(snapshot.attributePool, snapshot.stages);

    if (serverFP === localFP) return { hasConflict: false };

    return {
        hasConflict: true,
        serverSummary: buildSummary(serverDeserialized.attributePool, serverDeserialized.stages, null),
        localSummary:  buildSummary(snapshot.attributePool, snapshot.stages, localData.lastSavedAt),
    };
}

/**
 * Reads positions and violationChecks from localStorage.
 * Returns null if nothing is stored or parsing fails.
 */
export function loadFromLocal(projectId) {
    try {
        const raw = localStorage.getItem(localKey(projectId));
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

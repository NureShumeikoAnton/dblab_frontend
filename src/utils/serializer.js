/**
 * Serializer — converts Zustand editor store state to API payload and localStorage data.
 *
 * Fields NOT included in the API payload (frontend-only or localStorage-only):
 *   - table.position          → localStorage (canvas coords; backend doesn't store these)
 *   - tableAttribute.order    → derived from array index at load time
 *   - stage.initialized       → derived from tables.length > 0 at load time
 *   - stage.violationChecks   → localStorage only
 *   - ui.*                    → session-only, never persisted
 */

const localKey = (projectId) => `dblab_editor_${projectId}`;

/**
 * Returns the project metadata payload for PUT /projects/:id.
 * Only name and description — the projectId goes in the URL.
 */
export function serializeProjectMeta(store) {
    const { project } = store;
    return {
        name: project.name,
        description: project.description,
    };
}

/**
 * Returns the content payload for PUT /projects/:id/content.
 * Includes attributePool and all stages. All frontend-only fields are stripped.
 */
export function serializeForAPI(store) {
    const { attributePool, stages } = store;

    return {
        attributePool: attributePool.map((attr) => ({
            id: attr.id,
            name: attr.name,
            data_type: attr.data_type,
            introduced_at_stage_Id: attr.introduced_at_stage_Id,
            retired_at_stage_Id: attr.retired_at_stage_Id ?? null,
        })),
        stages: stages.map((stage) => ({
            stageId: stage.stageId,
            form: stage.form,
            tables: stage.tables.map((table) => ({
                id: table.id,
                name: table.name,
                color: table.color,
                tableAttributes: [...table.tableAttributes]
                    .sort((a, b) => a.order - b.order)
                    .map((ta) => ({
                        id: ta.id,
                        attributeId: ta.attributeId,
                        is_PK: ta.is_PK,
                        is_FK: ta.is_FK,
                        alias: ta.alias ?? null,
                    })),
            })),
            relationships: stage.relationships.map((rel) => ({
                id: rel.id,
                type: rel.type,
                color: rel.color,
                cardinality_t1: rel.cardinality_t1,
                cardinality_t2: rel.cardinality_t2,
                table1Id: rel.table1Id,
                table2Id: rel.table2Id,
            })),
            fds: stage.fds.map((fd) => ({
                id: fd.id,
                color: fd.color,
                level: fd.level,
                type: fd.type,
                tableId: fd.tableId,
                starts: fd.starts.map((s) => ({ id: s.id, attributeId: s.attributeId })),
                ends: fd.ends.map((e) => ({ id: e.id, attributeId: e.attributeId })),
            })),
        })),
    };
}

/**
 * Persists positions and violationChecks for the project to localStorage.
 */
export function serializeToLocal(projectId, store) {
    const { stages } = store;
    const positions = {};
    const violationChecks = {};

    stages.forEach((stage, i) => {
        positions[i] = {};
        stage.tables.forEach((table) => {
            if (table.position) {
                positions[i][table.id] = { x: table.position.x, y: table.position.y };
            }
        });
        violationChecks[i] = [...stage.violationChecks];
    });

    try {
        localStorage.setItem(localKey(projectId), JSON.stringify({ positions, violationChecks }));
    } catch {
        // Quota exceeded or private browsing — silently ignore
    }
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

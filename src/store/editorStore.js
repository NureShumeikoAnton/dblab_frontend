import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { MOCK_PROJECT, MOCK_ATTRIBUTES, MOCK_STAGES, MOCK_EMPTY_PROJECT, MOCK_EMPTY_ATTRIBUTES, MOCK_EMPTY_STAGES } from './mockData.js';

export const STAGE_ORDER = ['stage-1nf', 'stage-fds', 'stage-2nf', 'stage-3nf'];

/**
 * EditorStore — single Zustand store with immer middleware.
 * Shape matches SPEC.md §15.
 */
const useEditorStore = create(
    immer((set, get) => ({
        // ─── Core project data ───────────────────────────────────────────────────
        project: {
            id: null,
            name: '',
            description: '',
        },

        currentStageIndex: 0, // 0=1NF, 1=FDs, 2=2NF, 3=3NF

        /**
         * stages: StageState[4]
         * Each stage holds its own tables, relationships, FDs, and checklist.
         *
         * FD shape (denormalized FunctionalDependency + FD_Stage per SCHEMA.md):
         *   { id, color, level: number, type: 'partial'|'full'|'transitive',
         *     starts: [{ id, attributeId }], ends: [{ id, attributeId }] }
         */
        stages: [
            {
                stageId: null,
                form: '1NF',
                initialized: false,
                tables: [],       // Table[]
                relationships: [], // Relationship[]
                fds: [],           // FunctionalDependency[]
                violationChecks: [false], // 1NF: 1 manual rule
            },
            {
                stageId: null,
                form: 'FDs',
                initialized: false,
                tables: [],
                relationships: [],
                fds: [],
                violationChecks: [false], // FDs: 1 manual rule
            },
            {
                stageId: null,
                form: '2NF',
                initialized: false,
                tables: [],
                relationships: [],
                fds: [],
                violationChecks: [false], // 2NF: 1 manual rule
            },
            {
                stageId: null,
                form: '3NF',
                initialized: false,
                tables: [],
                relationships: [],
                fds: [],
                violationChecks: [false], // 3NF: 1 manual rule
            },
        ],

        /**
         * attributePool: project-level list of all attributes.
         * Attribute { id, name, data_type, introduced_at_stage_Id, retired_at_stage_Id }
         */
        attributePool: [],

        // ─── UI state ────────────────────────────────────────────────────────────
        ui: {
            showFDs: true,
            hasUnsavedChanges: false,
            isSaving: false,
            activeModal: null,    // null | { type: string, payload: any }
            selectedFDId: null,   // null | string — FD currently selected for editing
            selectedTableId: null, // null | string — table node currently selected for inline editing
            selectedTableAttribute: null, // null | { tableId, tableAttributeId }
            selectedRelationshipId: null, // null | string
            pendingRelationshipSourceTableId: null, // null | string — canvas pick mode
            pendingRelationshipSetup: null, // null | { sourceTableId, targetTableId } — awaiting modal confirmation
        },

        // ─── Actions ─────────────────────────────────────────────────────────────

        /** Load mock data into the store (called on editor page mount during Phase 1). */
        loadMockData() {
            set((state) => {
                state.project = { ...MOCK_PROJECT };
                state.attributePool = MOCK_ATTRIBUTES.map((a) => ({ ...a }));
                MOCK_STAGES.forEach((stage, i) => {
                    state.stages[i] = {
                        ...stage,
                        tables: stage.tables.map((t) => ({
                            ...t,
                            tableAttributes: t.tableAttributes.map((ta) => ({ ...ta })),
                        })),
                        relationships: stage.relationships.map((r) => ({ ...r })),
                        fds: stage.fds.map((fd) => ({
                            ...fd,
                            starts: fd.starts.map((s) => ({ ...s })),
                            ends: fd.ends.map((e) => ({ ...e })),
                        })),
                        violationChecks: [...stage.violationChecks],
                    };
                });
            });
        },

        /** Load empty project mock — used to test StageInitDialog (projectId '2'). */
        loadEmptyMockData() {
            set((state) => {
                state.project = { ...MOCK_EMPTY_PROJECT };
                state.attributePool = [...MOCK_EMPTY_ATTRIBUTES];
                state.currentStageIndex = 0;
                MOCK_EMPTY_STAGES.forEach((stage, i) => {
                    state.stages[i] = {
                        ...stage,
                        tables: [],
                        relationships: [],
                        fds: [],
                        violationChecks: [...stage.violationChecks],
                    };
                });
            });
        },

        /** Switch the active stage. */
        setCurrentStageIndex(index) {
            set((state) => {
                state.currentStageIndex = index;
                state.ui.selectedTableId = null;
                state.ui.selectedFDId = null;
                state.ui.selectedTableAttribute = null;
                state.ui.selectedRelationshipId = null;
                state.ui.pendingRelationshipSourceTableId = null;
                state.ui.pendingRelationshipSetup = null;
            });
        },

        /** Update project metadata (name / description). */
        updateProject(fields) {
            set((state) => {
                Object.assign(state.project, fields);
                state.ui.hasUnsavedChanges = true;
            });
        },

        /** Toggle FD visibility. */
        toggleShowFDs() {
            set((state) => {
                state.ui.showFDs = !state.ui.showFDs;
            });
        },

        /** Mark save as in-progress. */
        setSaving(isSaving) {
            set((state) => {
                state.ui.isSaving = isSaving;
                if (isSaving === false) {
                    state.ui.hasUnsavedChanges = false;
                }
            });
        },

        /** Open a modal. */
        openModal(type, payload = null) {
            set((state) => {
                state.ui.activeModal = { type, payload };
            });
        },

        /** Close the active modal. */
        closeModal() {
            set((state) => {
                state.ui.activeModal = null;
            });
        },

        // ─── Table actions ───────────────────────────────────────────────────────

        addTable(stageIndex, table) {
            set((state) => {
                state.stages[stageIndex].tables.push(table);
                state.ui.hasUnsavedChanges = true;
            });
        },

        updateTable(stageIndex, tableId, fields) {
            set((state) => {
                const table = state.stages[stageIndex].tables.find((t) => t.id === tableId);
                if (table) {
                    Object.assign(table, fields);
                    state.ui.hasUnsavedChanges = true;
                }
            });
        },

        updateTablePosition(stageIndex, tableId, position) {
            set((state) => {
                const table = state.stages[stageIndex].tables.find((t) => t.id === tableId);
                if (table) {
                    table.position = position;
                    state.ui.hasUnsavedChanges = true;
                }
            });
        },

        deleteTable(stageIndex, tableId) {
            set((state) => {
                const table = state.stages[stageIndex].tables.find((t) => t.id === tableId);
                if (!table) return;

                // Clear selected relationship if it involved this table
                if (state.ui.selectedRelationshipId) {
                    const selRel = state.stages[stageIndex].relationships.find(
                        (r) => r.id === state.ui.selectedRelationshipId
                    );
                    if (selRel && (selRel.table1Id === tableId || selRel.table2Id === tableId)) {
                        state.ui.selectedRelationshipId = null;
                    }
                }

                // Cascade: remove relationships that involve this table
                state.stages[stageIndex].relationships = state.stages[stageIndex].relationships.filter(
                    (r) => r.table1Id !== tableId && r.table2Id !== tableId
                );

                // FDs are NOT cascaded — they become orphaned and are silently hidden
                // from the canvas until the student explicitly deletes them via FD toolbar.

                state.stages[stageIndex].tables = state.stages[stageIndex].tables.filter(
                    (t) => t.id !== tableId
                );
                if (state.ui.selectedTableId === tableId) {
                    state.ui.selectedTableId = null;
                }
                if (state.ui.selectedTableAttribute?.tableId === tableId) {
                    state.ui.selectedTableAttribute = null;
                }
                state.ui.hasUnsavedChanges = true;
            });
        },

        // ─── TableAttribute actions ──────────────────────────────────────────────

        addTableAttribute(stageIndex, tableId, tableAttribute) {
            set((state) => {
                const table = state.stages[stageIndex].tables.find((t) => t.id === tableId);
                if (table) {
                    table.tableAttributes.push(tableAttribute);
                    state.ui.hasUnsavedChanges = true;
                }
            });
        },

        updateTableAttribute(stageIndex, tableId, tableAttributeId, fields) {
            set((state) => {
                const table = state.stages[stageIndex].tables.find((t) => t.id === tableId);
                if (table) {
                    const ta = table.tableAttributes.find((a) => a.id === tableAttributeId);
                    if (ta) {
                        Object.assign(ta, fields);
                        state.ui.hasUnsavedChanges = true;
                    }
                }
            });
        },

        reorderTableAttribute(stageIndex, tableId, tableAttributeId, direction) {
            set((state) => {
                const table = state.stages[stageIndex].tables.find((t) => t.id === tableId);
                if (!table) return;
                const sorted = [...table.tableAttributes].sort((a, b) => a.order - b.order);
                const idx = sorted.findIndex((a) => a.id === tableAttributeId);
                if (idx === -1) return;
                const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
                if (swapIdx < 0 || swapIdx >= sorted.length) return;
                const taA = table.tableAttributes.find((a) => a.id === sorted[idx].id);
                const taB = table.tableAttributes.find((a) => a.id === sorted[swapIdx].id);
                const tmp = taA.order;
                taA.order = taB.order;
                taB.order = tmp;
                state.ui.hasUnsavedChanges = true;
            });
        },

        removeTableAttribute(stageIndex, tableId, tableAttributeId) {
            set((state) => {
                const table = state.stages[stageIndex].tables.find((t) => t.id === tableId);
                if (!table) return;

                const removedTA = table.tableAttributes.find((a) => a.id === tableAttributeId);

                // Cascade: if the removed attribute is a FK, delete any relationship where
                // this table is the FK side (table2Id) and the source table's PK matches
                // the removed attribute's attributeId.
                if (removedTA?.is_FK) {
                    const removedAttrId = removedTA.attributeId;
                    state.stages[stageIndex].relationships = state.stages[stageIndex].relationships.filter((rel) => {
                        if (rel.table2Id !== tableId) return true;
                        const sourceTable = state.stages[stageIndex].tables.find((t) => t.id === rel.table1Id);
                        if (!sourceTable) return false;
                        const sourcePKIds = new Set(
                            sourceTable.tableAttributes.filter((ta) => ta.is_PK).map((ta) => ta.attributeId)
                        );
                        const shouldDelete = sourcePKIds.has(removedAttrId);
                        if (shouldDelete && state.ui.selectedRelationshipId === rel.id) {
                            state.ui.selectedRelationshipId = null;
                        }
                        return !shouldDelete;
                    });
                }

                table.tableAttributes = table.tableAttributes.filter(
                    (a) => a.id !== tableAttributeId
                );
                if (
                    state.ui.selectedTableAttribute?.tableId === tableId &&
                    state.ui.selectedTableAttribute?.tableAttributeId === tableAttributeId
                ) {
                    state.ui.selectedTableAttribute = null;
                }
                state.ui.hasUnsavedChanges = true;
            });
        },

        // ─── Attribute pool actions ──────────────────────────────────────────────

        addAttribute(attribute) {
            set((state) => {
                state.attributePool.push(attribute);
                state.ui.hasUnsavedChanges = true;
            });
        },

        updateAttribute(attributeId, { name, data_type }) {
            set((state) => {
                const attr = state.attributePool.find((a) => a.id === attributeId);
                if (attr) {
                    attr.name = name;
                    attr.data_type = data_type;
                    state.ui.hasUnsavedChanges = true;
                }
            });
        },

        retireAttribute(attributeId, stageId) {
            set((state) => {
                const attr = state.attributePool.find((a) => a.id === attributeId);
                if (attr) {
                    attr.retired_at_stage_Id = stageId;
                    state.ui.hasUnsavedChanges = true;
                }
            });
        },

        unretireAttribute(attributeId) {
            set((state) => {
                const attr = state.attributePool.find((a) => a.id === attributeId);
                if (attr) {
                    attr.retired_at_stage_Id = null;
                    state.ui.hasUnsavedChanges = true;
                }
            });
        },

        deleteAttribute(attributeId) {
            set((state) => {
                const isUsed = state.stages.some((stage) =>
                    stage.tables.some((t) =>
                        t.tableAttributes.some((ta) => ta.attributeId === attributeId)
                    )
                );
                if (isUsed) return;
                state.attributePool = state.attributePool.filter((a) => a.id !== attributeId);
                state.ui.hasUnsavedChanges = true;
            });
        },

        // ─── Relationship actions ────────────────────────────────────────────────

        addRelationship(stageIndex, relationship) {
            set((state) => {
                state.stages[stageIndex].relationships.push(relationship);
                state.ui.hasUnsavedChanges = true;
            });
        },

        updateRelationship(stageIndex, relationshipId, fields) {
            set((state) => {
                const rel = state.stages[stageIndex].relationships.find(
                    (r) => r.id === relationshipId
                );
                if (rel) {
                    Object.assign(rel, fields);
                    state.ui.hasUnsavedChanges = true;
                }
            });
        },

        deleteRelationship(stageIndex, relationshipId) {
            set((state) => {
                state.stages[stageIndex].relationships = state.stages[stageIndex].relationships.filter(
                    (r) => r.id !== relationshipId
                );
                if (state.ui.selectedRelationshipId === relationshipId) {
                    state.ui.selectedRelationshipId = null;
                }
                state.ui.hasUnsavedChanges = true;
            });
        },

        // ─── FD actions ──────────────────────────────────────────────────────────

        addFD(stageIndex, fd) {
            set((state) => {
                state.stages[stageIndex].fds.push(fd);
                state.ui.hasUnsavedChanges = true;
            });
        },

        updateFD(stageIndex, fdId, fields) {
            set((state) => {
                const fd = state.stages[stageIndex].fds.find((f) => f.id === fdId);
                if (fd) {
                    Object.assign(fd, fields);
                    state.ui.hasUnsavedChanges = true;
                }
            });
        },

        selectFD(fdId) {
            set((state) => {
                state.ui.selectedFDId = fdId;
                state.ui.selectedTableId = null;
                state.ui.selectedTableAttribute = null;
                state.ui.selectedRelationshipId = null;
            });
        },

        clearSelectedFD() {
            set((state) => { state.ui.selectedFDId = null; });
        },

        selectTable(tableId) {
            set((state) => {
                state.ui.selectedTableId = tableId;
                state.ui.selectedFDId = null;
                state.ui.selectedTableAttribute = null;
                state.ui.selectedRelationshipId = null;
            });
        },

        clearSelectedTable() {
            set((state) => { state.ui.selectedTableId = null; });
        },

        selectTableAttribute(tableId, tableAttributeId) {
            set((state) => {
                state.ui.selectedTableAttribute = { tableId, tableAttributeId };
                state.ui.selectedTableId = null;
                state.ui.selectedFDId = null;
                state.ui.selectedRelationshipId = null;
            });
        },

        clearSelectedTableAttribute() {
            set((state) => { state.ui.selectedTableAttribute = null; });
        },

        selectRelationship(relId) {
            set((state) => {
                state.ui.selectedRelationshipId = relId;
                state.ui.selectedTableId = null;
                state.ui.selectedFDId = null;
                state.ui.selectedTableAttribute = null;
                state.ui.pendingRelationshipSourceTableId = null;
            });
        },

        clearSelectedRelationship() {
            set((state) => { state.ui.selectedRelationshipId = null; });
        },

        startRelationshipCreation(sourceTableId) {
            set((state) => {
                state.ui.pendingRelationshipSourceTableId = sourceTableId;
                state.ui.selectedTableId = null;
                state.ui.selectedFDId = null;
                state.ui.selectedTableAttribute = null;
                state.ui.selectedRelationshipId = null;
            });
        },

        cancelRelationshipCreation() {
            set((state) => { state.ui.pendingRelationshipSourceTableId = null; });
        },

        confirmRelationshipTarget(targetTableId) {
            set((state) => {
                const sourceTableId = state.ui.pendingRelationshipSourceTableId;
                if (!sourceTableId || sourceTableId === targetTableId) {
                    state.ui.pendingRelationshipSourceTableId = null;
                    return;
                }
                state.ui.pendingRelationshipSetup = { sourceTableId, targetTableId };
                state.ui.pendingRelationshipSourceTableId = null;
            });
        },

        clearRelationshipSetup() {
            set((state) => { state.ui.pendingRelationshipSetup = null; });
        },

        deleteFD(stageIndex, fdId) {
            set((state) => {
                state.stages[stageIndex].fds = state.stages[stageIndex].fds.filter(
                    (f) => f.id !== fdId
                );
                if (state.ui.selectedFDId === fdId) {
                    state.ui.selectedFDId = null;
                }
                state.ui.hasUnsavedChanges = true;
            });
        },

        // ─── Stage initialization ────────────────────────────────────────────────

        initializeStageEmpty(stageIndex) {
            set((state) => {
                state.stages[stageIndex].initialized = true;
                state.ui.hasUnsavedChanges = true;
            });
        },

        initializeStageCopyFromPrevious(stageIndex) {
            set((state) => {
                if (stageIndex === 0) return;
                const prev = state.stages[stageIndex - 1];
                const next = state.stages[stageIndex];

                // Build old→new table ID map so FDs and relationships can be relinked.
                const tableIdMap = {};
                prev.tables.forEach((t) => {
                    tableIdMap[t.id] = `${t.id}-copy-${stageIndex}`;
                });

                next.tables = prev.tables.map((t) => ({
                    ...t,
                    id: tableIdMap[t.id],
                    tableAttributes: t.tableAttributes.map((ta) => ({
                        ...ta,
                        id: `${ta.id}-copy-${stageIndex}`,
                    })),
                }));

                next.fds = prev.fds.map((fd) => ({
                    ...fd,
                    id: `${fd.id}-copy-${stageIndex}`,
                    tableId: tableIdMap[fd.tableId] ?? fd.tableId,
                    starts: fd.starts.map((s) => ({ ...s, id: `${s.id}-copy-${stageIndex}` })),
                    ends:   fd.ends.map((e) => ({ ...e, id: `${e.id}-copy-${stageIndex}` })),
                }));

                next.relationships = prev.relationships.map((r) => ({
                    ...r,
                    id: `${r.id}-copy-${stageIndex}`,
                    table1Id: tableIdMap[r.table1Id] ?? r.table1Id,
                    table2Id: tableIdMap[r.table2Id] ?? r.table2Id,
                }));

                next.initialized = true;
                state.ui.hasUnsavedChanges = true;
            });
        },

        // ─── Violation checklist ─────────────────────────────────────────────────

        toggleViolationCheck(stageIndex, ruleIndex) {
            set((state) => {
                const checks = state.stages[stageIndex].violationChecks;
                checks[ruleIndex] = !checks[ruleIndex];
                state.ui.hasUnsavedChanges = true;
            });
        },

        // ─── Selectors (derived state, called as functions) ──────────────────────

        /** Attributes visible at a given stage (by stage array index). */
        visibleAttributes(stageIndex) {
            const { attributePool, stages } = get();
            const currentStageId = stages[stageIndex]?.stageId;
            const currentOrder = STAGE_ORDER.indexOf(currentStageId);

            return attributePool.filter((attr) => {
                const introOrder = STAGE_ORDER.indexOf(attr.introduced_at_stage_Id);
                const retireOrder =
                    attr.retired_at_stage_Id !== null
                        ? STAGE_ORDER.indexOf(attr.retired_at_stage_Id)
                        : Infinity;
                return introOrder <= currentOrder && retireOrder > currentOrder;
            });
        },

        /**
         * All attributes introduced at or before the current stage, annotated with
         * `isRetired: true` when their retirement stage ≤ current stage.
         * Used by AttributePanel to show greyed-out retired entries.
         */
        panelAttributes(stageIndex) {
            const { attributePool, stages } = get();
            const currentStageId = stages[stageIndex]?.stageId;
            const currentOrder = STAGE_ORDER.indexOf(currentStageId);

            return attributePool
                .filter((attr) => STAGE_ORDER.indexOf(attr.introduced_at_stage_Id) <= currentOrder)
                .map((attr) => {
                    const retireOrder =
                        attr.retired_at_stage_Id !== null
                            ? STAGE_ORDER.indexOf(attr.retired_at_stage_Id)
                            : Infinity;
                    return { ...attr, isRetired: retireOrder <= currentOrder };
                });
        },

        /** Attributes visible at the current stage that are not placed in any table. */
        unusedAttributes(stageIndex) {
            const { stages } = get();
            const visible = get().visibleAttributes(stageIndex);
            const usedIds = new Set(
                stages[stageIndex].tables.flatMap((t) =>
                    t.tableAttributes.map((ta) => ta.attributeId)
                )
            );
            return visible.filter((a) => !usedIds.has(a.id));
        },

        /** Maps current stage tables to React Flow node objects. */
        reactFlowNodes(stageIndex) {
            const { stages } = get();
            return stages[stageIndex].tables.map((table) => ({
                id: table.id,
                type: 'tableNode',
                position: table.position,
                data: { table },
                draggable: true,
            }));
        },

        /** Maps current stage relationships (and optionally FDs) to React Flow edge objects. */
        reactFlowEdges(stageIndex) {
            const { stages, ui, attributePool } = get();
            const stage = stages[stageIndex];
            const relEdges = stage.relationships.map((rel) => ({
                id: rel.id,
                type: 'relationshipEdge',
                source: rel.table1Id,
                target: rel.table2Id,
                data: { relationship: rel },
            }));

            if (!ui.showFDs) return relEdges;

            const fdEdges = stage.fds.flatMap((fd) =>
                fd.starts.flatMap((start) =>
                    fd.ends.map((end) => {
                        // FD edges connect attribute handles within the same table
                        const sourceTable = stage.tables.find((t) =>
                            t.tableAttributes.some((ta) => ta.attributeId === start.attributeId)
                        );
                        const targetTable = stage.tables.find((t) =>
                            t.tableAttributes.some((ta) => ta.attributeId === end.attributeId)
                        );
                        if (!sourceTable || !targetTable) return null;
                        return {
                            id: `fd-${fd.id}-${start.id}-${end.id}`,
                            type: 'fdEdge',
                            source: sourceTable.id,
                            target: targetTable.id,
                            sourceHandle: `fd-src-${start.attributeId}`,
                            targetHandle: `fd-tgt-${end.attributeId}`,
                            data: { fd, startAttrId: start.attributeId, endAttrId: end.attributeId, attributePool },
                        };
                    })
                )
            ).filter(Boolean);

            return [...relEdges, ...fdEdges];
        },

        /** Whether all violation checks for a stage are ticked. */
        isStageComplete(stageIndex) {
            const checks = get().stages[stageIndex].violationChecks;
            return checks.length > 0 && checks.every(Boolean);
        },
    }))
);

export default useEditorStore;

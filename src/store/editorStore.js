import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { MOCK_PROJECT, MOCK_ATTRIBUTES, MOCK_STAGES } from './mockData.js';

export const STAGE_ORDER = ['stage-0nf', 'stage-1nf', 'stage-2nf', 'stage-3nf'];

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

        currentStageIndex: 0, // 0=0NF, 1=1NF, 2=2NF, 3=3NF

        /**
         * stages: StageState[4]
         * Each stage holds its own tables, relationships, FDs, and checklist.
         */
        stages: [
            {
                stageId: null,
                form: '0NF',
                initialized: false,
                tables: [],       // Table[]
                relationships: [], // Relationship[]
                fds: [],           // FunctionalDependency[]
                violationChecks: [false, false, false], // 0NF has 3 rules
            },
            {
                stageId: null,
                form: '1NF',
                initialized: false,
                tables: [],
                relationships: [],
                fds: [],
                violationChecks: [false, false, false, false], // 1NF has 4 rules
            },
            {
                stageId: null,
                form: '2NF',
                initialized: false,
                tables: [],
                relationships: [],
                fds: [],
                violationChecks: [false, false, false, false], // 2NF has 4 rules
            },
            {
                stageId: null,
                form: '3NF',
                initialized: false,
                tables: [],
                relationships: [],
                fds: [],
                violationChecks: [false, false, false, false], // 3NF has 4 rules
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
            activeModal: null, // null | { type: string, payload: any }
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

        /** Switch the active stage. */
        setCurrentStageIndex(index) {
            set((state) => {
                state.currentStageIndex = index;
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
                state.stages[stageIndex].tables = state.stages[stageIndex].tables.filter(
                    (t) => t.id !== tableId
                );
                // Remove FDs whose start/end attributes belonged to this table
                // (full cleanup deferred to later phases)
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

        removeTableAttribute(stageIndex, tableId, tableAttributeId) {
            set((state) => {
                const table = state.stages[stageIndex].tables.find((t) => t.id === tableId);
                if (table) {
                    table.tableAttributes = table.tableAttributes.filter(
                        (a) => a.id !== tableAttributeId
                    );
                    state.ui.hasUnsavedChanges = true;
                }
            });
        },

        // ─── Attribute pool actions ──────────────────────────────────────────────

        addAttribute(attribute) {
            set((state) => {
                state.attributePool.push(attribute);
                state.ui.hasUnsavedChanges = true;
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

        deleteFD(stageIndex, fdId) {
            set((state) => {
                state.stages[stageIndex].fds = state.stages[stageIndex].fds.filter(
                    (f) => f.id !== fdId
                );
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
                next.tables = prev.tables.map((t) => ({
                    ...t,
                    id: `${t.id}-copy-${stageIndex}`,
                    tableAttributes: t.tableAttributes.map((ta) => ({
                        ...ta,
                        id: `${ta.id}-copy-${stageIndex}`,
                    })),
                }));
                next.relationships = [];
                next.fds = [];
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

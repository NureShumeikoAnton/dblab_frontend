import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { temporal } from 'zundo';
import { serializeProjectMeta, serializeForAPI, serializeToLocal, deserializeFromAPI, mergeLocalOnlyFields } from '../utils/serializer.js';
import { buildTableFromAttributes } from '../utils/tableFactory.js';
import { relocateFDsToTable } from '../utils/fdRelocation.js';
import generateId from '../utils/generateId.js';
import API_CONFIG from '../config/api.js';

export const STAGE_ORDER = ['stage-1nf', 'stage-fds', 'stage-2nf', 'stage-3nf'];

/** Trailing debounce — coalesces a burst of rapid calls into one trailing call. */
const debounce = (fn, ms) => {
    let timer = null;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), ms);
    };
};

/**
 * EditorStore — single Zustand store with immer middleware.
 * Shape matches SPEC.md §15.
 */
const useEditorStore = create(
    temporal(
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
            isLocalSaved: false,
            isServerSaved: false,
            isSaving: false,
            activeModal: null,    // null | { type: string, payload: any }
            selectedFDId: null,   // null | string — FD currently selected for editing
            selectedTableId: null, // null | string — table node currently selected for inline editing
            selectedTableAttribute: null, // null | { tableId, tableAttributeId }
            selectedRelationshipId: null, // null | string
            pendingRelationshipSourceTableId: null, // null | string — canvas pick mode
            pendingRelationshipSetup: null, // null | { sourceTableId, targetTableId } — awaiting modal confirmation
            lastSaveError: null, // null | string — set on API save failure, cleared on next save attempt
            sessionExpired: false, // true when a save failed with HTTP 401 — shows SessionExpiredModal
            sessionExpiredDismissed: false, // user chose "continue offline" — don't re-show on autosave retries
        },

        // ─── Actions ─────────────────────────────────────────────────────────────

        /**
         * Hydrates the store from a GET /project/:id API response.
         * Applies localStorage positions and violationChecks on top when provided.
         */
        loadProject(apiData, localData = null) {
            const { project, attributePool, stages } = deserializeFromAPI(apiData);
            set((state) => {
                state.project = project;
                state.attributePool = attributePool;
                state.currentStageIndex = 0;
                stages.forEach((stage, i) => {
                    Object.assign(state.stages[i], stage);
                });
                if (localData) {
                    stages.forEach((_, i) => {
                        const pos = localData.positions?.[i] ?? {};
                        state.stages[i].tables.forEach((table) => {
                            if (pos[table.name]) table.position = pos[table.name];
                        });
                        state.stages[i].violationChecks = localData.violationChecks?.[i] ?? [];
                    });
                    // Restore fields the backend cannot persist (fd.type, retirement)
                    mergeLocalOnlyFields(
                        { attributePool: state.attributePool, stages: state.stages },
                        localData.snapshot
                    );
                }
                state.ui.hasUnsavedChanges = false;
                state.ui.isServerSaved = true;
                state.ui.lastSaveError = null;
            });
            // Sync the local snapshot to the freshly loaded state. This marks the
            // local badge as saved and makes "Use server version" stick — otherwise
            // the stale local snapshot re-triggers the conflict modal on every load.
            get().saveLocally();
            // Drop any history so the pristine empty store can't be reached via undo.
            useEditorStore.temporal.getState().clear();
        },

        /** Hydrates store from a localStorage snapshot (offline fallback or conflict resolution). */
        loadFromLocalSnapshot(localData, projectId = null) {
            const { snapshot } = localData ?? {};
            if (!snapshot) return;
            set((state) => {
                if (projectId) state.project.id = parseInt(projectId, 10) || projectId;
                state.attributePool = snapshot.attributePool ?? [];
                state.currentStageIndex = 0;
                (snapshot.stages ?? []).forEach((stage, i) => {
                    Object.assign(state.stages[i], stage);
                    const pos = localData.positions?.[i] ?? {};
                    state.stages[i].tables.forEach((table, idx) => {
                        if (pos[table.name]) table.position = pos[table.name];
                        // Snapshot tables carry no position — fall back to a default
                        // grid so React Flow never receives an undefined position.
                        else if (!table.position) table.position = { x: idx * 280, y: 80 };
                    });
                    state.stages[i].violationChecks = localData.violationChecks?.[i] ?? [];
                });
                state.ui.hasUnsavedChanges = false;
                state.ui.isServerSaved = false;
            });
            // Drop any history so the pristine empty store can't be reached via undo.
            useEditorStore.temporal.getState().clear();
        },

        setLastSaveError(msg) {
            set((s) => { s.ui.lastSaveError = msg ?? null; });
        },

        /**
         * Marks the project dirty. Called after undo/redo, which write diagram data
         * directly via zundo and bypass the per-action dirty flags — without this an
         * undo after a save would leave the project silently unsaved. UI-only, so it
         * isn't itself recorded in history.
         */
        flagUnsaved() {
            set((s) => {
                s.ui.hasUnsavedChanges = true;
                s.ui.isLocalSaved = false;
                s.ui.isServerSaved = false;
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
                state.ui.isLocalSaved = false;
                state.ui.isServerSaved = false;
            });
        },

        /** Toggle FD visibility. */
        toggleShowFDs() {
            set((state) => {
                state.ui.showFDs = !state.ui.showFDs;
            });
        },

        /** User chose "continue offline" in the session-expired modal. */
        dismissSessionExpired() {
            set((state) => {
                state.ui.sessionExpired = false;
                state.ui.sessionExpiredDismissed = true;
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

        // ─── High-level command intents ──────────────────────────────────────────
        // Shared entry points used by BOTH context menus and keyboard shortcuts.
        // They centralize the "decide what to do, maybe open a confirmation modal"
        // logic that previously lived as local state inside TableNode.

        /**
         * Deletes whichever element is currently selected, smallest-first.
         * Selection is mutually exclusive in this store, so at most one branch runs;
         * the ordering is a defensive tiebreaker.
         */
        requestDeleteSelected() {
            const { ui, currentStageIndex } = get();
            if (ui.selectedTableAttribute) {
                const { tableId, tableAttributeId } = ui.selectedTableAttribute;
                get().removeTableAttribute(currentStageIndex, tableId, tableAttributeId);
            } else if (ui.selectedRelationshipId) {
                get().deleteRelationship(currentStageIndex, ui.selectedRelationshipId);
            } else if (ui.selectedFDId) {
                get().deleteFD(currentStageIndex, ui.selectedFDId);
            } else if (ui.selectedTableId) {
                get().requestDeleteTable(currentStageIndex, ui.selectedTableId);
            }
        },

        /**
         * Deletes a table directly when no FDs reference it; otherwise opens the
         * DeleteTableModal so the student can choose to keep or drop those FDs.
         */
        requestDeleteTable(stageIndex, tableId) {
            const stage = get().stages[stageIndex];
            const table = stage?.tables.find((t) => t.id === tableId);
            if (!table) return;
            const tableAttrIds = new Set(table.tableAttributes.map((ta) => ta.attributeId));
            // Only FDs HOMED on this table are affected by its deletion. Matching by
            // shared attributeId would wrongly flag FDs owned by other tables that
            // merely reference an attribute this table also holds (e.g. a shared PK).
            const affected = stage.fds.filter((fd) =>
                fd.tableId
                    ? fd.tableId === tableId
                    : fd.starts.every((s) => tableAttrIds.has(s.attributeId))
            );
            if (affected.length === 0) {
                get().deleteTable(stageIndex, tableId);
            } else {
                set((state) => {
                    state.ui.activeModal = {
                        type: 'deleteTable',
                        payload: { tableId, affectedFdIds: affected.map((f) => f.id) },
                    };
                });
            }
        },

        /** Confirms a pending table deletion; optionally drops the dependent FDs too. */
        confirmDeleteTable(alsoDeleteFds) {
            const { ui, currentStageIndex } = get();
            if (ui.activeModal?.type !== 'deleteTable') return;
            const { tableId, affectedFdIds } = ui.activeModal.payload;
            if (alsoDeleteFds) {
                affectedFdIds.forEach((fdId) => get().deleteFD(currentStageIndex, fdId));
            }
            get().deleteTable(currentStageIndex, tableId);
            set((state) => { state.ui.activeModal = null; });
        },

        /**
         * Extracts the given table attribute(s) into a brand-new table whose PK is
         * those attributes, then opens CreateTableFromAttrModal to offer marking the
         * originals as FK + drawing the relationship.
         */
        createTableFromAttributes(stageIndex, sourceTableId, tableAttributeIds) {
            const state = get();
            const stage = state.stages[stageIndex];
            const sourceTable = stage?.tables.find((t) => t.id === sourceTableId);
            if (!sourceTable) return;
            const attrMap = new Map(state.attributePool.map((a) => [a.id, a]));
            const tas = tableAttributeIds
                .map((id) => sourceTable.tableAttributes.find((a) => a.id === id))
                .filter(Boolean);
            if (!tas.length) return;
            const attrs = tas.map((ta) => attrMap.get(ta.attributeId)).filter(Boolean);
            if (attrs.length !== tas.length) return;

            const newTable = buildTableFromAttributes(sourceTable, tas, attrs);
            set((s) => {
                s.stages[stageIndex].tables.push(newTable);
                // Issue #21 — if the extracted key already determines a moved
                // attribute, move the FD into the new table.
                if (stageIndex >= 1) {
                    relocateFDsToTable(s.stages[stageIndex], newTable.id);
                }
                s.ui.hasUnsavedChanges = true;
                s.ui.isLocalSaved = false;
                s.ui.isServerSaved = false;
                s.ui.activeModal = {
                    type: 'createTableFromAttr',
                    payload: {
                        sourceTableId,
                        newTableId: newTable.id,
                        taIds: tas.map((ta) => ta.id),
                        attrNames: attrs.map((a) => a.name),
                    },
                };
            });
        },

        /** Resolves CreateTableFromAttrModal — when confirmed, marks FK + adds relationship. */
        confirmCreateTableFromAttr(markAsFK) {
            const { ui, currentStageIndex } = get();
            if (ui.activeModal?.type !== 'createTableFromAttr') return;
            const { sourceTableId, newTableId, taIds } = ui.activeModal.payload;
            set((state) => {
                if (markAsFK) {
                    const table = state.stages[currentStageIndex].tables.find((t) => t.id === sourceTableId);
                    if (table) {
                        taIds.forEach((taId) => {
                            const ta = table.tableAttributes.find((a) => a.id === taId);
                            if (ta) ta.is_FK = true;
                        });
                    }
                    state.stages[currentStageIndex].relationships.push({
                        id: generateId(),
                        type: 'non-identifying',
                        color: '#64748b',
                        cardinality_t1: '1..1',
                        cardinality_t2: '0..*',
                        table1Id: newTableId,
                        table2Id: sourceTableId,
                    });
                    state.ui.hasUnsavedChanges = true;
                    state.ui.isLocalSaved = false;
                    state.ui.isServerSaved = false;
                }
                state.ui.activeModal = null;
            });
        },

        /** Resolves NewAttributeModal — add or edit a pool attribute based on payload.mode. */
        submitAttributeModal({ name, data_type }) {
            const { ui, stages } = get();
            if (ui.activeModal?.type !== 'newAttribute') return;
            const { mode, attribute } = ui.activeModal.payload ?? {};
            if (mode === 'edit' && attribute) {
                get().updateAttribute(attribute.id, { name, data_type });
            } else {
                get().addAttribute({
                    id: generateId(),
                    name,
                    data_type,
                    introduced_at_stage_Id: stages[0].stageId,
                    retired_at_stage_Id: null,
                });
            }
            set((state) => { state.ui.activeModal = null; });
        },

        // ─── Table actions ───────────────────────────────────────────────────────

        addTable(stageIndex, table) {
            set((state) => {
                state.stages[stageIndex].tables.push(table);
                state.ui.hasUnsavedChanges = true;
                state.ui.isLocalSaved = false;
                state.ui.isServerSaved = false;
            });
        },

        updateTable(stageIndex, tableId, fields) {
            set((state) => {
                const table = state.stages[stageIndex].tables.find((t) => t.id === tableId);
                if (table) {
                    Object.assign(table, fields);
                    state.ui.hasUnsavedChanges = true;
                    state.ui.isLocalSaved = false;
                    state.ui.isServerSaved = false;
                }
            });
        },

        updateTablePosition(stageIndex, tableId, position) {
            set((state) => {
                const table = state.stages[stageIndex].tables.find((t) => t.id === tableId);
                if (table) {
                    table.position = position;
                    state.ui.hasUnsavedChanges = true;
                    state.ui.isLocalSaved = false;
                    state.ui.isServerSaved = false;
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
                state.ui.isLocalSaved = false;
                state.ui.isServerSaved = false;
            });
        },

        // ─── TableAttribute actions ──────────────────────────────────────────────

        addTableAttribute(stageIndex, tableId, tableAttribute) {
            set((state) => {
                const table = state.stages[stageIndex].tables.find((t) => t.id === tableId);
                if (table) {
                    // The same pool attribute must not appear twice in one table
                    if (table.tableAttributes.some((ta) => ta.attributeId === tableAttribute.attributeId)) return;
                    table.tableAttributes.push(tableAttribute);
                    // Issue #21 — an attribute landing here may complete an FD's
                    // determinant; move the relevant dependency into this table.
                    if (stageIndex >= 1) {
                        relocateFDsToTable(state.stages[stageIndex], tableId);
                    }
                    state.ui.hasUnsavedChanges = true;
                    state.ui.isLocalSaved = false;
                    state.ui.isServerSaved = false;
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
                        state.ui.isLocalSaved = false;
                        state.ui.isServerSaved = false;
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
                state.ui.isLocalSaved = false;
                state.ui.isServerSaved = false;
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

                // Issue #21 — removal is intentionally NON-destructive to FDs: a
                // bracket whose endpoint row is gone is hidden by FDEdge, and an
                // orphaned FD is excluded from validation. The dependency is moved
                // (not destroyed) when its attribute is re-added to another table.

                if (
                    state.ui.selectedTableAttribute?.tableId === tableId &&
                    state.ui.selectedTableAttribute?.tableAttributeId === tableAttributeId
                ) {
                    state.ui.selectedTableAttribute = null;
                }
                state.ui.hasUnsavedChanges = true;
                state.ui.isLocalSaved = false;
                state.ui.isServerSaved = false;
            });
        },

        // ─── Attribute pool actions ──────────────────────────────────────────────

        addAttribute(attribute) {
            set((state) => {
                state.attributePool.push(attribute);
                state.ui.hasUnsavedChanges = true;
                state.ui.isLocalSaved = false;
                state.ui.isServerSaved = false;
            });
        },

        updateAttribute(attributeId, { name, data_type }) {
            set((state) => {
                const attr = state.attributePool.find((a) => a.id === attributeId);
                if (attr) {
                    attr.name = name;
                    attr.data_type = data_type;
                    state.ui.hasUnsavedChanges = true;
                    state.ui.isLocalSaved = false;
                    state.ui.isServerSaved = false;
                }
            });
        },

        retireAttribute(attributeId, stageId) {
            set((state) => {
                const attr = state.attributePool.find((a) => a.id === attributeId);
                if (attr) {
                    attr.retired_at_stage_Id = stageId;
                    state.ui.hasUnsavedChanges = true;
                    state.ui.isLocalSaved = false;
                    state.ui.isServerSaved = false;
                }
            });
        },

        unretireAttribute(attributeId) {
            set((state) => {
                const attr = state.attributePool.find((a) => a.id === attributeId);
                if (attr) {
                    attr.retired_at_stage_Id = null;
                    state.ui.hasUnsavedChanges = true;
                    state.ui.isLocalSaved = false;
                    state.ui.isServerSaved = false;
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
                state.ui.isLocalSaved = false;
                state.ui.isServerSaved = false;
            });
        },

        // ─── Relationship actions ────────────────────────────────────────────────

        addRelationship(stageIndex, relationship) {
            set((state) => {
                state.stages[stageIndex].relationships.push(relationship);
                state.ui.hasUnsavedChanges = true;
                state.ui.isLocalSaved = false;
                state.ui.isServerSaved = false;
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
                    state.ui.isLocalSaved = false;
                    state.ui.isServerSaved = false;
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
                state.ui.isLocalSaved = false;
                state.ui.isServerSaved = false;
            });
        },

        // ─── FD actions ──────────────────────────────────────────────────────────

        addFD(stageIndex, fd) {
            set((state) => {
                state.stages[stageIndex].fds.push(fd);
                state.ui.hasUnsavedChanges = true;
                state.ui.isLocalSaved = false;
                state.ui.isServerSaved = false;
            });
        },

        updateFD(stageIndex, fdId, fields) {
            set((state) => {
                const fd = state.stages[stageIndex].fds.find((f) => f.id === fdId);
                if (fd) {
                    Object.assign(fd, fields);
                    state.ui.hasUnsavedChanges = true;
                    state.ui.isLocalSaved = false;
                    state.ui.isServerSaved = false;
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
                const stage = state.stages[state.currentStageIndex];
                const alreadyLinked = stage?.relationships.some(
                    (r) => (r.table1Id === sourceTableId && r.table2Id === targetTableId) ||
                            (r.table1Id === targetTableId && r.table2Id === sourceTableId)
                );
                // Still open the modal — it will show an "already linked" message.
                state.ui.pendingRelationshipSetup = { sourceTableId, targetTableId, alreadyLinked: alreadyLinked ?? false };
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
                state.ui.isLocalSaved = false;
                state.ui.isServerSaved = false;
            });
        },

        // ─── Stage initialization ────────────────────────────────────────────────

        initializeStageEmpty(stageIndex) {
            set((state) => {
                state.stages[stageIndex].initialized = true;
                state.ui.hasUnsavedChanges = true;
                state.ui.isLocalSaved = false;
                state.ui.isServerSaved = false;
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
                state.ui.isLocalSaved = false;
                state.ui.isServerSaved = false;
            });
        },

        resetStage(stageIndex) {
            set((state) => {
                const stage = state.stages[stageIndex];
                stage.initialized = false;
                stage.tables = [];
                stage.relationships = [];
                stage.fds = [];
                stage.violationChecks = stage.violationChecks.map(() => false);
                state.ui.hasUnsavedChanges = true;
                state.ui.isLocalSaved = false;
                state.ui.isServerSaved = false;
            });
        },

        // ─── Violation checklist ─────────────────────────────────────────────────

        toggleViolationCheck(stageIndex, ruleIndex) {
            set((state) => {
                const checks = state.stages[stageIndex].violationChecks;
                checks[ruleIndex] = !checks[ruleIndex];
                state.ui.hasUnsavedChanges = true;
                state.ui.isLocalSaved = false;
                state.ui.isServerSaved = false;
            });
        },

        // ─── Save / local state ──────────────────────────────────────────────────

        /**
         * Persist positions + violationChecks to localStorage for the current project.
         * Called on every explicit save and on autosave.
         */
        saveLocally() {
            const state = get();
            if (!state.project.id) return; // nothing loaded yet — no key to write under
            serializeToLocal(state.project.id, state);
            set((s) => { s.ui.isLocalSaved = true; });
        },

        /**
         * Saves the project to the API (two calls) and to localStorage.
         *
         *   PUT /projects/:id          → project name + description
         *   PUT /projects/:id/content  → all stages, tables, attributes, FDs, relationships
         *
         * Pass the raw auth token (without "Bearer " prefix) for authenticated requests.
         * When project.id is null (mock mode), skips both API calls and only saves locally.
         *
         * Returns true on success, false if either API call fails.
         */
        async saveProject(authToken = null) {
            const state = get();
            const { project } = state;

            set((s) => {
                s.ui.isSaving = true;
                s.ui.lastSaveError = null;
                // Cleared optimistically: edits made while the save is in flight
                // re-set the flag, so they aren't wiped when the save completes.
                s.ui.hasUnsavedChanges = false;
            });

            // Always persist positions + violationChecks locally
            get().saveLocally();

            if (!project.id) {
                // Project not loaded yet — nothing to send
                set((s) => { s.ui.isSaving = false; });
                return true;
            }

            const headers = { 'Content-Type': 'application/json' };
            if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
            const metaUrl    = `${API_CONFIG.BASE_URL}/project/${project.id}`;
            const contentUrl = `${API_CONFIG.BASE_URL}/project/updateProjectFull/${project.id}`;

            const httpError = (message, status) => {
                const err = new Error(message);
                err.status = status;
                return err;
            };

            try {
                // 1. Save project metadata (name, description)
                const metaRes = await fetch(metaUrl, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify(serializeProjectMeta(state)),
                });
                if (!metaRes.ok) throw httpError(`Meta save failed: HTTP ${metaRes.status}`, metaRes.status);

                // 2. Save full content snapshot (stages, tables, attributes, FDs, relationships)
                const contentRes = await fetch(contentUrl, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify(serializeForAPI(state)),
                });
                if (!contentRes.ok) throw httpError(`Content save failed: HTTP ${contentRes.status}`, contentRes.status);

                serializeToLocal(project.id, get());

                set((s) => {
                    s.ui.isSaving = false;
                    s.ui.isServerSaved = true;
                });
                return true;
            } catch (err) {
                set((s) => {
                    s.ui.isSaving = false;
                    s.ui.hasUnsavedChanges = true;
                    s.ui.lastSaveError = err.status === 401 ? 'Session expired' : err.message;
                    if (err.status === 401 && !s.ui.sessionExpiredDismissed) {
                        s.ui.sessionExpired = true;
                    }
                });
                return false;
            }
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
    })),
    {
        // Track only diagram data — never selection / modals / save flags / nav.
        // Immer's structural sharing means a UI-only `set` leaves these references
        // unchanged, so `equality` reports "no diagram change" and nothing is recorded.
        partialize: (s) => ({ stages: s.stages, attributePool: s.attributePool }),
        equality: (a, b) => a.stages === b.stages && a.attributePool === b.attributePool,
        limit: 100,
        // Coalesce bursts of rapid edits (e.g. typing a table name, which writes per
        // keystroke) into a single undo step. Trade-off: two very fast distinct edits merge.
        handleSet: (handleSet) => debounce(handleSet, 400),
    }
    )
);

export default useEditorStore;

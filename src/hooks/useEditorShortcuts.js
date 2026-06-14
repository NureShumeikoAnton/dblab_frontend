import { useEffect } from 'react';
import useEditorStore from '../store/editorStore.js';
import { getCommand } from '../config/keymap.js';

/** True when focus is in a text-entry control — native key behavior should win there. */
const isEditableTarget = (el) => {
    if (!el) return false;
    const tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
};

/**
 * Runs a matched command against the store. Reads `store` (a fresh getState()
 * snapshot) so it never closes over stale selection.
 */
function runCommand(command, store, ctx) {
    const { ui, currentStageIndex } = store;

    switch (command) {
        case 'deleteSelected':
            store.requestDeleteSelected();
            break;

        case 'createTableFromAttr':
            if (ui.selectedTableAttribute) {
                const { tableId, tableAttributeId } = ui.selectedTableAttribute;
                store.createTableFromAttributes(currentStageIndex, tableId, [tableAttributeId]);
            }
            break;

        case 'createAttribute':
            store.openModal('newAttribute', { mode: 'add' });
            break;

        case 'cancelOrClear':
            if (ui.activeModal) {
                store.closeModal();
            } else if (ui.pendingRelationshipSourceTableId) {
                store.cancelRelationshipCreation();
            } else {
                store.clearSelectedFD();
                store.clearSelectedTable();
                store.clearSelectedTableAttribute();
                store.clearSelectedRelationship();
            }
            break;

        case 'save':
            ctx.onSave?.();
            break;

        case 'stage0': store.setCurrentStageIndex(0); break;
        case 'stage1': store.setCurrentStageIndex(1); break;
        case 'stage2': store.setCurrentStageIndex(2); break;
        case 'stage3': store.setCurrentStageIndex(3); break;

        case 'reorderUp':
        case 'reorderDown':
            if (ui.selectedTableAttribute) {
                const { tableId, tableAttributeId } = ui.selectedTableAttribute;
                store.reorderTableAttribute(
                    currentStageIndex, tableId, tableAttributeId,
                    command === 'reorderUp' ? 'up' : 'down'
                );
            }
            break;

        default:
            break;
    }
}

/**
 * Wires global editor keyboard shortcuts. Attaches a single window listener and
 * reads fresh store state on each event (idiomatic Zustand — no re-binding on
 * selection changes, no stale closures).
 *
 * @param {object}   options
 * @param {Function} options.onSave  triggers a save (EditorPage owns the auth token)
 */
export default function useEditorShortcuts({ onSave } = {}) {
    useEffect(() => {
        const handler = (e) => {
            const command = getCommand(e);
            if (!command) return;

            const store = useEditorStore.getState();
            const blocked = isEditableTarget(document.activeElement) || Boolean(store.ui.activeModal);

            // While typing in a field or with a modal open, only let Escape through
            // (so Ctrl+A keeps doing native select-all, modals stay modal, etc.).
            if (blocked && command !== 'cancelOrClear') return;

            e.preventDefault();
            runCommand(command, store, { onSave });
        };

        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onSave]);
}

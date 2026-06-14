import { useMemo } from 'react';
import useEditorStore from '../store/editorStore.js';
import DeleteTableModal from './DeleteTableModal.jsx';
import CreateTableFromAttrModal from './CreateTableFromAttrModal.jsx';
import NewAttributeModal from './NewAttributeModal.jsx';

/**
 * Single, page-level renderer for the editor's confirmation/create modals.
 * Reads `ui.activeModal` (the store modal manager) and renders the matching
 * modal, wired to the store's command intents. Both context menus and keyboard
 * shortcuts open these modals via `openModal` / the intent actions, so the modal
 * UI no longer needs to live inside individual TableNode instances.
 */
const EditorModals = () => {
    const activeModal = useEditorStore((s) => s.ui.activeModal);
    const currentStageIndex = useEditorStore((s) => s.currentStageIndex);
    const stage = useEditorStore((s) => s.stages[currentStageIndex]);
    const attributePool = useEditorStore((s) => s.attributePool);
    const closeModal = useEditorStore((s) => s.closeModal);
    const confirmDeleteTable = useEditorStore((s) => s.confirmDeleteTable);
    const confirmCreateTableFromAttr = useEditorStore((s) => s.confirmCreateTableFromAttr);
    const submitAttributeModal = useEditorStore((s) => s.submitAttributeModal);

    const attrMap = useMemo(
        () => new Map(attributePool.map((a) => [a.id, a])),
        [attributePool]
    );

    if (!activeModal) return null;

    if (activeModal.type === 'deleteTable') {
        const { tableId, affectedFdIds } = activeModal.payload;
        const table = stage.tables.find((t) => t.id === tableId);
        if (!table) return null;
        const fdSet = new Set(affectedFdIds);
        const fds = stage.fds.filter((f) => fdSet.has(f.id));
        return (
            <DeleteTableModal
                tableName={table.name}
                fds={fds}
                attrMap={attrMap}
                onSave={() => confirmDeleteTable(false)}
                onDeleteAll={() => confirmDeleteTable(true)}
                onCancel={closeModal}
            />
        );
    }

    if (activeModal.type === 'createTableFromAttr') {
        const { sourceTableId, attrNames } = activeModal.payload;
        const sourceTable = stage.tables.find((t) => t.id === sourceTableId);
        return (
            <CreateTableFromAttrModal
                attrNames={attrNames}
                sourceTableName={sourceTable?.name ?? ''}
                onConfirm={confirmCreateTableFromAttr}
                onClose={() => confirmCreateTableFromAttr(false)}
            />
        );
    }

    if (activeModal.type === 'newAttribute') {
        const { mode = 'add', attribute = null } = activeModal.payload ?? {};
        return (
            <NewAttributeModal
                isOpen
                mode={mode}
                onClose={closeModal}
                onSubmit={submitAttributeModal}
                initialName={attribute?.name ?? ''}
                initialDataType={attribute?.data_type ?? 'VARCHAR'}
            />
        );
    }

    return null;
};

export default EditorModals;

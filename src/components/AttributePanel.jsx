import React, { useMemo, useState } from 'react';
import useEditorStore from '../store/editorStore.js';
import generateId from '../utils/generateId.js';
import AttributeItem from './AttributeItem.jsx';
import NewAttributeModal from './NewAttributeModal.jsx';
import './styles/AttributePanel.css';

const AttributePanel = () => {
    const attributePool = useEditorStore((s) => s.attributePool);
    const currentStageIndex = useEditorStore((s) => s.currentStageIndex);
    const stages = useEditorStore((s) => s.stages);
    const addAttribute = useEditorStore((s) => s.addAttribute);
    const updateAttribute = useEditorStore((s) => s.updateAttribute);
    const retireAttribute = useEditorStore((s) => s.retireAttribute);
    const unretireAttribute = useEditorStore((s) => s.unretireAttribute);
    const deleteAttribute = useEditorStore((s) => s.deleteAttribute);

    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [editingAttribute, setEditingAttribute] = useState(null);

    // Attributes placed in the current stage — hidden from the panel while they live on canvas.
    const usedInCurrentStageIds = useMemo(
        () => new Set(
            stages[currentStageIndex]?.tables.flatMap((t) =>
                t.tableAttributes.map((ta) => ta.attributeId)
            ) ?? []
        ),
        [stages, currentStageIndex]
    );

    // Show retired attrs (greyed-out) but hide active attrs that are already on canvas.
    const attributes = useMemo(
        () => attributePool
            .map((attr) => ({ ...attr, isRetired: attr.retired_at_stage_Id !== null }))
            .filter((attr) => attr.isRetired || !usedInCurrentStageIds.has(attr.id))
            .sort((a, b) => (a.isRetired ? 1 : 0) - (b.isRetired ? 1 : 0)),
        [attributePool, usedInCurrentStageIds]
    );

    // Delete removes from attributePool entirely — must check ALL stages, not just current.
    const globallyUsedIds = useMemo(
        () => new Set(
            stages.flatMap((stage) =>
                stage.tables.flatMap((t) =>
                    t.tableAttributes.map((ta) => ta.attributeId)
                )
            )
        ),
        [stages]
    );

    const unusedIds = useMemo(
        () => new Set(
            attributePool
                .filter((attr) => !globallyUsedIds.has(attr.id))
                .map((attr) => attr.id)
        ),
        [attributePool, globallyUsedIds]
    );

    // Retire is blocked when the attribute is placed in any table at the current
    // stage or any later stage — retiring it would hide an attribute that is still
    // actively used in the canvas.
    const retireBlockedIds = useMemo(
        () => new Set(
            attributePool
                .filter((attr) =>
                    stages.slice(currentStageIndex).some((stage) =>
                        stage.tables.some((t) =>
                            t.tableAttributes.some((ta) => ta.attributeId === attr.id)
                        )
                    )
                )
                .map((attr) => attr.id)
        ),
        [attributePool, stages, currentStageIndex]
    );

    const openAddModal = () => {
        setModalMode('add');
        setEditingAttribute(null);
        setModalOpen(true);
    };

    const openEditModal = (attr) => {
        setModalMode('edit');
        setEditingAttribute(attr);
        setModalOpen(true);
    };

    const handleAddAttribute = ({ name, data_type }) => {
        if (modalMode === 'edit') {
            updateAttribute(editingAttribute.id, { name, data_type });
        } else {
            addAttribute({
                id: generateId(),
                name,
                data_type,
                introduced_at_stage_Id: stages[0].stageId,
                retired_at_stage_Id: null,
            });
        }
        setModalOpen(false);
        setEditingAttribute(null);
    };

    return (
        <div className="attribute-panel">
            <div className="attribute-panel__header">
                <span className="attribute-panel__title">Attributes</span>
            </div>
            <div className="attribute-panel__actions">
                <button className="attribute-panel__btn" onClick={openAddModal}>
                    + Add attribute
                </button>
            </div>
            <div className="attribute-panel__list">
                {attributes.length === 0 ? (
                    <p className="attribute-panel__empty">No attributes yet</p>
                ) : (
                    attributes.map((attr) => (
                        <AttributeItem
                            key={attr.id}
                            attribute={attr}
                            isUnused={unusedIds.has(attr.id)}
                            retireBlocked={retireBlockedIds.has(attr.id)}
                            onToggleRetire={() =>
                                attr.isRetired
                                    ? unretireAttribute(attr.id)
                                    : retireAttribute(attr.id, stages[currentStageIndex].stageId)
                            }
                            onDelete={() => deleteAttribute(attr.id)}
                            onEdit={() => openEditModal(attr)}
                        />
                    ))
                )}
            </div>
            <NewAttributeModal
                isOpen={modalOpen}
                mode={modalMode}
                onClose={() => { setModalOpen(false); setEditingAttribute(null); }}
                onSubmit={handleAddAttribute}
                initialName={editingAttribute?.name ?? ''}
                initialDataType={editingAttribute?.data_type ?? 'VARCHAR'}
            />
        </div>
    );
};

export default AttributePanel;

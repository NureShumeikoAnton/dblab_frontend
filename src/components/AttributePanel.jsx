import React, { useState } from 'react';
import useEditorStore, { STAGE_ORDER } from '../store/editorStore.js';
import AttributeItem from './AttributeItem.jsx';
import NewAttributeModal from './NewAttributeModal.jsx';
import './styles/AttributePanel.css';

const AttributePanel = () => {
    const attributePool = useEditorStore((s) => s.attributePool);
    const currentStageIndex = useEditorStore((s) => s.currentStageIndex);
    const stages = useEditorStore((s) => s.stages);
    const addAttribute = useEditorStore((s) => s.addAttribute);
    const retireAttribute = useEditorStore((s) => s.retireAttribute);
    const unretireAttribute = useEditorStore((s) => s.unretireAttribute);
    const deleteAttribute = useEditorStore((s) => s.deleteAttribute);

    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('global');

    const currentOrder = STAGE_ORDER.indexOf(stages[currentStageIndex]?.stageId);

    const attributes = attributePool
        .filter((attr) => STAGE_ORDER.indexOf(attr.introduced_at_stage_Id) <= currentOrder)
        .map((attr) => {
            const retireOrder = attr.retired_at_stage_Id !== null
                ? STAGE_ORDER.indexOf(attr.retired_at_stage_Id)
                : Infinity;
            return { ...attr, isRetired: retireOrder <= currentOrder };
        });

    // Delete removes from attributePool entirely — must check ALL stages, not just current.
    const globallyUsedIds = new Set(
        stages.flatMap((stage) =>
            stage.tables.flatMap((t) =>
                t.tableAttributes.map((ta) => ta.attributeId)
            )
        )
    );
    const unusedIds = new Set(
        attributePool
            .filter((attr) => STAGE_ORDER.indexOf(attr.introduced_at_stage_Id) <= currentOrder)
            .filter((attr) => !globallyUsedIds.has(attr.id))
            .map((attr) => attr.id)
    );

    // Retire is blocked when the attribute is placed in any table at the current
    // stage or any later stage — retiring it would hide an attribute that is still
    // actively used in the canvas.
    const retireBlockedIds = new Set(
        attributePool
            .filter((attr) =>
                stages.slice(currentStageIndex).some((stage) =>
                    stage.tables.some((t) =>
                        t.tableAttributes.some((ta) => ta.attributeId === attr.id)
                    )
                )
            )
            .map((attr) => attr.id)
    );

    const openGlobalModal = () => {
        setModalMode('global');
        setModalOpen(true);
    };

    const openStageModal = () => {
        setModalMode('stage');
        setModalOpen(true);
    };

    const handleAddAttribute = ({ name, data_type }) => {
        const stageId =
            modalMode === 'global'
                ? stages[0].stageId
                : stages[currentStageIndex].stageId;
        addAttribute({
            id: crypto.randomUUID(),
            name,
            data_type,
            introduced_at_stage_Id: stageId,
            retired_at_stage_Id: null,
        });
        setModalOpen(false);
    };

    return (
        <div className="attribute-panel">
            <div className="attribute-panel__header">
                <span className="attribute-panel__title">Attributes</span>
            </div>
            <div className="attribute-panel__actions">
                <button className="attribute-panel__btn" onClick={openGlobalModal}>
                    + Add global
                </button>
                <button className="attribute-panel__btn" onClick={openStageModal}>
                    + Add to this stage
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
                        />
                    ))
                )}
            </div>
            <NewAttributeModal
                isOpen={modalOpen}
                mode={modalMode}
                onClose={() => setModalOpen(false)}
                onSubmit={handleAddAttribute}
            />
        </div>
    );
};

export default AttributePanel;

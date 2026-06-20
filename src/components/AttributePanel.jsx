import React, { useMemo } from 'react';
import useEditorStore from '../store/editorStore.js';
import AttributeItem from './AttributeItem.jsx';
import './styles/AttributePanel.css';

const AttributePanel = () => {
    const attributePool = useEditorStore((s) => s.attributePool);
    const currentStageIndex = useEditorStore((s) => s.currentStageIndex);
    const stages = useEditorStore((s) => s.stages);
    const retireAttribute = useEditorStore((s) => s.retireAttribute);
    const unretireAttribute = useEditorStore((s) => s.unretireAttribute);
    const deleteAttribute = useEditorStore((s) => s.deleteAttribute);
    const openModal = useEditorStore((s) => s.openModal);

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

    const openAddModal = () => openModal('newAttribute', { mode: 'add' });
    const openEditModal = (attr) => openModal('newAttribute', { mode: 'edit', attribute: attr });

    return (
        <div className="attribute-panel">
            <div className="attribute-panel__header">
                <span className="attribute-panel__title">Атрибути</span>
            </div>
            <div className="attribute-panel__actions">
                <button className="attribute-panel__btn" onClick={openAddModal}>
                    + Додати атрибут
                </button>
            </div>
            <div className="attribute-panel__list">
                {attributes.length === 0 ? (
                    <p className="attribute-panel__empty">Атрибутів ще немає</p>
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
        </div>
    );
};

export default AttributePanel;

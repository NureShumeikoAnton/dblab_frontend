import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import useEditorStore from '../store/editorStore.js';
import './styles/AddRelationshipModal.css';

const AddRelationshipModal = ({ sourceTable, targetTable, attributePool, stageIndex, onClose }) => {
    const addTableAttribute = useEditorStore((s) => s.addTableAttribute);
    const updateTableAttribute = useEditorStore((s) => s.updateTableAttribute);
    const addRelationship = useEditorStore((s) => s.addRelationship);

    const attrMap = useMemo(
        () => new Map(attributePool.map((a) => [a.id, a])),
        [attributePool]
    );

    // Source PKs with pool attribute info
    const sourcePKs = useMemo(
        () => sourceTable.tableAttributes
            .filter((ta) => ta.is_PK)
            .map((ta) => ({ ta, attr: attrMap.get(ta.attributeId) }))
            .filter(({ attr }) => Boolean(attr)),
        [sourceTable, attrMap]
    );

    const [selectedPKAttrId, setSelectedPKAttrId] = useState(
        () => sourcePKs[0]?.ta.attributeId ?? null
    );

    // Check if target already has the selected PK attr marked as FK
    const targetAlreadyHasFK = useMemo(() => {
        if (!selectedPKAttrId) return false;
        return targetTable.tableAttributes.some(
            (ta) => ta.attributeId === selectedPKAttrId && ta.is_FK
        );
    }, [targetTable, selectedPKAttrId]);

    const selectedAttrName = attrMap.get(selectedPKAttrId)?.name ?? '';

    const handleConfirm = () => {
        if (!selectedPKAttrId) return;

        if (!targetAlreadyHasFK) {
            // Check if target already has the attribute (just not FK)
            const existingTA = targetTable.tableAttributes.find(
                (ta) => ta.attributeId === selectedPKAttrId
            );
            if (existingTA) {
                updateTableAttribute(stageIndex, targetTable.id, existingTA.id, { is_FK: true });
            } else {
                const maxOrder = targetTable.tableAttributes.reduce(
                    (max, ta) => Math.max(max, ta.order), -1
                );
                addTableAttribute(stageIndex, targetTable.id, {
                    id: crypto.randomUUID(),
                    attributeId: selectedPKAttrId,
                    is_PK: false,
                    is_FK: true,
                    alias: null,
                    order: maxOrder + 1,
                });
            }
        }

        addRelationship(stageIndex, {
            id: crypto.randomUUID(),
            type: 'non-identifying',
            color: '#64748b',
            cardinality_t1: '1',
            cardinality_t2: '0..*',
            table1Id: sourceTable.id,
            table2Id: targetTable.id,
        });

        onClose();
    };

    if (sourcePKs.length === 0) return null;

    return createPortal(
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal add-rel-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal__header">
                    <div>
                        <p className="modal__title">Add Relationship</p>
                        <p className="modal__subtitle">
                            {sourceTable.name} → {targetTable.name}
                        </p>
                    </div>
                </div>

                {sourcePKs.length > 1 && (
                    <label className="modal__label add-rel-modal__label">
                        PK attribute to use as FK reference
                        <select
                            className="modal__select"
                            value={selectedPKAttrId ?? ''}
                            onChange={(e) => setSelectedPKAttrId(e.target.value)}
                        >
                            {sourcePKs.map(({ ta, attr }) => (
                                <option key={ta.attributeId} value={ta.attributeId}>
                                    {attr.name}
                                </option>
                            ))}
                        </select>
                    </label>
                )}

                {targetAlreadyHasFK ? (
                    <p className="add-rel-modal__info add-rel-modal__info--ok">
                        ✓ <strong>{targetTable.name}</strong> already has <strong>{selectedAttrName}</strong> as FK.
                        A relationship will be created.
                    </p>
                ) : (
                    <p className="add-rel-modal__info">
                        <strong>{targetTable.name}</strong> has no FK linking to <strong>{sourceTable.name}</strong>.
                        <strong> {selectedAttrName}</strong> will be added as FK.
                    </p>
                )}

                <div className="modal__actions">
                    <button type="button" className="modal__btn modal__btn--secondary" onClick={onClose}>
                        Cancel
                    </button>
                    <button type="button" className="modal__btn modal__btn--primary" onClick={handleConfirm}>
                        Create relationship
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default AddRelationshipModal;

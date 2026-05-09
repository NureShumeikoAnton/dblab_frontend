import { useState, useMemo, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import useEditorStore from '../store/editorStore.js';
import './styles/AddRelationshipModal.css';

const LS_KEY = 'dblab_skip_fk_confirm';

const AddRelationshipModal = ({ sourceTable, targetTable, attributePool, stageIndex, onClose }) => {
    const addTableAttribute = useEditorStore((s) => s.addTableAttribute);
    const updateTableAttribute = useEditorStore((s) => s.updateTableAttribute);
    const addRelationship = useEditorStore((s) => s.addRelationship);

    const attrMap = useMemo(
        () => new Map(attributePool.map((a) => [a.id, a])),
        [attributePool]
    );

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
    const [skipNext, setSkipNext] = useState(false);

    const targetAlreadyHasFK = useMemo(() => {
        if (!selectedPKAttrId) return false;
        return targetTable.tableAttributes.some(
            (ta) => ta.attributeId === selectedPKAttrId && ta.is_FK
        );
    }, [targetTable, selectedPKAttrId]);

    const selectedAttrName = attrMap.get(selectedPKAttrId)?.name ?? '';

    const handleConfirm = useCallback(() => {
        if (!selectedPKAttrId) return;

        if (!targetAlreadyHasFK) {
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

        if (skipNext) {
            localStorage.setItem(LS_KEY, 'true');
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
    }, [selectedPKAttrId, targetAlreadyHasFK, skipNext, stageIndex, sourceTable.id, targetTable, addTableAttribute, updateTableAttribute, addRelationship, onClose]);

    // When FK already exists and the user opted out of seeing this modal, auto-confirm.
    useEffect(() => {
        if (targetAlreadyHasFK && localStorage.getItem(LS_KEY) === 'true') {
            handleConfirm();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // intentionally runs only on mount

    if (sourcePKs.length === 0) return null;

    // If we'll auto-confirm, render nothing (handleConfirm fires on mount above)
    if (targetAlreadyHasFK && localStorage.getItem(LS_KEY) === 'true') return null;

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
                    <>
                        <p className="add-rel-modal__info add-rel-modal__info--ok">
                            ✓ <strong>{targetTable.name}</strong> already has <strong>{selectedAttrName}</strong> as FK.
                            A relationship will be created.
                        </p>
                        <label className="add-rel-modal__skip-label">
                            <input
                                type="checkbox"
                                checked={skipNext}
                                onChange={(e) => setSkipNext(e.target.checked)}
                            />
                            Do not show again when FK already exists
                        </label>
                    </>
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

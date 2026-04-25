import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import useEditorStore from '../store/editorStore.js';
import './styles/AttributeRowToolbar.css';

const AttributeRowToolbar = () => {
    const currentStageIndex = useEditorStore((s) => s.currentStageIndex);
    const selectedTA = useEditorStore((s) => s.ui.selectedTableAttribute);
    const stages = useEditorStore((s) => s.stages);
    const attributePool = useEditorStore((s) => s.attributePool);
    const updateTableAttribute = useEditorStore((s) => s.updateTableAttribute);
    const reorderTableAttribute = useEditorStore((s) => s.reorderTableAttribute);
    const clearSelectedTableAttribute = useEditorStore((s) => s.clearSelectedTableAttribute);

    const table = stages[currentStageIndex]?.tables.find((t) => t.id === selectedTA?.tableId);
    const ta = table?.tableAttributes.find((a) => a.id === selectedTA?.tableAttributeId);
    const attr = attributePool.find((a) => a.id === ta?.attributeId);

    const sorted = useMemo(
        () => table ? [...table.tableAttributes].sort((a, b) => a.order - b.order) : [],
        [table]
    );
    const rowIndex = sorted.findIndex((a) => a.id === selectedTA?.tableAttributeId);

    const [localAlias, setLocalAlias] = useState('');
    const aliasTimer = useRef(null);

    useEffect(() => {
        setLocalAlias(ta?.alias ?? '');
    }, [selectedTA]);

    const commitAlias = useCallback((value) => {
        updateTableAttribute(
            currentStageIndex,
            selectedTA.tableId,
            selectedTA.tableAttributeId,
            { alias: value.trim() || null }
        );
    }, [currentStageIndex, selectedTA, updateTableAttribute]);

    const handleAliasChange = useCallback((e) => {
        const value = e.target.value;
        setLocalAlias(value);
        clearTimeout(aliasTimer.current);
        aliasTimer.current = setTimeout(() => commitAlias(value), 300);
    }, [commitAlias]);

    const handleAliasBlur = useCallback(() => {
        clearTimeout(aliasTimer.current);
        commitAlias(localAlias);
    }, [commitAlias, localAlias]);

    const handlePKChange = useCallback(() => {
        const newPK = !ta.is_PK;
        updateTableAttribute(
            currentStageIndex,
            selectedTA.tableId,
            selectedTA.tableAttributeId,
            { is_PK: newPK, ...(newPK && { is_FK: false }) }
        );
    }, [currentStageIndex, selectedTA, ta, updateTableAttribute]);

    const handleFKChange = useCallback(() => {
        const newFK = !ta.is_FK;
        updateTableAttribute(
            currentStageIndex,
            selectedTA.tableId,
            selectedTA.tableAttributeId,
            { is_FK: newFK, ...(newFK && { is_PK: false }) }
        );
    }, [currentStageIndex, selectedTA, ta, updateTableAttribute]);

    const handleMoveUp = useCallback(() => {
        reorderTableAttribute(currentStageIndex, selectedTA.tableId, selectedTA.tableAttributeId, 'up');
    }, [currentStageIndex, selectedTA, reorderTableAttribute]);

    const handleMoveDown = useCallback(() => {
        reorderTableAttribute(currentStageIndex, selectedTA.tableId, selectedTA.tableAttributeId, 'down');
    }, [currentStageIndex, selectedTA, reorderTableAttribute]);

    if (!ta) return null;

    return (
        <div className="attr-row-toolbar">
            <span className="attr-row-toolbar__label">Alias</span>
            <input
                className="attr-row-toolbar__alias-input"
                type="text"
                value={localAlias}
                onChange={handleAliasChange}
                onBlur={handleAliasBlur}
                placeholder={attr?.name ?? ''}
            />
            <label className="attr-row-toolbar__check-label">
                <input type="checkbox" checked={ta.is_PK} onChange={handlePKChange} disabled={ta.is_FK} />
                PK
            </label>
            <label className="attr-row-toolbar__check-label">
                <input type="checkbox" checked={ta.is_FK} onChange={handleFKChange} disabled={ta.is_PK} />
                FK
            </label>
            <div className="attr-row-toolbar__order-btns">
                <button
                    type="button"
                    className="attr-row-toolbar__order-btn"
                    onClick={handleMoveUp}
                    disabled={rowIndex <= 0}
                    aria-label="Move up"
                    title="Move up"
                >
                    ↑
                </button>
                <button
                    type="button"
                    className="attr-row-toolbar__order-btn"
                    onClick={handleMoveDown}
                    disabled={rowIndex < 0 || rowIndex >= sorted.length - 1}
                    aria-label="Move down"
                    title="Move down"
                >
                    ↓
                </button>
            </div>
            <button
                type="button"
                className="attr-row-toolbar__close"
                onClick={clearSelectedTableAttribute}
                aria-label="Close"
            >
                ✕
            </button>
        </div>
    );
};

export default AttributeRowToolbar;

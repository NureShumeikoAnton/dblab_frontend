import { useState, useEffect, useCallback } from 'react';
import useEditorStore from '../store/editorStore.js';
import './styles/TableToolbar.css';

export const TABLE_COLORS = [
    '#4A90D9', '#E74C3C', '#27AE60', '#F39C12', '#9B59B6',
    '#16A085', '#2C3E50', '#E67E22', '#1ABC9C', '#D35400',
];

const TableToolbar = () => {
    const currentStageIndex = useEditorStore((s) => s.currentStageIndex);
    const selectedTableId = useEditorStore((s) => s.ui.selectedTableId);
    const tables = useEditorStore((s) => s.stages[currentStageIndex]?.tables ?? []);
    const updateTable = useEditorStore((s) => s.updateTable);
    const clearSelectedTable = useEditorStore((s) => s.clearSelectedTable);

    const table = tables.find((t) => t.id === selectedTableId);

    const [localName, setLocalName] = useState('');

    // Re-seed local name whenever the selected table changes
    useEffect(() => {
        if (table) setLocalName(table.name);
    }, [selectedTableId, table?.name]);

    const handleNameChange = useCallback((e) => {
        const value = e.target.value;
        setLocalName(value);
        if (value.trim()) {
            updateTable(currentStageIndex, selectedTableId, { name: value.trim() });
        }
    }, [currentStageIndex, selectedTableId, updateTable]);

    const handleColorClick = useCallback((color) => {
        updateTable(currentStageIndex, selectedTableId, { color });
    }, [currentStageIndex, selectedTableId, updateTable]);

    if (!table) return null;

    return (
        <div className="table-toolbar">
            <input
                className="table-toolbar__name-input"
                type="text"
                value={localName}
                onChange={handleNameChange}
                placeholder="Table name"
                autoFocus
            />
            <div className="table-toolbar__palette">
                {TABLE_COLORS.map((c) => (
                    <button
                        key={c}
                        type="button"
                        className={`table-toolbar__swatch${table.color === c ? ' table-toolbar__swatch--active' : ''}`}
                        style={{ background: c }}
                        onClick={() => handleColorClick(c)}
                        aria-label={c}
                    />
                ))}
            </div>
            <button
                type="button"
                className="table-toolbar__close"
                onClick={clearSelectedTable}
                aria-label="Close"
            >
                ✕
            </button>
        </div>
    );
};

export default TableToolbar;

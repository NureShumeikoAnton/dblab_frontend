import { useCallback } from 'react';
import useEditorStore from '../store/editorStore.js';
import { TABLE_COLORS } from './TableToolbar.jsx';
import './styles/FDToolbar.css';

const FDToolbar = () => {
    const currentStageIndex = useEditorStore((s) => s.currentStageIndex);
    const selectedFDId = useEditorStore((s) => s.ui.selectedFDId);
    const fds = useEditorStore((s) => s.stages[currentStageIndex]?.fds ?? []);
    const attributePool = useEditorStore((s) => s.attributePool);
    const updateFD = useEditorStore((s) => s.updateFD);
    const deleteFD = useEditorStore((s) => s.deleteFD);
    const clearSelectedFD = useEditorStore((s) => s.clearSelectedFD);

    const fd = fds.find((f) => f.id === selectedFDId);

    const attrName = (attributeId) =>
        attributePool.find((a) => a.id === attributeId)?.name ?? '?';

    const startNames = fd?.starts.map((s) => attrName(s.attributeId)).join(', ') ?? '';
    const endNames   = fd?.ends.map((e) => attrName(e.attributeId)).join(', ') ?? '';

    const handleColorClick = useCallback((color) => {
        updateFD(currentStageIndex, selectedFDId, { color });
    }, [currentStageIndex, selectedFDId, updateFD]);

    const handleTypeChange = useCallback((e) => {
        updateFD(currentStageIndex, selectedFDId, { type: e.target.value });
    }, [currentStageIndex, selectedFDId, updateFD]);

    const handleLevelDec = useCallback(() => {
        if (!fd) return;
        // Step down: ..., 2, 1, -1, -2, ... (skip 0)
        const next = fd.level === 1 ? -1 : fd.level - 1;
        updateFD(currentStageIndex, selectedFDId, { level: next });
    }, [currentStageIndex, selectedFDId, fd, updateFD]);

    const handleLevelInc = useCallback(() => {
        if (!fd) return;
        // Step up: ..., -2, -1, 1, 2, ... (skip 0)
        const next = fd.level === -1 ? 1 : fd.level + 1;
        updateFD(currentStageIndex, selectedFDId, { level: next });
    }, [currentStageIndex, selectedFDId, fd, updateFD]);

    const handleDelete = useCallback(() => {
        deleteFD(currentStageIndex, selectedFDId);
    }, [currentStageIndex, selectedFDId, deleteFD]);

    if (!fd) return null;

    return (
        <div className="fd-toolbar">
            <span className="fd-toolbar__attrs fd-toolbar__attrs--start" title={startNames}>
                {startNames}
            </span>
            <span className="fd-toolbar__arrow">→</span>

            <div className="fd-toolbar__palette">
                {TABLE_COLORS.map((c) => (
                    <button
                        key={c}
                        type="button"
                        className={`fd-toolbar__swatch${fd.color === c ? ' fd-toolbar__swatch--active' : ''}`}
                        style={{ background: c }}
                        onClick={() => handleColorClick(c)}
                        aria-label={c}
                    />
                ))}
            </div>

            <select
                className="fd-toolbar__type-select"
                value={fd.type}
                onChange={handleTypeChange}
            >
                <option value="full">Full</option>
                <option value="partial">Partial</option>
                <option value="transitive">Transitive</option>
            </select>

            <div className="fd-toolbar__level-stepper">
                <button
                    type="button"
                    className="fd-toolbar__level-btn"
                    onClick={handleLevelInc}
                    aria-label="Increase level"
                >
                    ←
                </button>
                <span className="fd-toolbar__level-val">{fd.level}</span>
                <button
                    type="button"
                    className="fd-toolbar__level-btn"
                    onClick={handleLevelDec}
                    aria-label="Decrease level"
                >
                    →
                </button>
            </div>

            <span className="fd-toolbar__arrow">→</span>
            <span className="fd-toolbar__attrs fd-toolbar__attrs--end" title={endNames}>
                {endNames}
            </span>

            <button
                type="button"
                className="fd-toolbar__delete"
                onClick={handleDelete}
                aria-label="Delete FD"
                title="Delete FD"
            >
                🗑
            </button>
            <button
                type="button"
                className="fd-toolbar__close"
                onClick={clearSelectedFD}
                aria-label="Close"
            >
                ✕
            </button>
        </div>
    );
};

export default FDToolbar;

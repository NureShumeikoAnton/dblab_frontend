import { useCallback, useMemo } from 'react';
import useEditorStore from '../store/editorStore.js';
import { TABLE_COLORS } from './TableToolbar.jsx';
import './styles/RelationshipToolbar.css';

const CARDINALITY_OPTIONS = ['1', '0..1', '1..*', '0..*'];

const RelationshipToolbar = () => {
    const currentStageIndex = useEditorStore((s) => s.currentStageIndex);
    const selectedRelationshipId = useEditorStore((s) => s.ui.selectedRelationshipId);
    const tables = useEditorStore((s) => s.stages[currentStageIndex]?.tables ?? []);
    const relationships = useEditorStore((s) => s.stages[currentStageIndex]?.relationships ?? []);
    const attributePool = useEditorStore((s) => s.attributePool);
    const updateRelationship = useEditorStore((s) => s.updateRelationship);
    const deleteRelationship = useEditorStore((s) => s.deleteRelationship);
    const clearSelectedRelationship = useEditorStore((s) => s.clearSelectedRelationship);

    const rel = relationships.find((r) => r.id === selectedRelationshipId);

    const attrMap = useMemo(
        () => new Map(attributePool.map((a) => [a.id, a])),
        [attributePool]
    );

    const sourceTable = rel ? tables.find((t) => t.id === rel.table1Id) : null;
    const targetTable = rel ? tables.find((t) => t.id === rel.table2Id) : null;

    // Informational: find the FK attribute in target that links back to source PK
    const linkedFKName = useMemo(() => {
        if (!sourceTable || !targetTable) return null;
        const sourcePKIds = new Set(
            sourceTable.tableAttributes.filter((ta) => ta.is_PK).map((ta) => ta.attributeId)
        );
        const fkTA = targetTable.tableAttributes.find(
            (ta) => ta.is_FK && sourcePKIds.has(ta.attributeId)
        );
        return fkTA ? (attrMap.get(fkTA.attributeId)?.name ?? null) : null;
    }, [sourceTable, targetTable, attrMap]);

    const handleCardinality1 = useCallback((e) => {
        updateRelationship(currentStageIndex, selectedRelationshipId, { cardinality_t1: e.target.value });
    }, [currentStageIndex, selectedRelationshipId, updateRelationship]);

    const handleCardinality2 = useCallback((e) => {
        updateRelationship(currentStageIndex, selectedRelationshipId, { cardinality_t2: e.target.value });
    }, [currentStageIndex, selectedRelationshipId, updateRelationship]);

    const handleType = useCallback((e) => {
        updateRelationship(currentStageIndex, selectedRelationshipId, { type: e.target.value });
    }, [currentStageIndex, selectedRelationshipId, updateRelationship]);

    const handleColor = useCallback((color) => {
        updateRelationship(currentStageIndex, selectedRelationshipId, { color });
    }, [currentStageIndex, selectedRelationshipId, updateRelationship]);

    const handleDelete = useCallback(() => {
        deleteRelationship(currentStageIndex, selectedRelationshipId);
    }, [currentStageIndex, selectedRelationshipId, deleteRelationship]);

    if (!rel || !sourceTable || !targetTable) return null;

    return (
        <div className="rel-toolbar">
            <span className="rel-toolbar__table rel-toolbar__table--source" title={sourceTable.name}>
                {sourceTable.name}
            </span>

            <select
                className="rel-toolbar__card-select"
                value={rel.cardinality_t1}
                onChange={handleCardinality1}
                title="Кардинальність джерела"
            >
                {CARDINALITY_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                ))}
            </select>

            <select
                className="rel-toolbar__type-select"
                value={rel.type}
                onChange={handleType}
                title="Тип зв'язку"
            >
                <option value="identifying">Ідентифікуючий</option>
                <option value="non-identifying">Неідентифікуючий</option>
                <option value="many-to-many">Багато до багатьох</option>
            </select>

            <select
                className="rel-toolbar__card-select"
                value={rel.cardinality_t2}
                onChange={handleCardinality2}
                title="Кардинальність цілі"
            >
                {CARDINALITY_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                ))}
            </select>

            <span className="rel-toolbar__table rel-toolbar__table--target" title={targetTable.name}>
                {targetTable.name}
            </span>

            {linkedFKName ? (
                <span className="rel-toolbar__fk-chip" title="Атрибут FK, що зв'язує таблиці">
                    FK: {linkedFKName}
                </span>
            ) : (
                <span className="rel-toolbar__fk-chip rel-toolbar__fk-chip--missing" title="FK атрибут не знайдено в цільовій таблиці">
                    FK не прив'язано
                </span>
            )}

            <div className="rel-toolbar__palette">
                {TABLE_COLORS.map((c) => (
                    <button
                        key={c}
                        type="button"
                        className={`rel-toolbar__swatch${rel.color === c ? ' rel-toolbar__swatch--active' : ''}`}
                        style={{ background: c }}
                        onClick={() => handleColor(c)}
                        aria-label={c}
                    />
                ))}
            </div>

            <button
                type="button"
                className="rel-toolbar__delete"
                onClick={handleDelete}
                aria-label="Видалити зв'язок"
                title="Видалити зв'язок"
            >
                🗑
            </button>
            <button
                type="button"
                className="rel-toolbar__close"
                onClick={clearSelectedRelationship}
                aria-label="Закрити"
            >
                ✕
            </button>
        </div>
    );
};

export default RelationshipToolbar;

import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import generateId from '../utils/generateId.js';
import { Handle, Position, useStore } from '@xyflow/react';
import useEditorStore from '../store/editorStore.js';
import { TABLE_COLORS } from './TableToolbar.jsx';
import { useNFAnalysis } from '../hooks/useNFAnalysis.jsx';
import TableContextMenu from './TableContextMenu.jsx';
import AttributeRowContextMenu from './AttributeRowContextMenu.jsx';
import DeleteTableModal from './DeleteTableModal.jsx';
import CreateTableFromAttrModal from './CreateTableFromAttrModal.jsx';
import './styles/TableNode.css';

const TableNode = ({ data }) => {
    const { table } = data;
    const attributePool = useEditorStore((s) => s.attributePool);
    const currentStageIndex = useEditorStore((s) => s.currentStageIndex);
    const fds = useEditorStore((s) => s.stages[currentStageIndex]?.fds ?? []);
    const showFDs = useEditorStore((s) => s.ui.showFDs);
    const deleteTable = useEditorStore((s) => s.deleteTable);
    const deleteFD = useEditorStore((s) => s.deleteFD);
    const addTable = useEditorStore((s) => s.addTable);
    const addTableAttribute = useEditorStore((s) => s.addTableAttribute);
    const updateTableAttribute = useEditorStore((s) => s.updateTableAttribute);
    const addRelationship = useEditorStore((s) => s.addRelationship);
    const selectTable = useEditorStore((s) => s.selectTable);
    const selectTableAttribute = useEditorStore((s) => s.selectTableAttribute);
    const removeTableAttribute = useEditorStore((s) => s.removeTableAttribute);
    const startRelationshipCreation = useEditorStore((s) => s.startRelationshipCreation);
    const confirmRelationshipTarget = useEditorStore((s) => s.confirmRelationshipTarget);
    const cancelRelationshipCreation = useEditorStore((s) => s.cancelRelationshipCreation);
    const pendingRelationshipSourceTableId = useEditorStore((s) => s.ui.pendingRelationshipSourceTableId);
    const selectedTableAttribute = useEditorStore((s) => s.ui.selectedTableAttribute);

    const analysis = useNFAnalysis();

    const [contextMenu, setContextMenu] = useState(null); // { x, y } | null
    const [attrContextMenu, setAttrContextMenu] = useState(null); // { x, y, tableAttributeId } | null
    const [deleteConfirmFDs, setDeleteConfirmFDs] = useState(null); // FD[] | null
    const [createTableFromAttrInfo, setCreateTableFromAttrInfo] = useState(null); // { taIds, attrNames, newTableId } | null
    const [hoveredAttrId, setHoveredAttrId] = useState(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [stagedAttrIds, setStagedAttrIds] = useState(new Set()); // tableAttributeIds staged for composite-PK extraction

    useEffect(() => {
        if (selectedTableAttribute?.tableId !== table.id) {
            setStagedAttrIds(new Set());
        }
    }, [selectedTableAttribute?.tableId, table.id]);

    const hasPK = useMemo(
        () => table.tableAttributes.some((ta) => ta.is_PK),
        [table.tableAttributes]
    );

    const attrMap = useMemo(
        () => new Map(attributePool.map((a) => [a.id, a])),
        [attributePool]
    );

    const { leftAttrIds, rightAttrIds } = useMemo(() => {
        const leftAttrIds = new Set();
        const rightAttrIds = new Set();
        fds.forEach((fd) => {
            const target = fd.level < 0 ? rightAttrIds : leftAttrIds;
            fd.starts.forEach((s) => target.add(s.attributeId));
            fd.ends.forEach((e) => target.add(e.attributeId));
        });
        return { leftAttrIds, rightAttrIds };
    }, [fds]);

    const isConnecting = useStore((s) => s.connection?.inProgress ?? false);

    const handleHeaderClick = useCallback((e) => {
        e.stopPropagation();
        if (pendingRelationshipSourceTableId) {
            if (table.id === pendingRelationshipSourceTableId) {
                cancelRelationshipCreation();
            } else {
                confirmRelationshipTarget(table.id);
            }
            return;
        }
        selectTable(table.id);
    }, [pendingRelationshipSourceTableId, table.id, selectTable, cancelRelationshipCreation, confirmRelationshipTarget]);

    const handleContextMenu = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setAttrContextMenu(null);
        setContextMenu({ x: e.clientX, y: e.clientY });
    }, []);

    const handleRowClick = useCallback((e, tableAttributeId) => {
        e.stopPropagation();
        if (pendingRelationshipSourceTableId) {
            if (table.id === pendingRelationshipSourceTableId) {
                cancelRelationshipCreation();
            } else {
                confirmRelationshipTarget(table.id);
            }
            return;
        }
        if (e.ctrlKey || e.metaKey) {
            setStagedAttrIds((prev) => {
                const next = new Set(prev);
                if (next.has(tableAttributeId)) {
                    next.delete(tableAttributeId);
                } else {
                    next.add(tableAttributeId);
                }
                return next;
            });
            return;
        }
        setStagedAttrIds(new Set());
        selectTableAttribute(table.id, tableAttributeId);
    }, [pendingRelationshipSourceTableId, table.id, selectTableAttribute, cancelRelationshipCreation, confirmRelationshipTarget]);

    const handleRowContextMenu = useCallback((e, tableAttributeId) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu(null);
        setAttrContextMenu({ x: e.clientX, y: e.clientY, tableAttributeId });
    }, []);

    const handleDelete = useCallback(() => {
        const tableAttrIds = new Set(table.tableAttributes.map((ta) => ta.attributeId));
        const affected = fds.filter((fd) =>
            fd.starts.some((s) => tableAttrIds.has(s.attributeId)) ||
            fd.ends.some((e) => tableAttrIds.has(e.attributeId))
        );
        if (affected.length === 0) {
            deleteTable(currentStageIndex, table.id);
        } else {
            setDeleteConfirmFDs(affected);
        }
    }, [currentStageIndex, table, fds, deleteTable]);

    const handleSaveDelete = useCallback(() => {
        deleteTable(currentStageIndex, table.id);
        setDeleteConfirmFDs(null);
    }, [currentStageIndex, table.id, deleteTable]);

    const handleDeleteAll = useCallback(() => {
        deleteConfirmFDs.forEach((fd) => deleteFD(currentStageIndex, fd.id));
        deleteTable(currentStageIndex, table.id);
        setDeleteConfirmFDs(null);
    }, [currentStageIndex, table.id, deleteConfirmFDs, deleteFD, deleteTable]);

    const handleCreateTableWithPK = useCallback((tableAttributeIds) => {
        const tas = tableAttributeIds
            .map((id) => table.tableAttributes.find((a) => a.id === id))
            .filter(Boolean);
        if (!tas.length) return;
        const attrs = tas.map((ta) => attrMap.get(ta.attributeId)).filter(Boolean);
        if (attrs.length !== tas.length) return;

        const newTableId = generateId();
        const color = TABLE_COLORS[Math.floor(Math.random() * TABLE_COLORS.length)];
        const position = { x: table.position.x + 280, y: table.position.y };
        const baseName = attrs.length === 1 ? attrs[0].name + '_Table' : attrs.map((a) => a.name).join('_') + '_Table';

        addTable(currentStageIndex, {
            id: newTableId,
            name: baseName,
            color,
            position,
            tableAttributes: tas.map((ta, i) => ({
                id: generateId(),
                attributeId: ta.attributeId,
                is_PK: true,
                is_FK: false,
                alias: null,
                order: i,
            })),
        });

        setCreateTableFromAttrInfo({
            taIds: tas.map((ta) => ta.id),
            attrNames: attrs.map((a) => a.name),
            newTableId,
        });
        setStagedAttrIds(new Set());
    }, [table, attrMap, currentStageIndex, addTable]);

    const handleCreateTableFromAttrConfirm = useCallback((markAsFK) => {
        if (!createTableFromAttrInfo) return;
        const { taIds, newTableId } = createTableFromAttrInfo;
        if (markAsFK) {
            taIds.forEach((taId) => updateTableAttribute(currentStageIndex, table.id, taId, { is_FK: true }));
            addRelationship(currentStageIndex, {
                id: generateId(),
                type: 'non-identifying',
                color: '#64748b',
                cardinality_t1: '1',
                cardinality_t2: '0..*',
                table1Id: newTableId,
                table2Id: table.id,
            });
        }
        setCreateTableFromAttrInfo(null);
    }, [createTableFromAttrInfo, currentStageIndex, table.id, updateTableAttribute, addRelationship]);

    const handleDragEnter = useCallback((e) => {
        if (!e.dataTransfer.types.includes('application/dblab-attribute')) return;
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    }, []);

    const handleDragOver = useCallback((e) => {
        if (!e.dataTransfer.types.includes('application/dblab-attribute')) return;
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
    }, []);

    const handleDragLeave = useCallback((e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
            setIsDragOver(false);
        }
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        const attrId = e.dataTransfer.getData('application/dblab-attribute');
        if (!attrId) return;

        const maxOrder = table.tableAttributes.reduce((max, ta) => Math.max(max, ta.order), -1);
        addTableAttribute(currentStageIndex, table.id, {
            id: generateId(),
            attributeId: attrId,
            is_PK: false,
            is_FK: false,
            alias: null,
            order: maxOrder + 1,
        });
    }, [currentStageIndex, table, addTableAttribute]);

    const sorted = [...table.tableAttributes].sort((a, b) => a.order - b.order);

    const isRelSourceNode = pendingRelationshipSourceTableId === table.id;
    const isPickMode = Boolean(pendingRelationshipSourceTableId);

    return (
        <div
            className={`table-node${isDragOver ? ' table-node--drop-target' : ''}${isRelSourceNode ? ' table-node--rel-source' : ''}${isPickMode && !isRelSourceNode ? ' table-node--rel-target' : ''}`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Relationship handles — invisible, left and right sides only */}
            <Handle type="source" position={Position.Left}  id="src-left"  className="table-node__handle" />
            <Handle type="target" position={Position.Left}  id="tgt-left"  className="table-node__handle" />
            <Handle type="source" position={Position.Right} id="src-right" className="table-node__handle" />
            <Handle type="target" position={Position.Right} id="tgt-right" className="table-node__handle" />

            <div
                className="table-node__header"
                style={{ borderLeftColor: table.color }}
                onClick={handleHeaderClick}
                onContextMenu={handleContextMenu}
            >
                <span className="table-node__name">{table.name}</span>
                {(analysis?.tableHeaderIssues?.get(table.id) ?? []).map((issue, i) => (
                    <span
                        key={i}
                        className={`table-node__issue table-node__issue--${issue.type}`}
                        title={issue.message}
                    >
                        {issue.type === 'error' ? '✕' : '!'}
                    </span>
                ))}
            </div>

            <div className="table-node__body">
                {sorted.map((ta) => {
                    const attr = attrMap.get(ta.attributeId);
                    if (!attr) return null;
                    const displayName = ta.alias ?? attr.name;
                    const isHovered = hoveredAttrId === ta.attributeId;
                    const leftVisible = showFDs && (isHovered || leftAttrIds.has(ta.attributeId) || isConnecting);
                    const rightVisible = showFDs && (isHovered || rightAttrIds.has(ta.attributeId) || isConnecting);
                    const isRowSelected =
                        selectedTableAttribute?.tableId === table.id &&
                        selectedTableAttribute?.tableAttributeId === ta.id;
                    const isStaged = stagedAttrIds.has(ta.id);
                    return (
                        <div
                            key={ta.id}
                            className={`table-node__row${ta.is_PK ? ' table-node__row--pk' : ''}${isRowSelected ? ' table-node__row--selected' : ''}${isStaged ? ' table-node__row--staged' : ''}`}
                            onClick={(e) => handleRowClick(e, ta.id)}
                            onContextMenu={(e) => handleRowContextMenu(e, ta.id)}
                            onMouseEnter={() => setHoveredAttrId(ta.attributeId)}
                            onMouseLeave={() => setHoveredAttrId(null)}
                        >
                            <Handle
                                type="source"
                                position={Position.Left}
                                id={`fd-left-${ta.attributeId}`}
                                className={`table-node__fd-handle${leftVisible ? ' table-node__fd-handle--visible' : ''}`}
                                isConnectable={showFDs && currentStageIndex > 0}
                                style={{ left: 0, top: '50%', transform: 'translateY(-50%)' }}
                            />
                            <Handle
                                type="source"
                                position={Position.Right}
                                id={`fd-right-${ta.attributeId}`}
                                className={`table-node__fd-handle table-node__fd-handle--right${rightVisible ? ' table-node__fd-handle--visible' : ''}`}
                                isConnectable={showFDs && currentStageIndex > 0}
                                style={{ right: 0, left: 'auto', top: '50%', transform: 'translateY(-50%)' }}
                            />
                            <div className="table-node__key-col">
                                {ta.is_PK && <span className="table-node__badge table-node__badge--pk">PK</span>}
                                {ta.is_FK && !ta.is_PK && <span className="table-node__badge table-node__badge--fk">FK</span>}
                            </div>
                            <span className="table-node__attr-name">{displayName}</span>
                            <span className="table-node__attr-type">{attr.data_type}</span>
                            {(() => {
                                const issues = analysis?.attrRowIssues?.get(ta.attributeId) ?? [];
                                if (!issues.length) return null;
                                return (
                                    <span
                                        className="table-node__issue table-node__issue--warning"
                                        title={issues.map((iss) => iss.message).join('\n')}
                                    >!</span>
                                );
                            })()}
                        </div>
                    );
                })}
            </div>

            {contextMenu && (
                <TableContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    hasPK={hasPK}
                    onAddRelationship={() => startRelationshipCreation(table.id)}
                    onDelete={handleDelete}
                    onClose={() => setContextMenu(null)}
                />
            )}
            {attrContextMenu && (() => {
                const ta = table.tableAttributes.find((a) => a.id === attrContextMenu.tableAttributeId);
                const attr = ta ? attrMap.get(ta.attributeId) : null;
                const merged = new Set(stagedAttrIds);
                if (selectedTableAttribute?.tableId === table.id) {
                    merged.add(selectedTableAttribute.tableAttributeId);
                }
                const useStaged = merged.size >= 2;
                const createIds = useStaged ? [...merged] : [attrContextMenu.tableAttributeId];
                return (
                    <AttributeRowContextMenu
                        x={attrContextMenu.x}
                        y={attrContextMenu.y}
                        attrName={attr?.name ?? ''}
                        stagedCount={useStaged ? merged.size : 1}
                        onCreateTableWithPK={() => handleCreateTableWithPK(createIds)}
                        onRemove={() => removeTableAttribute(currentStageIndex, table.id, attrContextMenu.tableAttributeId)}
                        onClose={() => setAttrContextMenu(null)}
                    />
                );
            })()}
            {deleteConfirmFDs && (
                <DeleteTableModal
                    tableName={table.name}
                    fds={deleteConfirmFDs}
                    attrMap={attrMap}
                    onSave={handleSaveDelete}
                    onDeleteAll={handleDeleteAll}
                    onCancel={() => setDeleteConfirmFDs(null)}
                />
            )}
            {createTableFromAttrInfo && (
                <CreateTableFromAttrModal
                    attrNames={createTableFromAttrInfo.attrNames}
                    sourceTableName={table.name}
                    onConfirm={handleCreateTableFromAttrConfirm}
                    onClose={() => setCreateTableFromAttrInfo(null)}
                />
            )}
        </div>
    );
};

// Re-render only when the table data reference changes.
// React Flow also passes xPos/yPos/dragging/selected — those don't affect
// this component's output (React Flow applies position via its own wrapper).
export default memo(TableNode, (prev, next) => prev.data.table === next.data.table);

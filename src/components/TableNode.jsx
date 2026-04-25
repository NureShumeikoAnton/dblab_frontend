import { memo, useCallback, useMemo, useState } from 'react';
import { Handle, Position, useStore } from '@xyflow/react';
import useEditorStore from '../store/editorStore.js';
import TableContextMenu from './TableContextMenu.jsx';
import './styles/TableNode.css';

const TableNode = ({ data }) => {
    const { table } = data;
    const attributePool = useEditorStore((s) => s.attributePool);
    const currentStageIndex = useEditorStore((s) => s.currentStageIndex);
    const fds = useEditorStore((s) => s.stages[currentStageIndex]?.fds ?? []);
    const showFDs = useEditorStore((s) => s.ui.showFDs);
    const deleteTable = useEditorStore((s) => s.deleteTable);

    const [contextMenu, setContextMenu] = useState(null); // { x, y } | null
    const [hoveredAttrId, setHoveredAttrId] = useState(null);

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

    const handleContextMenu = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY });
    }, []);

    const handleDelete = useCallback(() => {
        deleteTable(currentStageIndex, table.id);
    }, [currentStageIndex, table.id, deleteTable]);

    const sorted = [...table.tableAttributes].sort((a, b) => a.order - b.order);

    return (
        <div className="table-node">
            {/* Relationship handles — invisible, left and right sides only */}
            <Handle type="source" position={Position.Left}  id="src-left"  className="table-node__handle" />
            <Handle type="target" position={Position.Left}  id="tgt-left"  className="table-node__handle" />
            <Handle type="source" position={Position.Right} id="src-right" className="table-node__handle" />
            <Handle type="target" position={Position.Right} id="tgt-right" className="table-node__handle" />

            <div
                className="table-node__header"
                style={{ borderLeftColor: table.color }}
                onContextMenu={handleContextMenu}
            >
                <span className="table-node__name">{table.name}</span>
            </div>

            <div className="table-node__body">
                {sorted.map((ta) => {
                    const attr = attrMap.get(ta.attributeId);
                    if (!attr) return null;
                    const displayName = ta.alias ?? attr.name;
                    const isHovered = hoveredAttrId === ta.attributeId;
                    const leftVisible = showFDs && (isHovered || leftAttrIds.has(ta.attributeId) || isConnecting);
                    const rightVisible = showFDs && (isHovered || rightAttrIds.has(ta.attributeId) || isConnecting);
                    return (
                        <div
                            key={ta.id}
                            className={`table-node__row${ta.is_PK ? ' table-node__row--pk' : ''}`}
                            onMouseEnter={() => setHoveredAttrId(ta.attributeId)}
                            onMouseLeave={() => setHoveredAttrId(null)}
                        >
                            <Handle
                                type="source"
                                position={Position.Left}
                                id={`fd-left-${ta.attributeId}`}
                                className={`table-node__fd-handle${leftVisible ? ' table-node__fd-handle--visible' : ''}`}
                                isConnectable={showFDs}
                                style={{ left: 0, top: '50%', transform: 'translateY(-50%)' }}
                            />
                            <Handle
                                type="source"
                                position={Position.Right}
                                id={`fd-right-${ta.attributeId}`}
                                className={`table-node__fd-handle table-node__fd-handle--right${rightVisible ? ' table-node__fd-handle--visible' : ''}`}
                                isConnectable={showFDs}
                                style={{ right: 0, left: 'auto', top: '50%', transform: 'translateY(-50%)' }}
                            />
                            <div className="table-node__key-col">
                                {ta.is_PK && <span className="table-node__badge table-node__badge--pk">PK</span>}
                                {ta.is_FK && !ta.is_PK && <span className="table-node__badge table-node__badge--fk">FK</span>}
                            </div>
                            <span className="table-node__attr-name">{displayName}</span>
                            <span className="table-node__attr-type">{attr.data_type}</span>
                        </div>
                    );
                })}
            </div>

            {contextMenu && (
                <TableContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onDelete={handleDelete}
                    onClose={() => setContextMenu(null)}
                />
            )}
        </div>
    );
};

// Re-render only when the table data reference changes.
// React Flow also passes xPos/yPos/dragging/selected — those don't affect
// this component's output (React Flow applies position via its own wrapper).
export default memo(TableNode, (prev, next) => prev.data.table === next.data.table);

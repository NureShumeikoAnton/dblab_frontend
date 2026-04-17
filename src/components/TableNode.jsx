import { useMemo, useState } from 'react';
import { Handle, Position, useStore } from '@xyflow/react';
import useEditorStore from '../store/editorStore.js';
import './styles/TableNode.css';

const TableNode = ({ data }) => {
    const { table } = data;
    const attributePool = useEditorStore((s) => s.attributePool);
    const currentStageIndex = useEditorStore((s) => s.currentStageIndex);
    const fds = useEditorStore((s) => s.stages[currentStageIndex]?.fds ?? []);
    const showFDs = useEditorStore((s) => s.ui.showFDs);

    const attrMap = useMemo(
        () => new Map(attributePool.map((a) => [a.id, a])),
        [attributePool]
    );

    // Set of attributeIds that participate in any FD — keeps handle dot visible
    const participatingAttrIds = useMemo(() => {
        const set = new Set();
        fds.forEach((fd) => {
            fd.starts.forEach((s) => set.add(s.attributeId));
            fd.ends.forEach((e) => set.add(e.attributeId));
        });
        return set;
    }, [fds]);

    // Show all handles while the user is actively drawing a connection
    const isConnecting = useStore((s) => s.connection?.inProgress ?? false);
    const [hoveredAttrId, setHoveredAttrId] = useState(null);

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
            >
                <span className="table-node__name">{table.name}</span>
            </div>
            <div className="table-node__body">
                {sorted.map((ta) => {
                    const attr = attrMap.get(ta.attributeId);
                    if (!attr) return null;
                    const displayName = ta.alias ?? attr.name;
                    const fdHandleVisible = showFDs && (
                        hoveredAttrId === ta.attributeId ||
                        participatingAttrIds.has(ta.attributeId) ||
                        isConnecting
                    );
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
                                className={`table-node__fd-handle${fdHandleVisible ? ' table-node__fd-handle--visible' : ''}`}
                                isConnectable={showFDs}
                                style={{ left: 0, top: '50%', transform: 'translateY(-50%)' }}
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
        </div>
    );
};

export default TableNode;

import { useCallback, useMemo, useState, useEffect } from 'react';
import { ReactFlow, Background, Controls, applyNodeChanges } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import useEditorStore from '../store/editorStore.js';
import TableNode from './TableNode.jsx';
import RelationshipEdge from './RelationshipEdge.jsx';
import './styles/EditorCanvas.css';

// nodeTypes must be defined at module level — defining inside the component
// causes React Flow to remount all nodes on every render.
const nodeTypes = {
    tableNode: TableNode,
};

// edgeTypes must be defined at module level — same reason as nodeTypes.
const edgeTypes = {
    relationshipEdge: RelationshipEdge,
};

const EditorCanvas = () => {
    const currentStageIndex = useEditorStore((s) => s.currentStageIndex);
    const tables = useEditorStore((s) => s.stages[currentStageIndex]?.tables ?? []);
    const relationships = useEditorStore((s) => s.stages[currentStageIndex]?.relationships ?? []);
    const fds = useEditorStore((s) => s.stages[currentStageIndex]?.fds ?? []);
    const showFDs = useEditorStore((s) => s.ui.showFDs);
    const updateTablePosition = useEditorStore((s) => s.updateTablePosition);

    // activeNodeId tracks which node was last clicked or grabbed — keeps it on top via zIndex.
    const [activeNodeId, setActiveNodeId] = useState(null);

    const storeNodes = useMemo(
        () => tables.map((table) => ({
            id: table.id,
            type: 'tableNode',
            position: table.position,
            data: { table },
        })),
        [tables]
    );

    // localNodes bridges Zustand and React Flow's internal change system.
    // onNodesChange applies position deltas during drag; Zustand is only written on dragStop.
    const [localNodes, setLocalNodes] = useState(storeNodes);

    // Sync store → local on stage switch or table data change.
    // Preserves selected and zIndex so a drag-stop position write doesn't reset them.
    useEffect(() => {
        setLocalNodes((prev) => {
            const prevMap = new Map(prev.map((n) => [n.id, n]));
            return storeNodes.map((n) => ({
                ...n,
                selected: prevMap.get(n.id)?.selected ?? false,
                zIndex: prevMap.get(n.id)?.zIndex ?? 0,
            }));
        });
    }, [storeNodes]);

    // Separate effect so zIndex updates never overwrite RF's selected state.
    useEffect(() => {
        setLocalNodes((prev) =>
            prev.map((n) => ({ ...n, zIndex: n.id === activeNodeId ? 1 : 0 }))
        );
    }, [activeNodeId]);

    const onNodesChange = useCallback((changes) => {
        setLocalNodes((nds) => applyNodeChanges(changes, nds));
    }, []);

    // Edge types — relationshipEdge is registered at module level. fdEdge will be added in Phase 6.
    const edges = useMemo(() => {
        const relEdges = relationships.map((rel) => ({
            id: rel.id,
            type: 'relationshipEdge',
            source: rel.table1Id,
            target: rel.table2Id,
            sourceHandle: rel.ta1Id ? `right-${rel.ta1Id}` : null,
            targetHandle: rel.ta2Id ? `left-${rel.ta2Id}` : null,
            data: { relationship: rel },
        }));

        if (!showFDs) return relEdges;

        const fdEdges = fds.flatMap((fd) =>
            fd.starts.flatMap((start) =>
                fd.ends.map((end) => {
                    const sourceTable = tables.find((t) =>
                        t.tableAttributes.some((ta) => ta.attributeId === start.attributeId)
                    );
                    const targetTable = tables.find((t) =>
                        t.tableAttributes.some((ta) => ta.attributeId === end.attributeId)
                    );
                    if (!sourceTable || !targetTable) return null;
                    return {
                        id: `fd-${fd.id}-${start.id}-${end.id}`,
                        type: 'default',
                        source: sourceTable.id,
                        target: targetTable.id,
                    };
                })
            )
        ).filter(Boolean);

        return [...relEdges, ...fdEdges];
    }, [tables, relationships, fds, showFDs]);

    const handleNodeDragStop = useCallback((_event, node) => {
        updateTablePosition(currentStageIndex, node.id, node.position);
        setLocalNodes((prev) => prev.map((n) => ({ ...n, selected: false })));
    }, [currentStageIndex, updateTablePosition]);

    const handleNodeActivate = useCallback((_event, node) => {
        setActiveNodeId(node.id);
    }, []);

    return (
        <div className="editor-canvas">
            <ReactFlow
                nodes={localNodes}
                edges={edges}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                onNodesChange={onNodesChange}
                onNodeDragStart={handleNodeActivate}
                onNodeDragStop={handleNodeDragStop}
                onNodeClick={handleNodeActivate}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                minZoom={0.2}
                maxZoom={2}
                panOnScroll={false}
                zoomOnScroll={true}
                panOnDrag={true}
                deleteKeyCode={null}
                selectionKeyCode={null}
            >
                <Background variant="dots" gap={20} size={1} color="#d1d9e0" />
                <Controls showInteractive={false} />
            </ReactFlow>
        </div>
    );
};

export default EditorCanvas;

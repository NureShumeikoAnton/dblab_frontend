import { useCallback, useMemo, useState, useEffect } from 'react';
import { ReactFlow, Background, Controls, applyNodeChanges } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import useEditorStore from '../store/editorStore.js';
import TableNode from './TableNode.jsx';
import './styles/EditorCanvas.css';

// nodeTypes must be defined at module level — defining inside the component
// causes React Flow to remount all nodes on every render.
const nodeTypes = {
    tableNode: TableNode,
};

const EditorCanvas = () => {
    const currentStageIndex = useEditorStore((s) => s.currentStageIndex);

    // Extract raw arrays from the store — immer preserves referential equality
    // for unchanged data, so these selectors return stable references.
    // Calling store methods (reactFlowNodes/reactFlowEdges) directly as selectors
    // returns a new array on every call, causing an infinite render loop.
    const tables = useEditorStore((s) => s.stages[currentStageIndex]?.tables ?? []);
    const relationships = useEditorStore((s) => s.stages[currentStageIndex]?.relationships ?? []);
    const fds = useEditorStore((s) => s.stages[currentStageIndex]?.fds ?? []);
    const showFDs = useEditorStore((s) => s.ui.showFDs);
    const updateTablePosition = useEditorStore((s) => s.updateTablePosition);

    // activeNodeId tracks which node was clicked last — used to bring it to the front.
    const [activeNodeId, setActiveNodeId] = useState(null);

    const storeNodes = useMemo(
        () => tables.map((table) => ({
            id: table.id,
            type: 'tableNode',
            position: table.position,
            data: { table },
            draggable: true,
            zIndex: table.id === activeNodeId ? 1 : 0,
        })),
        [tables, activeNodeId]
    );

    // localNodes bridges Zustand state and React Flow's internal change system.
    // onNodesChange applies position deltas during drag so the node follows the cursor.
    // Zustand is only updated on dragStop — keeping the store free of high-frequency writes.
    const [localNodes, setLocalNodes] = useState(storeNodes);

    useEffect(() => {
        setLocalNodes(storeNodes);
    }, [storeNodes]);

    const onNodesChange = useCallback((changes) => {
        setLocalNodes((nds) => applyNodeChanges(changes, nds));
    }, []);

    // Edge types are normalized to 'default' — custom edge types
    // (relationshipEdge, fdEdge) are registered in Phase 5/6.
    const edges = useMemo(() => {
        const relEdges = relationships.map((rel) => ({
            id: rel.id,
            type: 'default',
            source: rel.table1Id,
            target: rel.table2Id,
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
    }, [currentStageIndex, updateTablePosition]);

    const handleNodeDragStart = useCallback((_event, node) => {
        setActiveNodeId(node.id);
    }, []);

    const handleNodeClick = useCallback((_event, node) => {
        setActiveNodeId(node.id);
    }, []);

    return (
        <div className="editor-canvas">
            <ReactFlow
                nodes={localNodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onNodeDragStart={handleNodeDragStart}
                onNodeDragStop={handleNodeDragStop}
                onNodeClick={handleNodeClick}
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

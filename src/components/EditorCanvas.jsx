import { useCallback, useMemo, useState, useEffect } from 'react';
import { ReactFlow, Background, Controls, applyNodeChanges } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import useEditorStore from '../store/editorStore.js';
import TableNode from './TableNode.jsx';
import RelationshipEdge from './RelationshipEdge.jsx';
import FDEdge from './FDEdge.jsx';
import './styles/EditorCanvas.css';

// nodeTypes / edgeTypes must be defined at module level — defining inside the
// component causes React Flow to remount all nodes/edges on every render.
const nodeTypes = {
    tableNode: TableNode,
};

const edgeTypes = {
    relationshipEdge: RelationshipEdge,
    fdEdge: FDEdge,
};

const FD_COLORS = ['#E74C3C', '#F39C12', '#27AE60', '#2980B9', '#9B59B6', '#16A085'];

const isFDHandle = (h) => h?.startsWith('fd-left-') || h?.startsWith('fd-right-');
const parseFDHandle = (h) => {
    if (h?.startsWith('fd-left-'))  return { attrId: h.slice('fd-left-'.length),  isRight: false };
    if (h?.startsWith('fd-right-')) return { attrId: h.slice('fd-right-'.length), isRight: true  };
    return null;
};

const EditorCanvas = () => {
    const currentStageIndex = useEditorStore((s) => s.currentStageIndex);
    const tables = useEditorStore((s) => s.stages[currentStageIndex]?.tables ?? []);
    const relationships = useEditorStore((s) => s.stages[currentStageIndex]?.relationships ?? []);
    const fds = useEditorStore((s) => s.stages[currentStageIndex]?.fds ?? []);
    const showFDs = useEditorStore((s) => s.ui.showFDs);
    const updateTablePosition = useEditorStore((s) => s.updateTablePosition);
    const addFD = useEditorStore((s) => s.addFD);

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

    const edges = useMemo(() => {
        const relEdges = relationships.map((rel) => ({
            id: rel.id,
            type: 'relationshipEdge',
            source: rel.table1Id,
            target: rel.table2Id,
            data: { relationship: rel },
        }));

        if (!showFDs) return relEdges;

        // One self-loop edge per FD — FDEdge draws the bracket using handle bounds
        const fdEdges = fds.flatMap((fd) => {
            const table = tables.find((t) =>
                t.tableAttributes.some((ta) =>
                    fd.starts.some((s) => s.attributeId === ta.attributeId)
                )
            );
            if (!table) return [];
            return [{
                id: `fd-${fd.id}`,
                type: 'fdEdge',
                source: table.id,
                target: table.id,
                data: { fd },
            }];
        });

        return [...relEdges, ...fdEdges];
    }, [tables, relationships, fds, showFDs]);

    const handleNodeDragStop = useCallback((_event, node) => {
        updateTablePosition(currentStageIndex, node.id, node.position);
    }, [currentStageIndex, updateTablePosition]);

    const handleNodeActivate = useCallback((_event, node) => {
        setActiveNodeId(node.id);
    }, []);

    // Only allow FD connections within the same table node, via fd-left-* or fd-right-* handles
    const isValidConnection = useCallback((connection) => (
        connection.source === connection.target
        && isFDHandle(connection.sourceHandle)
        && isFDHandle(connection.targetHandle)
    ), []);

    const handleConnect = useCallback((connection) => {
        if (connection.source !== connection.target) return;
        const src = parseFDHandle(connection.sourceHandle);
        const tgt = parseFDHandle(connection.targetHandle);
        if (!src || !tgt || src.attrId === tgt.attrId) return;

        addFD(currentStageIndex, {
            id: `fd-${crypto.randomUUID()}`,
            color: FD_COLORS[Math.floor(Math.random() * FD_COLORS.length)],
            level: src.isRight ? -1 : 1,
            type: 'full',
            starts: [{ id: `fds-${crypto.randomUUID()}`, attributeId: src.attrId }],
            ends:   [{ id: `fde-${crypto.randomUUID()}`, attributeId: tgt.attrId }],
        });
    }, [addFD, currentStageIndex]);

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
                connectionMode="loose"
                onConnect={handleConnect}
                isValidConnection={isValidConnection}
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

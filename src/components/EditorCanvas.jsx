import { useCallback, useMemo, useState, useEffect } from 'react';
import generateId from '../utils/generateId.js';
import {
    ReactFlow, ReactFlowProvider, Background, Controls,
    applyNodeChanges, ConnectionLineType, useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import useEditorStore from '../store/editorStore.js';
import { TABLE_COLORS } from './TableToolbar.jsx';
import TableNode from './TableNode.jsx';
import RelationshipEdge from './RelationshipEdge.jsx';
import FDEdge from './FDEdge.jsx';
import AddRelationshipModal from './AddRelationshipModal.jsx';
import { isFDHandle, connectFD } from '../utils/fdConnection.js';
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

// Inner component — lives inside ReactFlowProvider so useReactFlow() works.
const EditorCanvasFlow = () => {
    const { screenToFlowPosition } = useReactFlow();

    const currentStageIndex = useEditorStore((s) => s.currentStageIndex);
    const tables = useEditorStore((s) => s.stages[currentStageIndex]?.tables ?? []);
    const relationships = useEditorStore((s) => s.stages[currentStageIndex]?.relationships ?? []);
    const fds = useEditorStore((s) => s.stages[currentStageIndex]?.fds ?? []);
    const showFDs = useEditorStore((s) => s.ui.showFDs);
    const updateTablePosition = useEditorStore((s) => s.updateTablePosition);
    const addTable = useEditorStore((s) => s.addTable);
    const addFD = useEditorStore((s) => s.addFD);
    const updateFD = useEditorStore((s) => s.updateFD);
    const clearSelectedFD = useEditorStore((s) => s.clearSelectedFD);
    const clearSelectedTable = useEditorStore((s) => s.clearSelectedTable);
    const clearSelectedTableAttribute = useEditorStore((s) => s.clearSelectedTableAttribute);
    const clearSelectedRelationship = useEditorStore((s) => s.clearSelectedRelationship);
    const pendingRelationshipSourceTableId = useEditorStore((s) => s.ui.pendingRelationshipSourceTableId);
    const pendingRelationshipSetup = useEditorStore((s) => s.ui.pendingRelationshipSetup);
    const cancelRelationshipCreation = useEditorStore((s) => s.cancelRelationshipCreation);
    const clearRelationshipSetup = useEditorStore((s) => s.clearRelationshipSetup);
    const attributePool = useEditorStore((s) => s.attributePool);

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
            const table = fd.tableId
                ? tables.find((t) => t.id === fd.tableId)
                : tables.find((t) =>
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

    const handlePaneClick = useCallback(() => {
        clearSelectedFD();
        clearSelectedTable();
        clearSelectedTableAttribute();
        clearSelectedRelationship();
        cancelRelationshipCreation();
    }, [clearSelectedFD, clearSelectedTable, clearSelectedTableAttribute, clearSelectedRelationship, cancelRelationshipCreation]);

    // Only allow FD connections within the same table node, via fd-left-* or fd-right-* handles.
    // FD drawing is disabled on stage 0 (1NF).
    const isValidConnection = useCallback((connection) => (
        currentStageIndex > 0
        && connection.source === connection.target
        && isFDHandle(connection.sourceHandle)
        && isFDHandle(connection.targetHandle)
    ), [currentStageIndex]);

    const handleConnect = useCallback((connection) => {
        connectFD(connection, { fds, tables, currentStageIndex, addFD, updateFD });
    }, [addFD, updateFD, currentStageIndex, tables, fds]);

    // ─── Attribute panel → canvas drop ──────────────────────────────────────────

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();

        // TableNode stops propagation on drops over a node — this handler only
        // fires for drops on the empty canvas.
        const attrId = e.dataTransfer.getData('application/dblab-attribute');
        if (!attrId) return;

        const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });

        const nums = tables
            .map((t) => {
                const m = t.name.match(/^Table_(\d+)$/);
                return m ? parseInt(m[1], 10) : NaN;
            })
            .filter((n) => !isNaN(n));
        const nextNum = nums.length ? Math.max(...nums) + 1 : 1;
        const color = TABLE_COLORS[Math.floor(Math.random() * TABLE_COLORS.length)];

        addTable(currentStageIndex, {
            id: generateId(),
            name: `Table_${nextNum}`,
            color,
            position,
            tableAttributes: [{
                id: generateId(),
                attributeId: attrId,
                is_PK: true,
                is_FK: false,
                alias: null,
                order: 0,
            }],
        });
    }, [screenToFlowPosition, currentStageIndex, tables, addTable]);

    const sourceTable = pendingRelationshipSetup
        ? tables.find((t) => t.id === pendingRelationshipSetup.sourceTableId)
        : null;
    const targetTable = pendingRelationshipSetup
        ? tables.find((t) => t.id === pendingRelationshipSetup.targetTableId)
        : null;

    return (
        <>
            <ReactFlow
                nodes={localNodes}
                edges={edges}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                onNodesChange={onNodesChange}
                onNodeDragStart={handleNodeActivate}
                onNodeDragStop={handleNodeDragStop}
                connectionMode="loose"
                onConnect={handleConnect}
                isValidConnection={isValidConnection}
                connectionLineType={ConnectionLineType.Step}
                connectionLineStyle={{ stroke: '#94a3b8', strokeWidth: 1.5, strokeDasharray: '5 3' }}
                onPaneClick={handlePaneClick}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
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
            {pendingRelationshipSourceTableId && (
                <div className="editor-canvas__rel-banner">
                    <span>⬤ Натисніть на цільову таблицю для з'єднання</span>
                    <button
                        type="button"
                        className="editor-canvas__rel-banner-cancel"
                        onClick={cancelRelationshipCreation}
                    >
                        Скасувати
                    </button>
                </div>
            )}
            {pendingRelationshipSetup && sourceTable && targetTable && (
                <AddRelationshipModal
                    sourceTable={sourceTable}
                    targetTable={targetTable}
                    attributePool={attributePool}
                    stageIndex={currentStageIndex}
                    alreadyLinked={pendingRelationshipSetup.alreadyLinked ?? false}
                    onClose={clearRelationshipSetup}
                />
            )}
        </>
    );
};

const EditorCanvas = () => (
    <div className="editor-canvas">
        <ReactFlowProvider>
            <EditorCanvasFlow />
        </ReactFlowProvider>
    </div>
);

export default EditorCanvas;

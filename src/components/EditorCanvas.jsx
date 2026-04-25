import { useCallback, useMemo, useState, useEffect } from 'react';
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

const pickColor = (sideFDs) => {
    const used = new Set(sideFDs.map((fd) => fd.color));
    return FD_COLORS.find((c) => !used.has(c)) ?? FD_COLORS[0];
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

    const handlePaneClick = useCallback(() => {
        clearSelectedFD();
        clearSelectedTable();
        clearSelectedTableAttribute();
    }, [clearSelectedFD, clearSelectedTable, clearSelectedTableAttribute]);

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

        const tableNode = tables.find((t) => t.id === connection.source);
        if (!tableNode) return;

        const isRight = src.isRight;

        // FDs on this side that belong to this table
        const sideFDs = fds.filter((fd) => {
            if ((fd.level < 0) !== isRight) return false;
            return fd.starts.some((s) =>
                tableNode.tableAttributes.some((ta) => ta.attributeId === s.attributeId)
            );
        });

        // Most recent FD on this side where srcAttr is a start.
        // findLast ensures we target the newest open dependency when the same
        // attribute is a start in multiple FDs.
        const matchingFD = sideFDs.findLast((fd) =>
            fd.starts.some((s) => s.attributeId === src.attrId)
        );

        if (matchingFD) {
            // Guard against within-FD conflicts: duplicate end or circular (tgt is already a start)
            const alreadyInFD =
                matchingFD.ends.some((e) => e.attributeId === tgt.attrId) ||
                matchingFD.starts.some((s) => s.attributeId === tgt.attrId);
            if (alreadyInFD) return;

            // Extend — tgt may already be used in OTHER FDs; that's intentional
            updateFD(currentStageIndex, matchingFD.id, {
                ends: [...matchingFD.ends, { id: `fde-${crypto.randomUUID()}`, attributeId: tgt.attrId }],
            });
            return;
        }

        // No matchingFD on this side — check the opposite side.
        const srcOppFDs = fds.filter((fd) =>
            (fd.level < 0) !== isRight &&
            fd.starts.some((s) => s.attributeId === src.attrId)
        );

        if (srcOppFDs.length > 0) {
            // Flip all of srcAttr's opposite-side FDs to this side, then extend the last one.
            srcOppFDs.forEach((fd) => {
                updateFD(currentStageIndex, fd.id, { level: -fd.level });
            });
            const lastFlipped = srcOppFDs[srcOppFDs.length - 1];
            const alreadyInFD =
                lastFlipped.ends.some((e) => e.attributeId === tgt.attrId) ||
                lastFlipped.starts.some((s) => s.attributeId === tgt.attrId);
            if (!alreadyInFD) {
                updateFD(currentStageIndex, lastFlipped.id, {
                    ends: [...lastFlipped.ends, { id: `fde-${crypto.randomUUID()}`, attributeId: tgt.attrId }],
                });
            }
            return;
        }

        // srcAttr has no FDs on either side — create a new one.
        const usedLevels = sideFDs.map((fd) => Math.abs(fd.level));
        const nextLevel = (usedLevels.length ? Math.max(...usedLevels) : 0) + 1;
        addFD(currentStageIndex, {
            id: `fd-${crypto.randomUUID()}`,
            color: pickColor(sideFDs),
            level: isRight ? -nextLevel : nextLevel,
            type: 'full',
            starts: [{ id: `fds-${crypto.randomUUID()}`, attributeId: src.attrId }],
            ends:   [{ id: `fde-${crypto.randomUUID()}`, attributeId: tgt.attrId }],
        });
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
            id: crypto.randomUUID(),
            name: `Table_${nextNum}`,
            color,
            position,
            tableAttributes: [{
                id: crypto.randomUUID(),
                attributeId: attrId,
                is_PK: true,
                is_FK: false,
                alias: null,
                order: 0,
            }],
        });
    }, [screenToFlowPosition, currentStageIndex, tables, addTable]);

    return (
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

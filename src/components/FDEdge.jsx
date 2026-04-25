import { useCallback, useState } from 'react';
import { useInternalNode } from '@xyflow/react';
import useEditorStore from '../store/editorStore.js';
import FDContextMenu from './FDContextMenu.jsx';

const LANE_WIDTH = 18; // px per bracket lane
const ARROW_SIZE = 5;  // arrowhead half-height

/**
 * Custom React Flow edge — renders a bracket FD visual.
 *
 * One edge per FD (self-loop: source === target === tableId).
 * All geometry is derived from handle bounds via useInternalNode
 * so the bracket always aligns with attribute rows.
 *
 * level > 0 → bracket on the LEFT  (1 = nearest, 2 = next out…)
 * level < 0 → bracket on the RIGHT (−1 = nearest, −2 = next out…)
 *
 * Start attributes render plain horizontal stubs.
 * End attributes render stubs with arrowheads pointing at the table.
 */
const FDEdge = ({ source, data }) => {
    const node = useInternalNode(source);
    const selectFD = useEditorStore((s) => s.selectFD);
    const deleteFD = useEditorStore((s) => s.deleteFD);
    const currentStageIndex = useEditorStore((s) => s.currentStageIndex);
    const selectedFDId = useEditorStore((s) => s.ui.selectedFDId);
    const fdId = data?.fd?.id ?? null;

    const [ctxMenu, setCtxMenu] = useState(null); // { x, y } | null

    const handleClick = useCallback((e) => {
        e.stopPropagation();
        if (fdId) selectFD(fdId);
    }, [fdId, selectFD]);

    const handleContextMenu = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (fdId) selectFD(fdId);
        setCtxMenu({ x: e.clientX, y: e.clientY });
    }, [fdId, selectFD]);

    if (!node || !data?.fd) return null;

    const { fd } = data;
    const handleBounds = node?.internals?.handleBounds;
    // Source-type handles live in handleBounds.source
    const allHandles = [...(handleBounds?.source ?? [])];

    const posAbs = node.internals.positionAbsolute;
    const nodeW  = node.measured?.width ?? 200;

    const isLeft        = fd.level >= 0;
    const tableEdgeX    = isLeft ? posAbs.x : posAbs.x + nodeW;
    const laneX         = isLeft
        ? posAbs.x - Math.abs(fd.level) * LANE_WIDTH
        : posAbs.x + nodeW + Math.abs(fd.level) * LANE_WIDTH;
    const handleIdPrefix = isLeft ? 'fd-left-' : 'fd-right-';

    const getHandleY = (attributeId) => {
        const h = allHandles.find((h) => h.id === `${handleIdPrefix}${attributeId}`);
        return h !== undefined ? posAbs.y + h.y + h.height / 2 : null;
    };

    const startYs = fd.starts.map((s) => getHandleY(s.attributeId)).filter((y) => y !== null);
    const endYs   = fd.ends.map((e) => getHandleY(e.attributeId)).filter((y) => y !== null);

    // Orphaned FD — silently skip
    if (!startYs.length || !endYs.length) return null;

    const allYs   = [...startYs, ...endYs];
    const topY    = Math.min(...allYs);
    const bottomY = Math.max(...allYs);

    // Arrowhead pointing from laneX toward the table edge
    const arrowPath = (y) => isLeft
        ? `M ${tableEdgeX},${y} L ${tableEdgeX - ARROW_SIZE * 1.5},${y - ARROW_SIZE} L ${tableEdgeX - ARROW_SIZE * 1.5},${y + ARROW_SIZE} Z`
        : `M ${tableEdgeX},${y} L ${tableEdgeX + ARROW_SIZE * 1.5},${y - ARROW_SIZE} L ${tableEdgeX + ARROW_SIZE * 1.5},${y + ARROW_SIZE} Z`;

    const isSelected = selectedFDId === fd.id;
    const lp = { stroke: fd.color, strokeWidth: isSelected ? 2.5 : 1.5, opacity: 0.55 };
    // Wide transparent stroke used as a click/right-click hit area — thin lines are hard to interact with
    const hitProps = {
        stroke: 'transparent',
        strokeWidth: 12,
        style: { cursor: 'pointer', pointerEvents: 'stroke' },
        onClick: handleClick,
        onContextMenu: handleContextMenu,
    };

    return (
        <>
            <g>
                {/* Vertical spine */}
                <line x1={laneX} y1={topY} x2={laneX} y2={bottomY} {...lp} />
                <line x1={laneX} y1={topY} x2={laneX} y2={bottomY} {...hitProps} />

                {/* Start stubs — plain lines (determinant side) */}
                {startYs.map((y, i) => (
                    <g key={`s-${i}`}>
                        <line x1={tableEdgeX} y1={y} x2={laneX} y2={y} {...lp} />
                        <line x1={tableEdgeX} y1={y} x2={laneX} y2={y} {...hitProps} />
                    </g>
                ))}

                {/* End stubs — line + solid arrowhead (dependent side) */}
                {endYs.map((y, i) => (
                    <g key={`e-${i}`}>
                        <line x1={tableEdgeX} y1={y} x2={laneX} y2={y} {...lp} />
                        <line x1={tableEdgeX} y1={y} x2={laneX} y2={y} {...hitProps} />
                        <path d={arrowPath(y)} fill={fd.color} />
                    </g>
                ))}
            </g>
            {ctxMenu && (
                <FDContextMenu
                    x={ctxMenu.x}
                    y={ctxMenu.y}
                    onDelete={() => deleteFD(currentStageIndex, fdId)}
                    onClose={() => setCtxMenu(null)}
                />
            )}
        </>
    );
};

export default FDEdge;

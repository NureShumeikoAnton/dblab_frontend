import { useInternalNode } from '@xyflow/react';

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
    if (!node || !data?.fd) return null;

    const { fd } = data;
    const handleBounds = node?.internals?.handleBounds;
    // Source-type handles live in handleBounds.source
    const allHandles = [...(handleBounds?.source ?? [])];

    const posAbs = node.internals.positionAbsolute;
    const nodeW  = node.measured?.width ?? 200;

    const getHandleY = (attributeId) => {
        const h = allHandles.find((h) => h.id === `fd-left-${attributeId}`);
        return h !== undefined ? posAbs.y + h.y + h.height / 2 : null;
    };

    const startYs = fd.starts.map((s) => getHandleY(s.attributeId)).filter((y) => y !== null);
    const endYs   = fd.ends.map((e) => getHandleY(e.attributeId)).filter((y) => y !== null);

    // Orphaned FD — silently skip
    if (!startYs.length || !endYs.length) return null;

    const allYs   = [...startYs, ...endYs];
    const topY    = Math.min(...allYs);
    const bottomY = Math.max(...allYs);

    const isLeft     = fd.level >= 0;
    const tableEdgeX = isLeft ? posAbs.x : posAbs.x + nodeW;
    const laneX      = isLeft
        ? posAbs.x - Math.abs(fd.level) * LANE_WIDTH
        : posAbs.x + nodeW + Math.abs(fd.level) * LANE_WIDTH;

    // Arrowhead pointing from laneX toward the table edge
    const arrowPath = (y) => isLeft
        ? `M ${tableEdgeX},${y} L ${tableEdgeX - ARROW_SIZE * 1.5},${y - ARROW_SIZE} L ${tableEdgeX - ARROW_SIZE * 1.5},${y + ARROW_SIZE} Z`
        : `M ${tableEdgeX},${y} L ${tableEdgeX + ARROW_SIZE * 1.5},${y - ARROW_SIZE} L ${tableEdgeX + ARROW_SIZE * 1.5},${y + ARROW_SIZE} Z`;

    const lp = { stroke: fd.color, strokeWidth: 1.5 };

    return (
        <g>
            {/* Vertical spine connecting all stubs */}
            <line x1={laneX} y1={topY} x2={laneX} y2={bottomY} {...lp} />
            {/* Start stubs — plain lines (determinant side) */}
            {startYs.map((y, i) => (
                <line key={`s-${i}`} x1={tableEdgeX} y1={y} x2={laneX} y2={y} {...lp} />
            ))}
            {/* End stubs — line + arrowhead (dependent side) */}
            {endYs.map((y, i) => (
                <g key={`e-${i}`}>
                    <line x1={tableEdgeX} y1={y} x2={laneX} y2={y} {...lp} />
                    <path d={arrowPath(y)} fill={fd.color} />
                </g>
            ))}
        </g>
    );
};

export default FDEdge;

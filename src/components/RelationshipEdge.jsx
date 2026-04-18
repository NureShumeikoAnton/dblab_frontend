import { getSmoothStepPath, Position, useInternalNode } from '@xyflow/react';
import { computeRelationshipHandles } from '../utils/edgeHandles.js';

// Geometry constants (pixels from the handle connection point)
const NEAR     = 8;   // optionality symbol offset
const FAR      = 16;  // cardinality symbol offset
const LEG      = 8;   // crow's foot leg length past the pivot
const TICK_H   = 8;   // half-height of a tick mark
const SPREAD   = 9;   // crow's foot vertical spread (±px)
const CIRCLE_R = 4;   // optional-zero circle radius

// Minimum straight segment near each handle so crow's foot symbols fit
// before the first orthogonal bend.
const EDGE_OFFSET = FAR + LEG + 6;

/**
 * Draws IE crow's foot notation symbols at one end of an edge.
 *
 * `facing` is the Position of the handle (Left or Right).
 * Symbols extend away from the table into the edge space.
 *
 * Cardinality → symbols (reading from table outward):
 *   '1'    → mandatory tick  + one tick
 *   '0..1' → optional circle + one tick
 *   '1..*' → mandatory tick  + crow's foot
 *   '0..*' → optional circle + crow's foot
 */
const CrowsFoot = ({ cx, cy, facing, cardinality, color }) => {
    // d: +1 = symbols extend right (Right handle), −1 = extend left (Left handle)
    const d = facing === Position.Right ? 1 : -1;

    const nearX = cx + d * NEAR;
    const farX  = cx + d * FAR;
    const legX  = cx + d * (FAR + LEG);

    const lp = { stroke: color, strokeWidth: 1.5, fill: 'none' };

    const nearEl = (cardinality === '0..*' || cardinality === '0..1')
        ? <circle cx={nearX} cy={cy} r={CIRCLE_R} stroke={color} strokeWidth={1.5} fill="#fff" />
        : <line x1={nearX} y1={cy - TICK_H} x2={nearX} y2={cy + TICK_H} {...lp} />;

    const farEl = (cardinality === '1..*' || cardinality === '0..*')
        ? (
            <>
                <line x1={farX} y1={cy}         x2={legX} y2={cy}          {...lp} />
                <line x1={farX} y1={cy}         x2={legX} y2={cy - SPREAD} {...lp} />
                <line x1={farX} y1={cy}         x2={legX} y2={cy + SPREAD} {...lp} />
            </>
          )
        : <line x1={farX} y1={cy - TICK_H} x2={farX} y2={cy + TICK_H} {...lp} />;

    return <>{nearEl}{farEl}</>;
};

/**
 * Custom React Flow edge — orthogonal step routing with IE crow's foot markers.
 *
 * Handle sides are post-calculated from node positions using computeRelationshipHandles
 * so edges always route sensibly regardless of table layout.
 */
const RelationshipEdge = ({ id, source, target, data }) => {
    const sourceNode = useInternalNode(source);
    const targetNode = useInternalNode(target);

    if (!sourceNode || !targetNode) return null;

    const { relationship } = data ?? {};
    const color = relationship?.color ?? '#64748b';
    const c1    = relationship?.cardinality_t1 ?? '1';
    const c2    = relationship?.cardinality_t2 ?? '1';

    const { srcX, srcY, srcPos, tgtX, tgtY, tgtPos } =
        computeRelationshipHandles(sourceNode, targetNode, 2 * EDGE_OFFSET);

    const [edgePath] = getSmoothStepPath({
        sourceX: srcX, sourceY: srcY, sourcePosition: srcPos,
        targetX: tgtX, targetY: tgtY, targetPosition: tgtPos,
        borderRadius: 0,
        offset: EDGE_OFFSET,
    });

    return (
        <g>
            {/* Wide transparent hit area — makes the edge easier to click (Phase 13) */}
            <path id={id} d={edgePath} fill="none" stroke="transparent" strokeWidth={12} />
            {/* Visible colored line */}
            <path d={edgePath} fill="none" stroke={color} strokeWidth={1.5} />
            {/* Crow's foot markers */}
            <CrowsFoot cx={srcX} cy={srcY} facing={srcPos} cardinality={c1} color={color} />
            <CrowsFoot cx={tgtX} cy={tgtY} facing={tgtPos} cardinality={c2} color={color} />
        </g>
    );
};

export default RelationshipEdge;

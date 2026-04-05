import { getSmoothStepPath, Position } from '@xyflow/react';
import './styles/RelationshipEdge.css';

/**
 * Draws crow's foot cardinality markers at one end of an edge.
 * @param {number} x           - Handle X (sourceX or targetX)
 * @param {number} y           - Handle Y (sourceY or targetY)
 * @param {'right'|'left'} side - Which side of the table the handle is on
 * @param {string} cardinality  - '1' | '0..1' | '1..*' | '0..*'
 * @param {string} color
 */
function CardinalityMarker({ x, y, side, cardinality, color }) {
    // d: +1 draws markers extending rightward (away from a right-side handle into open space)
    //    -1 draws markers extending leftward (away from a left-side handle into open space)
    const d = side === 'right' ? 1 : -1;

    const bar1X = x + d * 6;    // first vertical bar
    const bar2X = x + d * 13;   // second vertical bar (used by '1' and '1..*')
    const footX = x + d * 16;   // tip of crow's foot spread lines
    const circleX = x + d * 20; // center of circle (for 0-based cardinalities)

    const sw = 2;      // stroke width for bars/lines
    const halfH = 8;   // half-height of vertical bars
    const spread = 8;  // vertical spread of crow's foot tips

    const sharedProps = { stroke: color, strokeWidth: sw, strokeLinecap: 'butt' };

    switch (cardinality) {
        case '1':
            // Two parallel vertical bars (mandatory one)
            return (
                <g>
                    <line x1={bar1X} y1={y - halfH} x2={bar1X} y2={y + halfH} {...sharedProps} />
                    <line x1={bar2X} y1={y - halfH} x2={bar2X} y2={y + halfH} {...sharedProps} />
                </g>
            );

        case '0..1':
            // Circle + one vertical bar (zero or one)
            return (
                <g>
                    <circle cx={circleX} cy={y} r={4} fill="white" stroke={color} strokeWidth={sw} />
                    <line x1={bar1X} y1={y - halfH} x2={bar1X} y2={y + halfH} {...sharedProps} />
                </g>
            );

        case '1..*':
            // One bar + crow's foot lines (one or many)
            return (
                <g>
                    <line x1={bar1X} y1={y - halfH} x2={bar1X} y2={y + halfH} {...sharedProps} />
                    <line x1={bar2X} y1={y} x2={footX} y2={y - spread} {...sharedProps} />
                    <line x1={bar2X} y1={y} x2={footX} y2={y + spread} {...sharedProps} />
                    <line x1={bar2X} y1={y} x2={footX} y2={y} {...sharedProps} />
                </g>
            );

        case '0..*':
            // Circle + crow's foot lines (zero or many)
            return (
                <g>
                    <circle cx={circleX} cy={y} r={4} fill="white" stroke={color} strokeWidth={sw} />
                    <line x1={bar1X} y1={y} x2={footX} y2={y - spread} {...sharedProps} />
                    <line x1={bar1X} y1={y} x2={footX} y2={y + spread} {...sharedProps} />
                    <line x1={bar1X} y1={y} x2={footX} y2={y} {...sharedProps} />
                </g>
            );

        default:
            return null;
    }
}

const RelationshipEdge = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
}) => {
    const { relationship } = data;
    const {
        color = '#9B59B6',
        type: relType = 'non-identifying',
        cardinality_t1 = '1',
        cardinality_t2 = '0..*',
    } = relationship;

    const isDashed = relType === 'non-identifying';

    const [edgePath] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        borderRadius: 0,
        offset: 30,
    });

    // Source position is Position.Right → side 'right' (markers extend right, away from table)
    // Target position is Position.Left → side 'left' (markers extend left, away from table)
    const positionSide = {
        [Position.Right]: 'right',
        [Position.Left]: 'left',
        [Position.Top]: 'right',
        [Position.Bottom]: 'left',
    };
    const sourceSide = positionSide[sourcePosition] ?? 'right';
    const targetSide = positionSide[targetPosition] ?? 'left';

    return (
        <>
            <path
                id={id}
                className={`relationship-edge__path${isDashed ? ' relationship-edge__path--dashed' : ''}`}
                d={edgePath}
                stroke={color}
                strokeWidth={2.5}
            />
            <CardinalityMarker
                x={sourceX}
                y={sourceY}
                side={sourceSide}
                cardinality={cardinality_t1}
                color={color}
            />
            <CardinalityMarker
                x={targetX}
                y={targetY}
                side={targetSide}
                cardinality={cardinality_t2}
                color={color}
            />
        </>
    );
};

export default RelationshipEdge;

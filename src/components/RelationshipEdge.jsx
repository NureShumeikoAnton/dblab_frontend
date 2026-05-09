import { useCallback } from 'react';
import { getSmoothStepPath, Position, useInternalNode } from '@xyflow/react';
import useEditorStore from '../store/editorStore.js';
import { computeRelationshipHandles } from '../utils/edgeHandles.js';

// Geometry constants (pixels from the handle connection point)
const NEAR     = 8;
const FAR      = 16;
const LEG      = 8;
const TICK_H   = 8;
const SPREAD   = 9;
const CIRCLE_R = 4;
const EDGE_OFFSET = FAR + LEG + 6;

/**
 * Draws IE crow's foot notation symbols at one end of an edge.
 * facing is the Position of the handle (Left or Right).
 */
const CrowsFoot = ({ cx, cy, facing, cardinality, color }) => {
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
 * Look up the absolute Y-center of a handle on an internal node.
 * Returns null if the handle cannot be found.
 */
const getHandleAbsY = (node, handleId) => {
    const allHandles = [
        ...(node?.internals?.handleBounds?.source ?? []),
        ...(node?.internals?.handleBounds?.target ?? []),
    ];
    const h = allHandles.find((h) => h.id === handleId);
    if (!h) return null;
    return node.internals.positionAbsolute.y + h.y + h.height / 2;
};

/**
 * Custom React Flow edge — orthogonal step routing with IE crow's foot markers.
 * Attaches at the PK attribute row of the source table and the FK attribute row
 * of the target table when those attributes can be identified; falls back to
 * node-centre Y when they cannot.
 */
const RelationshipEdge = ({ id, source, target, data }) => {
    const sourceNode = useInternalNode(source);
    const targetNode = useInternalNode(target);

    const currentStageIndex = useEditorStore((s) => s.currentStageIndex);
    const tables = useEditorStore((s) => s.stages[currentStageIndex]?.tables ?? []);
    const selectedRelationshipId = useEditorStore((s) => s.ui.selectedRelationshipId);
    const selectRelationship = useEditorStore((s) => s.selectRelationship);

    const { relationship } = data ?? {};
    const relId   = relationship?.id ?? null;
    const color   = relationship?.color ?? '#64748b';
    const c1      = relationship?.cardinality_t1 ?? '1';
    const c2      = relationship?.cardinality_t2 ?? '1';
    const isSelected = selectedRelationshipId === relId;

    const handleClick = useCallback((e) => {
        e.stopPropagation();
        if (relId) selectRelationship(relId);
    }, [relId, selectRelationship]);

    if (!sourceNode || !targetNode || !relationship) return null;

    // Compute which node sides to use for routing
    const { srcX, srcY: srcYCenter, srcPos, tgtX, tgtY: tgtYCenter, tgtPos } =
        computeRelationshipHandles(sourceNode, targetNode, 2 * EDGE_OFFSET);

    // Find the attribute-level Y positions for PK (source) and FK (target)
    const sourceTable = tables.find((t) => t.id === relationship.table1Id);
    const targetTable = tables.find((t) => t.id === relationship.table2Id);

    // Use the first PK attribute from the source table
    const pkTA = sourceTable?.tableAttributes.find((ta) => ta.is_PK);
    const pkAttrId = pkTA?.attributeId ?? null;

    // Find the FK attribute in target that references the same attribute
    const fkTA = pkAttrId
        ? targetTable?.tableAttributes.find((ta) => ta.is_FK && ta.attributeId === pkAttrId)
        : null;
    const fkAttrId = fkTA?.attributeId ?? null;

    // Look up handle Y using the side determined by computeRelationshipHandles
    const srcHandlePrefix = srcPos === Position.Right ? 'fd-right-' : 'fd-left-';
    const tgtHandlePrefix = tgtPos === Position.Right ? 'fd-right-' : 'fd-left-';

    const srcY = (pkAttrId
        ? getHandleAbsY(sourceNode, `${srcHandlePrefix}${pkAttrId}`)
        : null) ?? srcYCenter;

    const tgtY = (fkAttrId
        ? getHandleAbsY(targetNode, `${tgtHandlePrefix}${fkAttrId}`)
        : null) ?? tgtYCenter;

    const [edgePath] = getSmoothStepPath({
        sourceX: srcX, sourceY: srcY, sourcePosition: srcPos,
        targetX: tgtX, targetY: tgtY, targetPosition: tgtPos,
        borderRadius: 0,
        offset: EDGE_OFFSET,
    });

    const strokeWidth = isSelected ? 2.5 : 1.5;
    const strokeColor = isSelected ? '#3b82f6' : color;

    return (
        <g>
            {/* Wide transparent hit area */}
            <path
                id={id}
                d={edgePath}
                fill="none"
                stroke="transparent"
                strokeWidth={12}
                onClick={handleClick}
                style={{ cursor: 'pointer' }}
            />
            {/* Visible colored line */}
            <path
                d={edgePath}
                fill="none"
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                pointerEvents="none"
            />
            <CrowsFoot cx={srcX} cy={srcY} facing={srcPos} cardinality={c1} color={strokeColor} />
            <CrowsFoot cx={tgtX} cy={tgtY} facing={tgtPos} cardinality={c2} color={strokeColor} />
        </g>
    );
};

export default RelationshipEdge;

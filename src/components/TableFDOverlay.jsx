import { useInternalNode, useStore } from '@xyflow/react';
import useEditorStore from '../store/editorStore.js';

const CIRCLE_R = 3.5;

/**
 * Invisible React Flow self-loop edge that renders the visual FD handle dots
 * in the SVG layer — outside the node's overflow-y:auto clipping boundary.
 *
 * One overlay edge per table node (always present when showFDs is true).
 * Circles appear for attributes that are:
 *   - hovered by the user
 *   - participating in any FD on this stage
 *   - all attributes when a connection drag is in progress
 */
const TableFDOverlay = ({ source }) => {
    const node = useInternalNode(source);
    const currentStageIndex = useEditorStore((s) => s.currentStageIndex);
    const tables = useEditorStore((s) => s.stages[currentStageIndex]?.tables ?? []);
    const fds = useEditorStore((s) => s.stages[currentStageIndex]?.fds ?? []);
    const hoveredTableAttr = useEditorStore((s) => s.ui.hoveredTableAttr);
    const showFDs = useEditorStore((s) => s.ui.showFDs);
    const isConnecting = useStore((s) => s.connection?.inProgress ?? false);

    if (!node || !showFDs) return null;

    const table = tables.find((t) => t.id === source);
    if (!table) return null;

    const handleBounds = node?.internals?.handleBounds;
    const allHandles = [...(handleBounds?.source ?? [])];
    const posAbs = node.internals.positionAbsolute;
    const cx = posAbs.x; // circles centered on the node's left outer edge

    // Build set of attributeIds participating in any FD on this stage
    const participatingIds = new Set();
    fds.forEach((fd) => {
        fd.starts.forEach((s) => participatingIds.add(s.attributeId));
        fd.ends.forEach((e) => participatingIds.add(e.attributeId));
    });

    const circles = table.tableAttributes.flatMap((ta) => {
        const isHovered =
            hoveredTableAttr?.tableId === source &&
            hoveredTableAttr?.attributeId === ta.attributeId;
        const participates = participatingIds.has(ta.attributeId);

        if (!isHovered && !participates && !isConnecting) return [];

        const h = allHandles.find((h) => h.id === `fd-left-${ta.attributeId}`);
        if (!h) return [];

        const cy = posAbs.y + h.y + h.height / 2;
        return [{ key: ta.attributeId, cy }];
    });

    if (!circles.length) return null;

    return (
        <g>
            {circles.map(({ key, cy }) => (
                <circle
                    key={key}
                    cx={cx}
                    cy={cy}
                    r={CIRCLE_R}
                    fill="#64748b"
                    stroke="#fff"
                    strokeWidth={1.5}
                />
            ))}
        </g>
    );
};

export default TableFDOverlay;

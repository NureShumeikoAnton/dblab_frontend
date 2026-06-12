import { Position } from '@xyflow/react';

/**
 * Determines the optimal handle side and connection coordinates for a
 * relationship edge between two table nodes based on their horizontal overlap.
 *
 * Rules (SL/SR = source left/right edge, EL/ER = target left/right edge):
 *   1. SR <= EL  AND gap >= minGap  →  source RIGHT  to  target LEFT   (no overlap, source is left)
 *   2. ER <= SL  AND gap >= minGap  →  source LEFT   to  target RIGHT  (no overlap, target is left)
 *   3. SL <= EL  →  source LEFT   to  target LEFT   (overlap, source starts leftmost)
 *   4. else      →  source RIGHT  to  target RIGHT  (overlap, target starts leftmost)
 *
 * Rules 1/2 fall through to 3/4 when the gap is too narrow to fit both
 * straight segments (crow's foot symbols need minGap pixels of clear space).
 *
 * Vertical attachment point is the vertical center of each node.
 *
 * @param {import('@xyflow/react').InternalNode} sourceNode
 * @param {import('@xyflow/react').InternalNode} targetNode
 * @param {number} minGap - minimum horizontal gap required for rules 1/2 to apply
 * @returns {{ srcX: number, srcY: number, srcPos: Position,
 *             tgtX: number, tgtY: number, tgtPos: Position }}
 */
export function computeRelationshipHandles(sourceNode, targetNode, minGap = 0) {
    const sw = sourceNode.measured?.width  ?? 200;
    const sh = sourceNode.measured?.height ?? 50;
    const tw = targetNode.measured?.width  ?? 200;
    const th = targetNode.measured?.height ?? 50;

    const SL = sourceNode.position.x;
    const SR = SL + sw;
    const SY = sourceNode.position.y + sh / 2;

    const EL = targetNode.position.x;
    const ER = EL + tw;
    const TY = targetNode.position.y + th / 2;

    let srcPos, tgtPos;

    if (SR <= EL && (EL - SR) >= minGap) {
        srcPos = Position.Right;
        tgtPos = Position.Left;
    } else if (ER <= SL && (SL - ER) >= minGap) {
        srcPos = Position.Left;
        tgtPos = Position.Right;
    } else if (SL <= EL) {
        srcPos = Position.Left;
        tgtPos = Position.Left;
    } else {
        srcPos = Position.Right;
        tgtPos = Position.Right;
    }

    const srcX = srcPos === Position.Right ? SR : SL;
    const tgtX = tgtPos === Position.Right ? ER : EL;

    return { srcX, srcY: SY, srcPos, tgtX, tgtY: TY, tgtPos };
}

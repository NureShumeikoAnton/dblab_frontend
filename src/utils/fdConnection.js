import generateId from './generateId.js';

export const FD_COLORS = ['#E74C3C', '#F39C12', '#27AE60', '#2980B9', '#9B59B6', '#16A085'];

export const isFDHandle = (h) => h?.startsWith('fd-left-') || h?.startsWith('fd-right-');

export const parseFDHandle = (h) => {
    if (h?.startsWith('fd-left-'))  return { attrId: h.slice('fd-left-'.length),  isRight: false };
    if (h?.startsWith('fd-right-')) return { attrId: h.slice('fd-right-'.length), isRight: true  };
    return null;
};

export const pickColor = (sideFDs) => {
    const used = new Set(sideFDs.map((fd) => fd.color));
    return FD_COLORS.find((c) => !used.has(c)) ?? FD_COLORS[0];
};

/**
 * Handles a React Flow onConnect event for FD bracket edges.
 *
 * Cases (in priority order):
 *   1. srcAttr is already a start in a same-side single-start FD → extend with tgtAttr as new end.
 *   1b. srcAttr is a start in a same-side composite FD and tgtAttr is already covered → create a new
 *       partial-dependency FD with srcAttr as the sole determinant.
 *   2. srcAttr has single-start FDs on the opposite side → flip them to this side, then extend the last one.
 *       (Composite opposite-side FDs are intentionally skipped — flipping a composite FD because one of its
 *       starts is dragged from the other side would be wrong; fall through to create a new FD instead.)
 *   3. tgtAttr is already a start in a same-side FD → add srcAttr as a co-determinant.
 *   4. No matching FD → create a new FD on the next available lane.
 */
export function connectFD(connection, { fds, tables, currentStageIndex, addFD, updateFD }) {
    if (connection.source !== connection.target) return;
    const src = parseFDHandle(connection.sourceHandle);
    const tgt = parseFDHandle(connection.targetHandle);
    if (!src || !tgt || src.attrId === tgt.attrId) return;

    const tableNode = tables.find((t) => t.id === connection.source);
    if (!tableNode) return;

    const isRight = src.isRight;

    const sideFDs = fds.filter((fd) => {
        if ((fd.level < 0) !== isRight) return false;
        if (fd.tableId) return fd.tableId === tableNode.id;
        return fd.starts.every((s) =>
            tableNode.tableAttributes.some((ta) => ta.attributeId === s.attributeId)
        );
    });

    const matchingFD = sideFDs.findLast((fd) =>
        fd.starts.some((s) => s.attributeId === src.attrId)
    );

    if (matchingFD) {
        const alreadyInFD =
            matchingFD.ends.some((e) => e.attributeId === tgt.attrId) ||
            matchingFD.starts.some((s) => s.attributeId === tgt.attrId);

        if (alreadyInFD) {
            // srcAttr is part of a composite-key FD that already covers tgtAttr.
            // Allow creating a new partial-dependency FD with srcAttr as the sole determinant.
            if (matchingFD.starts.length > 1) {
                const partialAlreadyExists = sideFDs.some(
                    (fd) =>
                        fd.starts.length === 1 &&
                        fd.starts[0].attributeId === src.attrId &&
                        fd.ends.some((e) => e.attributeId === tgt.attrId)
                );
                if (!partialAlreadyExists) {
                    const usedLevels = sideFDs.map((fd) => Math.abs(fd.level));
                    const nextLevel = (usedLevels.length ? Math.max(...usedLevels) : 0) + 1;
                    addFD(currentStageIndex, {
                        id: `fd-${generateId()}`,
                        tableId: tableNode.id,
                        color: pickColor(sideFDs),
                        level: isRight ? -nextLevel : nextLevel,
                        type: 'partial',
                        starts: [{ id: `fds-${generateId()}`, attributeId: src.attrId }],
                        ends:   [{ id: `fde-${generateId()}`, attributeId: tgt.attrId }],
                    });
                }
            }
            return;
        }

        updateFD(currentStageIndex, matchingFD.id, {
            ends: [...matchingFD.ends, { id: `fde-${generateId()}`, attributeId: tgt.attrId }],
        });
        return;
    }

    const srcOppFDs = fds.filter((fd) => {
        if ((fd.level < 0) === isRight) return false;
        if (fd.starts.length !== 1) return false;
        if (!fd.starts.some((s) => s.attributeId === src.attrId)) return false;
        if (fd.tableId) return fd.tableId === tableNode.id;
        return fd.starts.every((s) => tableNode.tableAttributes.some((ta) => ta.attributeId === s.attributeId));
    });

    if (srcOppFDs.length > 0) {
        srcOppFDs.forEach((fd) => {
            updateFD(currentStageIndex, fd.id, { level: -fd.level });
        });
        const lastFlipped = srcOppFDs[srcOppFDs.length - 1];
        const alreadyInFD =
            lastFlipped.ends.some((e) => e.attributeId === tgt.attrId) ||
            lastFlipped.starts.some((s) => s.attributeId === tgt.attrId);
        if (!alreadyInFD) {
            updateFD(currentStageIndex, lastFlipped.id, {
                ends: [...lastFlipped.ends, { id: `fde-${generateId()}`, attributeId: tgt.attrId }],
            });
        }
        return;
    }

    const coStartFD = sideFDs.findLast((fd) =>
        fd.starts.some((s) => s.attributeId === tgt.attrId) &&
        !fd.starts.some((s) => s.attributeId === src.attrId)
    );
    if (coStartFD) {
        updateFD(currentStageIndex, coStartFD.id, {
            starts: [...coStartFD.starts, { id: `fds-${generateId()}`, attributeId: src.attrId }],
        });
        return;
    }

    const usedLevels = sideFDs.map((fd) => Math.abs(fd.level));
    const nextLevel = (usedLevels.length ? Math.max(...usedLevels) : 0) + 1;
    addFD(currentStageIndex, {
        id: `fd-${generateId()}`,
        tableId: tableNode.id,
        color: pickColor(sideFDs),
        level: isRight ? -nextLevel : nextLevel,
        type: 'full',
        starts: [{ id: `fds-${generateId()}`, attributeId: src.attrId }],
        ends:   [{ id: `fde-${generateId()}`, attributeId: tgt.attrId }],
    });
}

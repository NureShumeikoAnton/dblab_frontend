import generateId from './generateId.js';
import { pickColor } from './fdConnection.js';

/**
 * FD relocation (issue #21).
 *
 * When an attribute is moved between tables during 2NF/3NF decomposition, the
 * functional dependency that involved it should follow. This helper mutates an
 * immer stage draft in place.
 *
 * Philosophy: removing an attribute is NON-destructive to FDs — a bracket whose
 * endpoint row is gone is hidden by FDEdge, and a globally-orphaned FD is excluded
 * by the validation engine. The actual transfer happens here, on ADD: when a table
 * comes to hold an FD's full determinant plus one or more of its dependents, those
 * dependents are MOVED into that table. This makes the operation order-independent
 * (delete-then-readd or readd-then-delete both work) and round-trip safe (merging
 * back into an existing FD instead of piling up duplicates).
 *
 * FD shape: { id, tableId, color, level, type, starts:[{id,attributeId}], ends:[{id,attributeId}] }
 *   level sign = side (negative = right), magnitude = lane.
 */

const startIdsOf = (fd) => fd.starts.map((s) => s.attributeId);
const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));
const isRightSide = (fd) => Number(fd.level) < 0;

/** Picks a free lane + colour for a new/relocated FD on the given side of destTableId. */
function placeOnSide(stage, destTableId, isRight) {
    const sideFDs = stage.fds.filter(
        (d) => d.tableId === destTableId && isRightSide(d) === isRight
    );
    const used = sideFDs.map((d) => Math.abs(Number(d.level)));
    const nextLevel = (used.length ? Math.max(...used) : 0) + 1;
    return { level: isRight ? -nextLevel : nextLevel, color: pickColor(sideFDs) };
}

/** Appends end attributeIds to an FD, skipping ones it already has. */
function mergeEnds(targetFD, endAttrIds) {
    const have = new Set(targetFD.ends.map((e) => e.attributeId));
    for (const id of endAttrIds) {
        if (!have.has(id)) targetFD.ends.push({ id: `fde-${generateId()}`, attributeId: id });
    }
}

/**
 * Re-homes into `destTableId` the dependents of any FD whose full determinant now
 * lives there. Whole-FD moves are re-pointed in place (or merged into an existing
 * same-determinant FD); partial moves are split so each table keeps only the
 * dependents it can support.
 */
export function relocateFDsToTable(stage, destTableId) {
    const destTable = stage.tables.find((t) => t.id === destTableId);
    if (!destTable) return;
    const destAttrIds = new Set(destTable.tableAttributes.map((ta) => ta.attributeId));

    // Snapshot — we may push to / filter stage.fds while iterating.
    for (const fd of [...stage.fds]) {
        if (fd.tableId === destTableId) continue;

        const startIds = startIdsOf(fd);
        if (!startIds.every((id) => destAttrIds.has(id))) continue; // determinant not fully here

        const fitEndIds = fd.ends.map((e) => e.attributeId).filter((id) => destAttrIds.has(id));
        if (fitEndIds.length === 0) continue;
        const nonFitEnds = fd.ends.filter((e) => !destAttrIds.has(e.attributeId));

        // An existing FD on the destination with the same determinant absorbs the move.
        const existing = stage.fds.find(
            (d) => d !== fd && d.tableId === destTableId && sameSet(startIdsOf(d), startIds)
        );

        if (nonFitEnds.length === 0) {
            // Whole FD transfers.
            if (existing) {
                mergeEnds(existing, fitEndIds);
                stage.fds = stage.fds.filter((f) => f !== fd);
            } else {
                const { level, color } = placeOnSide(stage, destTableId, isRightSide(fd));
                fd.tableId = destTableId;
                fd.level = level;
                fd.color = color;
            }
        } else {
            // Split: only the fitting dependents go to the destination.
            if (existing) {
                mergeEnds(existing, fitEndIds);
            } else {
                const { level, color } = placeOnSide(stage, destTableId, isRightSide(fd));
                stage.fds.push({
                    id: `fd-${generateId()}`,
                    tableId: destTableId,
                    color,
                    level,
                    type: fd.type,
                    starts: startIds.map((id) => ({ id: `fds-${generateId()}`, attributeId: id })),
                    ends: fitEndIds.map((id) => ({ id: `fde-${generateId()}`, attributeId: id })),
                });
            }
            fd.ends = nonFitEnds; // source keeps the dependents it still holds
        }
    }
}

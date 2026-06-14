import generateId from './generateId.js';
import { TABLE_COLORS } from '../config/tableColors.js';

/**
 * Builds a new Table object whose primary key is composed of the given source
 * table attributes. Used when extracting attribute(s) into their own table
 * (composite-PK extraction). Pure — does not touch the store.
 *
 * @param {object} sourceTable  the table the attributes are taken from (for position anchor)
 * @param {object[]} tas        the source TableAttribute rows being extracted
 * @param {object[]} attrs      the matching pool Attribute objects (same order as tas)
 * @returns {object} a Table object ready to push into a stage
 */
export function buildTableFromAttributes(sourceTable, tas, attrs) {
    const color = TABLE_COLORS[Math.floor(Math.random() * TABLE_COLORS.length)];
    const position = { x: sourceTable.position.x + 280, y: sourceTable.position.y };
    const baseName = attrs.length === 1
        ? attrs[0].name + '_Table'
        : attrs.map((a) => a.name).join('_') + '_Table';

    return {
        id: generateId(),
        name: baseName,
        color,
        position,
        tableAttributes: tas.map((ta, i) => ({
            id: generateId(),
            attributeId: ta.attributeId,
            is_PK: true,
            is_FK: false,
            alias: null,
            order: i,
        })),
    };
}

export default buildTableFromAttributes;

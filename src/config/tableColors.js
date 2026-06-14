/**
 * Palette used for table nodes — both the manual color picker (TableToolbar)
 * and the auto-assigned color when a table is generated from attributes.
 * Lives in config (not a component) so non-UI code (store / utils) can import it
 * without pulling in React component modules.
 */
export const TABLE_COLORS = [
    '#4A90D9', '#E74C3C', '#27AE60', '#F39C12', '#9B59B6',
    '#16A085', '#2C3E50', '#E67E22', '#1ABC9C', '#D35400',
];

export default TABLE_COLORS;

/**
 * Declarative keyboard map for the editor.
 *
 * Single source of truth: each entry maps a normalized key combo to a command id.
 * `useEditorShortcuts` matches incoming events against this table and dispatches
 * the command; a future "shortcuts help" overlay can render straight from KEYMAP.
 *
 * Combo grammar: modifiers in fixed order `Ctrl`, `Alt`, `Shift`, then a key token.
 *   - "Ctrl" matches Ctrl OR ⌘ (Cmd) so Mac users get the same binds.
 *   - Letters use the uppercased key  → "A", "S".
 *   - Digits and arrows use e.code     → "Digit1", "ArrowUp" (layout-independent).
 *   - Named keys use e.key             → "Enter", "Escape", "Delete", "Backspace".
 */
export const KEYMAP = [
    { combo: 'Delete', command: 'deleteSelected', description: 'Видалити виділений елемент' },
    { combo: 'Backspace', command: 'deleteSelected', description: 'Видалити виділений елемент' },
    { combo: 'Ctrl+Enter', command: 'createTableFromAttr', description: 'Створити таблицю з виділеного атрибута' },
    { combo: 'Ctrl+A', command: 'createAttribute', description: 'Створити атрибут' },
    { combo: 'Escape', command: 'cancelOrClear', description: 'Закрити / скасувати / зняти виділення' },
    { combo: 'Ctrl+S', command: 'save', description: 'Зберегти проект' },
    { combo: 'Ctrl+Digit1', command: 'stage0', description: 'Перейти до 1НФ' },
    { combo: 'Ctrl+Digit2', command: 'stage1', description: 'Перейти до ФЗ' },
    { combo: 'Ctrl+Digit3', command: 'stage2', description: 'Перейти до 2НФ' },
    { combo: 'Ctrl+Digit4', command: 'stage3', description: 'Перейти до 3НФ' },
    { combo: 'Alt+ArrowUp', command: 'reorderUp', description: 'Перемістити атрибут вгору' },
    { combo: 'Alt+ArrowDown', command: 'reorderDown', description: 'Перемістити атрибут вниз' },
    { combo: 'Ctrl+Z', command: 'undo', description: 'Скасувати' },
    { combo: 'Ctrl+Shift+Z', command: 'redo', description: 'Повторити' },
    { combo: 'Ctrl+Y', command: 'redo', description: 'Повторити' },
];

const COMBO_TO_COMMAND = new Map(KEYMAP.map((entry) => [entry.combo, entry.command]));

/** Normalizes a keydown event into a combo string (see grammar above). */
export function matchEvent(e) {
    const mods = [];
    if (e.ctrlKey || e.metaKey) mods.push('Ctrl');
    if (e.altKey) mods.push('Alt');
    if (e.shiftKey) mods.push('Shift');

    let token;
    if (e.code?.startsWith('Digit') || e.code?.startsWith('Arrow')) {
        token = e.code;
    } else if (e.key.length === 1) {
        token = e.key.toUpperCase();
    } else {
        token = e.key; // Enter, Escape, Delete, Backspace, …
    }

    return [...mods, token].join('+');
}

/** Returns the command id bound to an event, or null if none. */
export function getCommand(e) {
    return COMBO_TO_COMMAND.get(matchEvent(e)) ?? null;
}

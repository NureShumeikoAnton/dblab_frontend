export const NF_CONFIG = {
    PLURAL_SUFFIXES: ['s', 'es', 'ies'],
    PLURAL_EXCEPTIONS: [
        'address', 'status', 'class', 'bonus', 'bus', 'alias',
        'canvas', 'census', 'focus', 'campus', 'nexus', 'radius',
        'analysis', 'basis', 'crisis', 'thesis',
    ],
    NON_ATOMIC_KEYWORDS: [
        'list', 'array', 'csv', 'tags', 'data', 'info',
        'details', 'set', 'collection', 'group', 'items',
        'values', 'entries', 'records', 'json', 'blob',
    ],
    COMPOUND_SEGMENT_THRESHOLD: 3,
};

// Defines display order and type (auto | manual) for each rule per stage.
// manual rules map to violationChecks[] by checkIndex.
// auto rules derive their status from the algorithm via autoKey.
export const STAGE_RULES = {
    '1NF': [
        { text: 'Усі значення атрибутів є атомарними (без багатозначних або складових атрибутів)', type: 'auto', autoKey: '1nf_atomic' },
        { text: 'Відсутні групи, що повторюються / масиви', type: 'auto', autoKey: '1nf_plural' },
        { text: 'Кожен рядок однозначно ідентифікується первинним ключем', type: 'auto', autoKey: 'missingPK' },
        { text: 'Імена атрибутів є однозначними в межах кожної таблиці', type: 'manual', checkIndex: 0 },
    ],
    'FDs': [
        { text: 'На кожній таблиці визначена принаймні одна функціональна залежність', type: 'auto', autoKey: 'fds_present' },
        { text: 'Усі функціональні залежності ідентифіковані та задокументовані', type: 'manual', checkIndex: 0 },
    ],
    '2NF': [
        { text: 'Кожен неключовий атрибут повністю функціонально залежить від усього первинного ключа', type: 'auto', autoKey: '2nf' },
        { text: 'Відсутні часткові залежності (перевірено через анотації ФЗ)', type: 'auto', autoKey: '2nf' },
        { text: 'Таблиці декомпозовані для усунення часткових залежностей', type: 'manual', checkIndex: 0 },
    ],
    '3NF': [
        { text: 'Відсутні транзитивні залежності (неключовий → неключовий атрибут)', type: 'auto', autoKey: '3nf' },
        { text: 'Усі транзитивні залежності декомпозовані в окремі таблиці', type: 'manual', checkIndex: 0 },
        { text: 'Анотації ФЗ підтверджують, що жоден неключовий атрибут не визначає інший неключовий атрибут', type: 'auto', autoKey: '3nf' },
    ],
};

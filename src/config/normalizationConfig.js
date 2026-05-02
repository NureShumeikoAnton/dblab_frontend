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
    '0NF': [
        { text: 'All data for the domain is captured (no missing entities)', type: 'manual', checkIndex: 0 },
        { text: 'Primary key is identified', type: 'auto', autoKey: 'missingPK' },
        { text: 'Repeating groups and multi-valued fields are visible and documented', type: 'manual', checkIndex: 1 },
    ],
    '1NF': [
        { text: 'All attribute values are atomic (no multi-valued or composite attributes)', type: 'auto', autoKey: '1nf_atomic' },
        { text: 'No repeating groups / arrays', type: 'auto', autoKey: '1nf_plural' },
        { text: 'Every row is uniquely identified by a primary key', type: 'auto', autoKey: 'missingPK' },
        { text: 'Attribute names are unambiguous within each table', type: 'manual', checkIndex: 0 },
    ],
    '2NF': [
        { text: 'Every non-key attribute is fully functionally dependent on the entire primary key', type: 'auto', autoKey: '2nf' },
        { text: 'No partial dependencies exist (verified via FD annotations)', type: 'auto', autoKey: '2nf' },
        { text: 'Tables have been decomposed to remove partial dependencies', type: 'manual', checkIndex: 0 },
    ],
    '3NF': [
        { text: 'No transitive dependencies (non-key → non-key attribute dependencies)', type: 'auto', autoKey: '3nf' },
        { text: 'All transitive dependencies decomposed into separate tables', type: 'manual', checkIndex: 0 },
        { text: 'FD annotations confirm no non-key attribute determines another non-key attribute', type: 'auto', autoKey: '3nf' },
    ],
};

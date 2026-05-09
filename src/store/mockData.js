/**
 * Mock fixtures for demo / development.
 * Domain: Library Management System — members, books, loans.
 * Covers all four normalization stages with realistic FDs so every checker
 * (pre-flight, 1NF heuristics, 2NF partial dep, 3NF transitive dep) has
 * something to show.
 *
 * Bracket level conventions (FDEdge):
 *   level > 0  →  LEFT bracket  (1 = nearest, 2 = next out, …)
 *   level < 0  →  RIGHT bracket (−1 = nearest, −2 = next out, …)
 */

export const MOCK_PROJECT = {
    id: 'proj-1',
    name: 'Library Management System',
    description: 'A relational schema for tracking books, members, and loans in a public library.',
};

// ── Project-level attribute pool ────────────────────────────────────────────
export const MOCK_ATTRIBUTES = [
    { id: 'attr-1',  name: 'member_id',    data_type: 'INT',       introduced_at_stage_Id: 'stage-0nf', retired_at_stage_Id: null },
    { id: 'attr-2',  name: 'member_name',  data_type: 'VARCHAR',   introduced_at_stage_Id: 'stage-0nf', retired_at_stage_Id: null },
    { id: 'attr-3',  name: 'member_email', data_type: 'VARCHAR',   introduced_at_stage_Id: 'stage-0nf', retired_at_stage_Id: null },
    { id: 'attr-4',  name: 'book_id',      data_type: 'INT',       introduced_at_stage_Id: 'stage-0nf', retired_at_stage_Id: null },
    { id: 'attr-5',  name: 'book_title',   data_type: 'VARCHAR',   introduced_at_stage_Id: 'stage-0nf', retired_at_stage_Id: null },
    { id: 'attr-6',  name: 'book_author',  data_type: 'VARCHAR',   introduced_at_stage_Id: 'stage-0nf', retired_at_stage_Id: null },
    { id: 'attr-7',  name: 'loan_date',    data_type: 'DATE',      introduced_at_stage_Id: 'stage-0nf', retired_at_stage_Id: null },
    { id: 'attr-8',  name: 'return_date',  data_type: 'DATE',      introduced_at_stage_Id: 'stage-1nf', retired_at_stage_Id: null },
    { id: 'attr-9',  name: 'member_phone', data_type: 'VARCHAR',   introduced_at_stage_Id: 'stage-0nf', retired_at_stage_Id: null },
    { id: 'attr-10', name: 'author_id',    data_type: 'INT',       introduced_at_stage_Id: 'stage-2nf', retired_at_stage_Id: null },
    { id: 'attr-11', name: 'genre_id',     data_type: 'INT',       introduced_at_stage_Id: 'stage-2nf', retired_at_stage_Id: null },
    { id: 'attr-12', name: 'genre_name',   data_type: 'VARCHAR',   introduced_at_stage_Id: 'stage-0nf', retired_at_stage_Id: null },
    { id: 'attr-13', name: 'due_date',     data_type: 'DATE',      introduced_at_stage_Id: 'stage-1nf', retired_at_stage_Id: null },
];

// ── 0NF — everything in one unnormalized table ───────────────────────────────
// Checker: missingPK passes (member_id marked), manual checks prompt the student
// to document repeating groups.
const STAGE_0NF = {
    stageId: 'stage-0nf',
    form: '0NF',
    initialized: true,
    tables: [
        {
            id: 'tbl-0-1',
            name: 'Library',
            color: '#4A90D9',
            position: { x: 100, y: 80 },
            tableAttributes: [
                { id: 'ta-0-1',  attributeId: 'attr-1',  is_PK: true,  is_FK: false, alias: null, order: 0 },
                { id: 'ta-0-2',  attributeId: 'attr-2',  is_PK: false, is_FK: false, alias: null, order: 1 },
                { id: 'ta-0-3',  attributeId: 'attr-3',  is_PK: false, is_FK: false, alias: null, order: 2 },
                { id: 'ta-0-4',  attributeId: 'attr-9',  is_PK: false, is_FK: false, alias: null, order: 3 },
                { id: 'ta-0-5',  attributeId: 'attr-4',  is_PK: false, is_FK: false, alias: null, order: 4 },
                { id: 'ta-0-6',  attributeId: 'attr-5',  is_PK: false, is_FK: false, alias: null, order: 5 },
                { id: 'ta-0-7',  attributeId: 'attr-6',  is_PK: false, is_FK: false, alias: null, order: 6 },
                { id: 'ta-0-8',  attributeId: 'attr-12', is_PK: false, is_FK: false, alias: null, order: 7 },
                { id: 'ta-0-9',  attributeId: 'attr-7',  is_PK: false, is_FK: false, alias: null, order: 8 },
                { id: 'ta-0-10', attributeId: 'attr-8',  is_PK: false, is_FK: false, alias: null, order: 9 },
                { id: 'ta-0-11', attributeId: 'attr-13', is_PK: false, is_FK: false, alias: null, order: 10 },
            ],
        },
    ],
    relationships: [],
    fds: [],
    violationChecks: [false, false],
};

// ── 1NF — Members + LoanRecords ─────────────────────────────────────────────
// The student split off member data but kept book info in the loan table.
// fd-1-1 shows book_id → {book_title, book_author, genre_name} — a partial
// dependency on only PART of the composite PK (member_id + book_id).
// The 2NF checker flags it with ❌ on the bracket even here in the 1NF canvas.
const STAGE_1NF = {
    stageId: 'stage-1nf',
    form: '1NF',
    initialized: true,
    tables: [
        {
            id: 'tbl-1-1',
            name: 'Members',
            color: '#27AE60',
            position: { x: 60, y: 80 },
            tableAttributes: [
                { id: 'ta-1-1', attributeId: 'attr-1', is_PK: true,  is_FK: false, alias: null, order: 0 },
                { id: 'ta-1-2', attributeId: 'attr-2', is_PK: false, is_FK: false, alias: null, order: 1 },
                { id: 'ta-1-3', attributeId: 'attr-3', is_PK: false, is_FK: false, alias: null, order: 2 },
                { id: 'ta-1-4', attributeId: 'attr-9', is_PK: false, is_FK: false, alias: null, order: 3 },
            ],
        },
        {
            id: 'tbl-1-2',
            name: 'LoanRecords',
            color: '#E67E22',
            position: { x: 400, y: 60 },
            tableAttributes: [
                { id: 'ta-1-5',  attributeId: 'attr-1',  is_PK: true,  is_FK: true,  alias: 'member_id', order: 0 },
                { id: 'ta-1-6',  attributeId: 'attr-4',  is_PK: true,  is_FK: false, alias: null,        order: 1 },
                { id: 'ta-1-7',  attributeId: 'attr-5',  is_PK: false, is_FK: false, alias: null,        order: 2 },
                { id: 'ta-1-8',  attributeId: 'attr-6',  is_PK: false, is_FK: false, alias: null,        order: 3 },
                { id: 'ta-1-9',  attributeId: 'attr-12', is_PK: false, is_FK: false, alias: null,        order: 4 },
                { id: 'ta-1-10', attributeId: 'attr-7',  is_PK: false, is_FK: false, alias: null,        order: 5 },
                { id: 'ta-1-11', attributeId: 'attr-8',  is_PK: false, is_FK: false, alias: null,        order: 6 },
                { id: 'ta-1-12', attributeId: 'attr-13', is_PK: false, is_FK: false, alias: null,        order: 7 },
            ],
        },
    ],
    relationships: [
        {
            id: 'rel-1-1',
            table1Id: 'tbl-1-1',
            table2Id: 'tbl-1-2',
            type: 'identifying',
            color: '#9B59B6',
            cardinality_t1: '1',
            cardinality_t2: '0..*',
        },
    ],
    fds: [
        {
            // Partial dependency (2NF violation): book_id alone → book attrs
            // Spans rows 1–4 on the LEFT of LoanRecords.
            id: 'fd-1-1',
            tableId: 'tbl-1-2',
            color: '#E74C3C',
            level: 1,
            type: 'partial',
            starts: [{ id: 'fds-1-1', attributeId: 'attr-4' }],
            ends: [
                { id: 'fde-1-1', attributeId: 'attr-5' },
                { id: 'fde-1-2', attributeId: 'attr-6' },
                { id: 'fde-1-3', attributeId: 'attr-12' },
            ],
        },
        {
            // Full dependency: member_id → all member attrs (single PK, fine).
            // RIGHT bracket on Members.
            id: 'fd-1-2',
            tableId: 'tbl-1-1',
            color: '#2980B9',
            level: -1,
            type: 'full',
            starts: [{ id: 'fds-1-2', attributeId: 'attr-1' }],
            ends: [
                { id: 'fde-1-4', attributeId: 'attr-2' },
                { id: 'fde-1-5', attributeId: 'attr-3' },
                { id: 'fde-1-6', attributeId: 'attr-9' },
            ],
        },
    ],
    violationChecks: [false],
};

// ── 2NF — Members + Books + Loans ───────────────────────────────────────────
// Partial deps resolved: book attrs moved to Books, member attrs stay in Members.
// Loans keeps only the composite PK and date attributes.
// fd-2-3 has TWO starts (composite key) — demonstrates multi-start FD bracket.
// 2NF checker: pass (no partial deps). 3NF checker: pass (no transitive deps).
const STAGE_2NF = {
    stageId: 'stage-2nf',
    form: '2NF',
    initialized: true,
    tables: [
        {
            id: 'tbl-2-1',
            name: 'Members',
            color: '#27AE60',
            position: { x: 60, y: 200 },
            tableAttributes: [
                { id: 'ta-2-1', attributeId: 'attr-1', is_PK: true,  is_FK: false, alias: null, order: 0 },
                { id: 'ta-2-2', attributeId: 'attr-2', is_PK: false, is_FK: false, alias: null, order: 1 },
                { id: 'ta-2-3', attributeId: 'attr-3', is_PK: false, is_FK: false, alias: null, order: 2 },
                { id: 'ta-2-4', attributeId: 'attr-9', is_PK: false, is_FK: false, alias: null, order: 3 },
            ],
        },
        {
            id: 'tbl-2-2',
            name: 'Books',
            color: '#E67E22',
            position: { x: 420, y: 40 },
            tableAttributes: [
                { id: 'ta-2-5',  attributeId: 'attr-4',  is_PK: true,  is_FK: false, alias: null, order: 0 },
                { id: 'ta-2-6',  attributeId: 'attr-5',  is_PK: false, is_FK: false, alias: null, order: 1 },
                { id: 'ta-2-7',  attributeId: 'attr-10', is_PK: false, is_FK: false, alias: null, order: 2 },
                { id: 'ta-2-8',  attributeId: 'attr-6',  is_PK: false, is_FK: false, alias: null, order: 3 },
                { id: 'ta-2-9',  attributeId: 'attr-11', is_PK: false, is_FK: false, alias: null, order: 4 },
                { id: 'ta-2-10', attributeId: 'attr-12', is_PK: false, is_FK: false, alias: null, order: 5 },
            ],
        },
        {
            id: 'tbl-2-3',
            name: 'Loans',
            color: '#16A085',
            position: { x: 420, y: 330 },
            tableAttributes: [
                { id: 'ta-2-11', attributeId: 'attr-1',  is_PK: true,  is_FK: true,  alias: 'member_id', order: 0 },
                { id: 'ta-2-12', attributeId: 'attr-4',  is_PK: true,  is_FK: true,  alias: 'book_id',   order: 1 },
                { id: 'ta-2-13', attributeId: 'attr-7',  is_PK: false, is_FK: false, alias: null,        order: 2 },
                { id: 'ta-2-14', attributeId: 'attr-8',  is_PK: false, is_FK: false, alias: null,        order: 3 },
                { id: 'ta-2-15', attributeId: 'attr-13', is_PK: false, is_FK: false, alias: null,        order: 4 },
            ],
        },
    ],
    relationships: [
        {
            id: 'rel-2-1',
            table1Id: 'tbl-2-1',
            table2Id: 'tbl-2-3',
            type: 'identifying',
            color: '#9B59B6',
            cardinality_t1: '1',
            cardinality_t2: '0..*',
        },
        {
            id: 'rel-2-2',
            table1Id: 'tbl-2-2',
            table2Id: 'tbl-2-3',
            type: 'identifying',
            color: '#2980B9',
            cardinality_t1: '1',
            cardinality_t2: '0..*',
        },
    ],
    fds: [
        {
            // Full dep: book_id → all book attrs (single PK, not partial).
            // LEFT bracket on Books.
            id: 'fd-2-1',
            tableId: 'tbl-2-2',
            color: '#E74C3C',
            level: 1,
            type: 'full',
            starts: [{ id: 'fds-2-1', attributeId: 'attr-4' }],
            ends: [
                { id: 'fde-2-1', attributeId: 'attr-5' },
                { id: 'fde-2-2', attributeId: 'attr-10' },
                { id: 'fde-2-3', attributeId: 'attr-6' },
                { id: 'fde-2-4', attributeId: 'attr-11' },
                { id: 'fde-2-5', attributeId: 'attr-12' },
            ],
        },
        {
            // Full dep: member_id → all member attrs.
            // RIGHT bracket on Members.
            id: 'fd-2-2',
            tableId: 'tbl-2-1',
            color: '#F39C12',
            level: -1,
            type: 'full',
            starts: [{ id: 'fds-2-2', attributeId: 'attr-1' }],
            ends: [
                { id: 'fde-2-6', attributeId: 'attr-2' },
                { id: 'fde-2-7', attributeId: 'attr-3' },
                { id: 'fde-2-8', attributeId: 'attr-9' },
            ],
        },
        {
            // Full dep on COMPOSITE PK: {member_id, book_id} → date attrs.
            // Two starts — demonstrates multi-start bracket on Loans LEFT side.
            // isProperSubset = false (starts cover the full key) → NOT a partial dep.
            id: 'fd-2-3',
            tableId: 'tbl-2-3',
            color: '#16A085',
            level: 1,
            type: 'full',
            starts: [
                { id: 'fds-2-3a', attributeId: 'attr-1' },
                { id: 'fds-2-3b', attributeId: 'attr-4' },
            ],
            ends: [
                { id: 'fde-2-9',  attributeId: 'attr-7' },
                { id: 'fde-2-10', attributeId: 'attr-8' },
                { id: 'fde-2-11', attributeId: 'attr-13' },
            ],
        },
    ],
    violationChecks: [false],
};

// ── 3NF — same tables as 2NF, but Books still has transitive dependencies ───
// The student carried over author_id + book_author and genre_id + genre_name
// into Books without decomposing them.
// fd-3-2: author_id → book_author   (non-key → non-key → 3NF VIOLATION ❌)
// fd-3-3: genre_id  → genre_name    (non-key → non-key → 3NF VIOLATION ❌)
// fd-3-1 and fd-3-4/3-5 are clean full deps (pass).
const STAGE_3NF = {
    stageId: 'stage-3nf',
    form: '3NF',
    initialized: true,
    tables: [
        {
            id: 'tbl-3-1',
            name: 'Members',
            color: '#27AE60',
            position: { x: 60, y: 200 },
            tableAttributes: [
                { id: 'ta-3-1', attributeId: 'attr-1', is_PK: true,  is_FK: false, alias: null, order: 0 },
                { id: 'ta-3-2', attributeId: 'attr-2', is_PK: false, is_FK: false, alias: null, order: 1 },
                { id: 'ta-3-3', attributeId: 'attr-3', is_PK: false, is_FK: false, alias: null, order: 2 },
                { id: 'ta-3-4', attributeId: 'attr-9', is_PK: false, is_FK: false, alias: null, order: 3 },
            ],
        },
        {
            id: 'tbl-3-2',
            name: 'Books',
            color: '#E67E22',
            position: { x: 420, y: 40 },
            tableAttributes: [
                { id: 'ta-3-5',  attributeId: 'attr-4',  is_PK: true,  is_FK: false, alias: null, order: 0 },
                { id: 'ta-3-6',  attributeId: 'attr-5',  is_PK: false, is_FK: false, alias: null, order: 1 },
                { id: 'ta-3-7',  attributeId: 'attr-10', is_PK: false, is_FK: false, alias: null, order: 2 },
                { id: 'ta-3-8',  attributeId: 'attr-6',  is_PK: false, is_FK: false, alias: null, order: 3 },
                { id: 'ta-3-9',  attributeId: 'attr-11', is_PK: false, is_FK: false, alias: null, order: 4 },
                { id: 'ta-3-10', attributeId: 'attr-12', is_PK: false, is_FK: false, alias: null, order: 5 },
            ],
        },
        {
            id: 'tbl-3-3',
            name: 'Loans',
            color: '#16A085',
            position: { x: 420, y: 330 },
            tableAttributes: [
                { id: 'ta-3-11', attributeId: 'attr-1',  is_PK: true,  is_FK: true,  alias: 'member_id', order: 0 },
                { id: 'ta-3-12', attributeId: 'attr-4',  is_PK: true,  is_FK: true,  alias: 'book_id',   order: 1 },
                { id: 'ta-3-13', attributeId: 'attr-7',  is_PK: false, is_FK: false, alias: null,        order: 2 },
                { id: 'ta-3-14', attributeId: 'attr-8',  is_PK: false, is_FK: false, alias: null,        order: 3 },
                { id: 'ta-3-15', attributeId: 'attr-13', is_PK: false, is_FK: false, alias: null,        order: 4 },
            ],
        },
    ],
    relationships: [
        {
            id: 'rel-3-1',
            table1Id: 'tbl-3-1',
            table2Id: 'tbl-3-3',
            type: 'identifying',
            color: '#9B59B6',
            cardinality_t1: '1',
            cardinality_t2: '0..*',
        },
        {
            id: 'rel-3-2',
            table1Id: 'tbl-3-2',
            table2Id: 'tbl-3-3',
            type: 'identifying',
            color: '#2980B9',
            cardinality_t1: '1',
            cardinality_t2: '0..*',
        },
    ],
    fds: [
        {
            // Full dep: book_id → book_title, author_id, genre_id (PK start → clean).
            // LEFT bracket, lane 1 on Books.
            id: 'fd-3-1',
            tableId: 'tbl-3-2',
            color: '#27AE60',
            level: 1,
            type: 'full',
            starts: [{ id: 'fds-3-1', attributeId: 'attr-4' }],
            ends: [
                { id: 'fde-3-1', attributeId: 'attr-5' },
                { id: 'fde-3-2', attributeId: 'attr-10' },
                { id: 'fde-3-3', attributeId: 'attr-11' },
            ],
        },
        {
            // 3NF VIOLATION: author_id (non-key) → book_author (non-key).
            // RIGHT bracket, lane 1 on Books.
            id: 'fd-3-2',
            tableId: 'tbl-3-2',
            color: '#E74C3C',
            level: -1,
            type: 'transitive',
            starts: [{ id: 'fds-3-2', attributeId: 'attr-10' }],
            ends:   [{ id: 'fde-3-4', attributeId: 'attr-6' }],
        },
        {
            // 3NF VIOLATION: genre_id (non-key) → genre_name (non-key).
            // RIGHT bracket, lane 2 on Books (outer).
            id: 'fd-3-3',
            tableId: 'tbl-3-2',
            color: '#9B59B6',
            level: -2,
            type: 'transitive',
            starts: [{ id: 'fds-3-3', attributeId: 'attr-11' }],
            ends:   [{ id: 'fde-3-5', attributeId: 'attr-12' }],
        },
        {
            // Full dep: member_id → all member attrs.
            // RIGHT bracket on Members.
            id: 'fd-3-4',
            tableId: 'tbl-3-1',
            color: '#F39C12',
            level: -1,
            type: 'full',
            starts: [{ id: 'fds-3-4', attributeId: 'attr-1' }],
            ends: [
                { id: 'fde-3-6', attributeId: 'attr-2' },
                { id: 'fde-3-7', attributeId: 'attr-3' },
                { id: 'fde-3-8', attributeId: 'attr-9' },
            ],
        },
        {
            // Full dep on composite PK: {member_id, book_id} → date attrs.
            // LEFT bracket on Loans — two starts, same side.
            id: 'fd-3-5',
            tableId: 'tbl-3-3',
            color: '#16A085',
            level: 1,
            type: 'full',
            starts: [
                { id: 'fds-3-5a', attributeId: 'attr-1' },
                { id: 'fds-3-5b', attributeId: 'attr-4' },
            ],
            ends: [
                { id: 'fde-3-9',  attributeId: 'attr-7' },
                { id: 'fde-3-10', attributeId: 'attr-8' },
                { id: 'fde-3-11', attributeId: 'attr-13' },
            ],
        },
    ],
    violationChecks: [false],
};

export const MOCK_STAGES = [STAGE_0NF, STAGE_1NF, STAGE_2NF, STAGE_3NF];

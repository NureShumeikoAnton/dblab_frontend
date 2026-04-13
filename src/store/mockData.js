/**
 * Mock fixtures for Phase 1 development.
 * Simulates: 1 project, 4 stages, 3 tables, ~8 attributes, 2 relationships, 2 FDs.
 */

export const MOCK_PROJECT = {
    id: 'proj-1',
    name: 'Library Management System',
    description: 'A relational schema for tracking books, members, and loans in a public library.',
};

// Project-level attribute pool
export const MOCK_ATTRIBUTES = [
    { id: 'attr-1', name: 'member_id', data_type: 'INT', introduced_at_stage_Id: 'stage-0nf', retired_at_stage_Id: null },
    { id: 'attr-2', name: 'member_name', data_type: 'VARCHAR', introduced_at_stage_Id: 'stage-0nf', retired_at_stage_Id: null },
    { id: 'attr-3', name: 'member_email', data_type: 'VARCHAR', introduced_at_stage_Id: 'stage-0nf', retired_at_stage_Id: null },
    { id: 'attr-4', name: 'book_id', data_type: 'INT', introduced_at_stage_Id: 'stage-0nf', retired_at_stage_Id: null },
    { id: 'attr-5', name: 'book_title', data_type: 'VARCHAR', introduced_at_stage_Id: 'stage-0nf', retired_at_stage_Id: null },
    { id: 'attr-6', name: 'book_author', data_type: 'VARCHAR', introduced_at_stage_Id: 'stage-0nf', retired_at_stage_Id: null },
    { id: 'attr-7', name: 'loan_date', data_type: 'DATE', introduced_at_stage_Id: 'stage-0nf', retired_at_stage_Id: null },
    { id: 'attr-8', name: 'return_date', data_type: 'DATE', introduced_at_stage_Id: 'stage-1nf', retired_at_stage_Id: null },
];

// 0NF stage: single unnormalized table
const STAGE_0NF = {
    stageId: 'stage-0nf',
    form: '0NF',
    initialized: true,
    tables: [
        {
            id: 'tbl-0-1',
            name: 'Library',
            color: '#4A90D9',
            position: { x: 100, y: 120 },
            tableAttributes: [
                { id: 'ta-0-1', attributeId: 'attr-1', is_PK: true, is_FK: false, alias: null, order: 0 },
                { id: 'ta-0-2', attributeId: 'attr-2', is_PK: false, is_FK: false, alias: null, order: 1 },
                { id: 'ta-0-3', attributeId: 'attr-3', is_PK: false, is_FK: false, alias: null, order: 2 },
                { id: 'ta-0-4', attributeId: 'attr-4', is_PK: false, is_FK: false, alias: null, order: 3 },
                { id: 'ta-0-5', attributeId: 'attr-5', is_PK: false, is_FK: false, alias: null, order: 4 },
                { id: 'ta-0-6', attributeId: 'attr-6', is_PK: false, is_FK: false, alias: null, order: 5 },
                { id: 'ta-0-7', attributeId: 'attr-7', is_PK: false, is_FK: false, alias: null, order: 6 },
            ],
        },
    ],
    relationships: [],
    fds: [],
    violationChecks: [false, false, false],
};

// 1NF stage: two tables, one relationship, one FD
const STAGE_1NF = {
    stageId: 'stage-1nf',
    form: '1NF',
    initialized: true,
    tables: [
        {
            id: 'tbl-1-1',
            name: 'Members',
            color: '#27AE60',
            position: { x: 80, y: 100 },
            tableAttributes: [
                { id: 'ta-1-1', attributeId: 'attr-1', is_PK: true, is_FK: false, alias: null, order: 0 },
                { id: 'ta-1-2', attributeId: 'attr-2', is_PK: false, is_FK: false, alias: null, order: 1 },
                { id: 'ta-1-3', attributeId: 'attr-3', is_PK: false, is_FK: false, alias: null, order: 2 },
            ],
        },
        {
            id: 'tbl-1-2',
            name: 'Books',
            color: '#E67E22',
            position: { x: 420, y: 100 },
            tableAttributes: [
                { id: 'ta-1-4', attributeId: 'attr-4', is_PK: true, is_FK: false, alias: null, order: 0 },
                { id: 'ta-1-5', attributeId: 'attr-5', is_PK: false, is_FK: false, alias: null, order: 1 },
                { id: 'ta-1-6', attributeId: 'attr-6', is_PK: false, is_FK: false, alias: null, order: 2 },
                { id: 'ta-1-7', attributeId: 'attr-7', is_PK: false, is_FK: false, alias: null, order: 3 },
                { id: 'ta-1-8', attributeId: 'attr-8', is_PK: false, is_FK: false, alias: null, order: 4 },
            ],
        },
    ],
    relationships: [
        {
            id: 'rel-1-1',
            table1Id: 'tbl-1-1',
            table2Id: 'tbl-1-2',
            type: 'non-identifying',
            color: '#9B59B6',
            cardinality_t1: '1',
            cardinality_t2: '0..*',
        },
    ],
    fds: [
        {
            id: 'fd-1-1',
            color: '#E74C3C',
            level: 1,           // integer bracket lane (1 = nearest left)
            type: 'full',       // FD_Stage.type
            starts: [{ id: 'fds-1-1', attributeId: 'attr-4' }],
            ends: [
                { id: 'fde-1-1', attributeId: 'attr-5' },
                { id: 'fde-1-2', attributeId: 'attr-6' },
            ],
        },
        {
            // NOTE: demo-only — not a real normalization FD, added to test
            // multiple brackets at different levels on the same table
            id: 'fd-1-2',
            color: '#2980B9',
            level: 2,           // outer lane, renders further left than fd-1-1
            type: 'partial',
            starts: [{ id: 'fds-1-2', attributeId: 'attr-4' }],
            ends: [
                { id: 'fde-1-3', attributeId: 'attr-7' },
                { id: 'fde-1-4', attributeId: 'attr-8' },
            ],
        },
    ],
    violationChecks: [false, false, false, false],
};

// 2NF stage: three tables, two relationships, two FDs
const STAGE_2NF = {
    stageId: 'stage-2nf',
    form: '2NF',
    initialized: true,
    tables: [
        {
            id: 'tbl-2-1',
            name: 'Members',
            color: '#27AE60',
            position: { x: 60, y: 140 },
            tableAttributes: [
                { id: 'ta-2-1', attributeId: 'attr-1', is_PK: true, is_FK: false, alias: null, order: 0 },
                { id: 'ta-2-2', attributeId: 'attr-2', is_PK: false, is_FK: false, alias: null, order: 1 },
                { id: 'ta-2-3', attributeId: 'attr-3', is_PK: false, is_FK: false, alias: null, order: 2 },
            ],
        },
        {
            id: 'tbl-2-2',
            name: 'Books',
            color: '#E67E22',
            position: { x: 400, y: 60 },
            tableAttributes: [
                { id: 'ta-2-4', attributeId: 'attr-4', is_PK: true, is_FK: false, alias: null, order: 0 },
                { id: 'ta-2-5', attributeId: 'attr-5', is_PK: false, is_FK: false, alias: null, order: 1 },
                { id: 'ta-2-6', attributeId: 'attr-6', is_PK: false, is_FK: false, alias: null, order: 2 },
            ],
        },
        {
            id: 'tbl-2-3',
            name: 'Loans',
            color: '#16A085',
            position: { x: 400, y: 280 },
            tableAttributes: [
                { id: 'ta-2-7', attributeId: 'attr-1', is_PK: true, is_FK: true, alias: 'member_id', order: 0 },
                { id: 'ta-2-8', attributeId: 'attr-4', is_PK: true, is_FK: true, alias: 'book_id', order: 1 },
                { id: 'ta-2-9', attributeId: 'attr-7', is_PK: false, is_FK: false, alias: null, order: 2 },
                { id: 'ta-2-10', attributeId: 'attr-8', is_PK: false, is_FK: false, alias: null, order: 3 },
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
            id: 'fd-2-1',
            color: '#E74C3C',
            level: 1,
            type: 'full',
            starts: [{ id: 'fds-2-1', attributeId: 'attr-4' }],
            ends: [
                { id: 'fde-2-1', attributeId: 'attr-5' },
                { id: 'fde-2-2', attributeId: 'attr-6' },
            ],
        },
        {
            id: 'fd-2-2',
            color: '#F39C12',
            level: -1,
            type: 'full',
            starts: [{ id: 'fds-2-2', attributeId: 'attr-1' }],
            ends: [
                { id: 'fde-2-3', attributeId: 'attr-2' },
                { id: 'fde-2-4', attributeId: 'attr-3' },
            ],
        },
    ],
    violationChecks: [false, false, false, false],
};

// 3NF stage: empty (not yet initialized by student)
const STAGE_3NF = {
    stageId: 'stage-3nf',
    form: '3NF',
    initialized: false,
    tables: [],
    relationships: [],
    fds: [],
    violationChecks: [false, false, false, false],
};

export const MOCK_STAGES = [STAGE_0NF, STAGE_1NF, STAGE_2NF, STAGE_3NF];

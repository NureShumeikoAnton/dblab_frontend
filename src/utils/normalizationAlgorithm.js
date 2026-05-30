import { NF_CONFIG } from '../config/normalizationConfig.js';

const SEVERITY = { na: 0, pass: 1, warning: 2, error: 3 };
const worse = (a, b) => (SEVERITY[a] >= SEVERITY[b] ? a : b);

function check1NF_A(name) {
    const lower = name.toLowerCase().trim();
    if (NF_CONFIG.PLURAL_EXCEPTIONS.includes(lower)) return false;
    const lastSeg = lower.split('_').pop();
    return NF_CONFIG.PLURAL_SUFFIXES.some((s) => lastSeg.endsWith(s));
}

function check1NF_B(name) {
    const lower = name.toLowerCase().trim();
    return NF_CONFIG.NON_ATOMIC_KEYWORDS.some((kw) => lower.includes(kw));
}

function check1NF_C(name) {
    return name.split('_').length >= NF_CONFIG.COMPOUND_SEGMENT_THRESHOLD;
}

/**
 * Runs all NF checks against the current stage.
 * Returns maps of issues for inline canvas indicators plus a summary for the modal.
 */
export function runNFChecks(tables, fds, attributePool) {
    const attrMap = new Map(attributePool.map((a) => [a.id, a]));

    const tableHeaderIssues = new Map(); // tableId → Issue[]
    const attrRowIssues = new Map();     // attributeId → Issue[]
    const fdIssues = new Map();          // fdId → Issue[]

    const summary = {
        missingPK: 'pass',
        '1nf_plural': 'pass',
        '1nf_atomic': 'pass',
        '2nf': 'pass',
        '3nf': 'pass',
        fds_present: fds.length > 0 ? 'pass' : 'warning',
        '2nf_violations': [],
        '3nf_violations': [],
        missingPK_tables: [],
        plural_attrs: [],
        atomic_attrs: [],
    };

    if (tables.length === 0) {
        summary['2nf'] = 'na';
        summary['3nf'] = 'na';
        return { tableHeaderIssues, attrRowIssues, fdIssues, summary };
    }

    // ── Pre-flight + 1NF attribute heuristics ──────────────────────────────────

    const nameCount = {};
    tables.forEach((t) => {
        const key = t.name.trim().toLowerCase();
        nameCount[key] = (nameCount[key] ?? 0) + 1;
    });

    for (const table of tables) {
        const hdr = [];

        if (!table.tableAttributes.some((ta) => ta.is_PK)) {
            hdr.push({ type: 'error', message: 'Table has no primary key. Every table must have a uniquely identifying attribute.' });
            summary.missingPK = 'error';
            summary.missingPK_tables.push({ tableId: table.id, tableName: table.name });
        }

        if (nameCount[table.name.trim().toLowerCase()] > 1) {
            hdr.push({ type: 'warning', message: `Duplicate table name "${table.name}" — multiple tables share this name.` });
        }

        if (hdr.length) tableHeaderIssues.set(table.id, hdr);

        for (const ta of table.tableAttributes) {
            const attr = attrMap.get(ta.attributeId);
            if (!attr) continue;
            const issues = [];

            if (check1NF_A(attr.name)) {
                issues.push({ type: 'warning', rule: '1NF-A', message: 'Attribute name appears to be plural — this may represent a multi-valued field, which violates 1NF.' });
                summary['1nf_plural'] = worse(summary['1nf_plural'], 'warning');
                summary.plural_attrs.push({ attributeId: ta.attributeId, name: attr.name, tableId: table.id, tableName: table.name });
            }

            if (check1NF_B(attr.name)) {
                issues.push({ type: 'warning', rule: '1NF-B', message: 'Attribute name contains a keyword suggesting non-atomic storage (e.g. list, csv, array).' });
                summary['1nf_atomic'] = worse(summary['1nf_atomic'], 'warning');
                summary.atomic_attrs.push({ attributeId: ta.attributeId, name: attr.name, tableId: table.id, tableName: table.name });
            }

            if (check1NF_C(attr.name)) {
                issues.push({ type: 'warning', rule: '1NF-C', message: 'Attribute name has multiple segments — it may represent composite data (e.g. "first_last_name"). Consider splitting into separate attributes.' });
                summary['1nf_atomic'] = worse(summary['1nf_atomic'], 'warning');
                summary.atomic_attrs.push({ attributeId: ta.attributeId, name: attr.name, tableId: table.id, tableName: table.name });
            }

            if (issues.length) attrRowIssues.set(ta.attributeId, issues);
        }
    }

    // ── FD helpers ──────────────────────────────────────────────────────────────

    const allTableAttrIds = new Set(
        tables.flatMap((t) => t.tableAttributes.map((ta) => ta.attributeId))
    );

    const isOrphaned = (fd) =>
        fd.starts.some((s) => !allTableAttrIds.has(s.attributeId)) ||
        fd.ends.some((e) => !allTableAttrIds.has(e.attributeId));

    // FD belongs to table T — prefer explicit tableId, fall back to attribute membership.
    const getFDTable = (fd) => {
        if (fd.tableId) return tables.find((t) => t.id === fd.tableId);
        return tables.find((t) =>
            fd.starts.every((s) => t.tableAttributes.some((ta) => ta.attributeId === s.attributeId))
        );
    };

    const liveFDs = fds.filter((fd) => !isOrphaned(fd));

    // ── 2NF — partial dependency detection ─────────────────────────────────────

    const compositePKTables = tables.filter(
        (t) => t.tableAttributes.filter((ta) => ta.is_PK).length > 1
    );

    if (compositePKTables.length === 0) {
        summary['2nf'] = 'na';
    } else {
        for (const table of compositePKTables) {
            const pkSet = new Set(table.tableAttributes.filter((ta) => ta.is_PK).map((ta) => ta.attributeId));
            const nonKeySet = new Set(table.tableAttributes.filter((ta) => !ta.is_PK).map((ta) => ta.attributeId));
            const tableFDs = liveFDs.filter((fd) => getFDTable(fd)?.id === table.id);

            if (tableFDs.length === 0) {
                summary['2nf'] = worse(summary['2nf'], 'warning');
                continue;
            }

            for (const fd of tableFDs) {
                const startIds = fd.starts.map((s) => s.attributeId);
                const endIds = fd.ends.map((e) => e.attributeId);

                if (!startIds.some((id) => pkSet.has(id))) continue;

                const isProperSubset = startIds.every((id) => pkSet.has(id)) && startIds.length < pkSet.size;
                const endsNonKey = endIds.filter((id) => nonKeySet.has(id));

                if (isProperSubset && endsNonKey.length > 0) {
                    const startNames = startIds.map((id) => attrMap.get(id)?.name ?? id).join(', ');
                    const endNames = endsNonKey.map((id) => attrMap.get(id)?.name ?? id).join(', ');

                    const prev = fdIssues.get(fd.id) ?? [];
                    prev.push({ type: 'error', rule: '2NF', message: `Partial dependency: {${startNames}} → {${endNames}} — depends only on part of the primary key.` });
                    fdIssues.set(fd.id, prev);

                    summary['2nf'] = 'error';
                    summary['2nf_violations'].push({
                        tableId: table.id,
                        tableName: table.name,
                        fdId: fd.id,
                        partialKeyAttrs: startIds.map((id) => attrMap.get(id)?.name ?? id),
                        dependentAttrs: endsNonKey.map((id) => attrMap.get(id)?.name ?? id),
                    });
                }
            }
        }
    }

    // ── 3NF — transitive dependency detection ──────────────────────────────────

    // Only check tables that have at least one non-key attribute
    const relevant3Tables = tables.filter((t) => t.tableAttributes.some((ta) => !ta.is_PK));

    if (relevant3Tables.length === 0) {
        summary['3nf'] = 'na';
    } else {
        for (const table of relevant3Tables) {
            const nonKeySet = new Set(table.tableAttributes.filter((ta) => !ta.is_PK).map((ta) => ta.attributeId));
            const tableFDs = liveFDs.filter((fd) => getFDTable(fd)?.id === table.id);

            if (tableFDs.length === 0) {
                summary['3nf'] = worse(summary['3nf'], 'warning');
                continue;
            }

            for (const fd of tableFDs) {
                const startIds = fd.starts.map((s) => s.attributeId);
                const endIds = fd.ends.map((e) => e.attributeId);

                const allStartsNonKey = startIds.every((id) => nonKeySet.has(id));
                const someEndsNonKey = endIds.some((id) => nonKeySet.has(id));

                if (allStartsNonKey && someEndsNonKey) {
                    const startNames = startIds.map((id) => attrMap.get(id)?.name ?? id).join(', ');
                    const endNames = endIds.filter((id) => nonKeySet.has(id)).map((id) => attrMap.get(id)?.name ?? id).join(', ');

                    const prev = fdIssues.get(fd.id) ?? [];
                    prev.push({ type: 'error', rule: '3NF', message: `Transitive dependency: {${startNames}} → {${endNames}} — a non-key attribute determines another non-key attribute.` });
                    fdIssues.set(fd.id, prev);

                    summary['3nf'] = 'error';
                    summary['3nf_violations'].push({
                        tableId: table.id,
                        tableName: table.name,
                        fdId: fd.id,
                        determinantAttrs: startIds.map((id) => attrMap.get(id)?.name ?? id),
                        dependentAttrs: endIds.filter((id) => nonKeySet.has(id)).map((id) => attrMap.get(id)?.name ?? id),
                    });
                }
            }
        }
    }

    return { tableHeaderIssues, attrRowIssues, fdIssues, summary };
}

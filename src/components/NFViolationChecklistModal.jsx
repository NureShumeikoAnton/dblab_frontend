import { useEffect, useRef } from 'react';
import { STAGE_RULES } from '../config/normalizationConfig.js';
import './styles/NFViolationChecklistModal.css';

const STATUS_CONFIG = {
    pass:    { icon: '✓', label: 'Pass',    cls: 'pass'    },
    error:   { icon: '✕', label: 'Error',   cls: 'error'   },
    warning: { icon: '!', label: 'Warning', cls: 'warning' },
    na:      { icon: '—', label: 'N/A',     cls: 'na'      },
};

function StatusBadge({ status }) {
    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.na;
    return (
        <span className={`nf-badge nf-badge--${cfg.cls}`} title={cfg.label} aria-label={cfg.label}>
            {cfg.icon}
        </span>
    );
}

function RuleDetail({ autoKey, analysis }) {
    if (!analysis) return null;
    const { summary } = analysis;

    if (autoKey === 'missingPK') {
        if (summary.missingPK !== 'error') return null;
        return (
            <ul className="nf-rule__detail">
                {summary.missingPK_tables.map((t) => (
                    <li key={t.tableId}>Table <strong>{t.tableName}</strong> has no primary key</li>
                ))}
            </ul>
        );
    }

    if (autoKey === '1nf_plural') {
        if (summary['1nf_plural'] !== 'warning') return null;
        const seen = new Set();
        const unique = summary.plural_attrs.filter((a) => {
            if (seen.has(a.attributeId)) return false;
            seen.add(a.attributeId);
            return true;
        });
        return (
            <ul className="nf-rule__detail">
                {unique.map((a, i) => (
                    <li key={i}><strong>{a.name}</strong> in {a.tableName}</li>
                ))}
            </ul>
        );
    }

    if (autoKey === '1nf_atomic') {
        if (summary['1nf_atomic'] !== 'warning') return null;
        const seen = new Set();
        const unique = summary.atomic_attrs.filter((a) => {
            if (seen.has(a.attributeId)) return false;
            seen.add(a.attributeId);
            return true;
        });
        return (
            <ul className="nf-rule__detail">
                {unique.map((a, i) => (
                    <li key={i}><strong>{a.name}</strong> in {a.tableName}</li>
                ))}
            </ul>
        );
    }

    if (autoKey === '2nf') {
        const st = summary['2nf'];
        if (st === 'warning') {
            return <p className="nf-rule__detail-note">No FDs drawn for some composite-PK tables — draw FDs to enable 2NF verification.</p>;
        }
        if (st !== 'error') return null;
        return (
            <ul className="nf-rule__detail">
                {summary['2nf_violations'].map((v, i) => (
                    <li key={i}>
                        <strong>{v.tableName}</strong>:&nbsp;
                        {'{' + v.partialKeyAttrs.join(', ') + '}'}&nbsp;→&nbsp;
                        {'{' + v.dependentAttrs.join(', ') + '}'}
                        &nbsp;— partial dependency
                    </li>
                ))}
            </ul>
        );
    }

    if (autoKey === '3nf') {
        const st = summary['3nf'];
        if (st === 'warning') {
            return <p className="nf-rule__detail-note">No FDs drawn for some tables — draw FDs to enable 3NF verification.</p>;
        }
        if (st !== 'error') return null;
        return (
            <ul className="nf-rule__detail">
                {summary['3nf_violations'].map((v, i) => (
                    <li key={i}>
                        <strong>{v.tableName}</strong>:&nbsp;
                        {'{' + v.determinantAttrs.join(', ') + '}'}&nbsp;→&nbsp;
                        {'{' + v.dependentAttrs.join(', ') + '}'}
                        &nbsp;— transitive dependency
                    </li>
                ))}
            </ul>
        );
    }

    return null;
}

const NFViolationChecklistModal = ({ stageForm, violationChecks, analysis, onToggle, onClose, triggerRef }) => {
    const rules = STAGE_RULES[stageForm] ?? [];
    const ref = useRef(null);
    const summary = analysis?.summary ?? {};

    useEffect(() => {
        const handleMouseDown = (e) => {
            if (ref.current && !ref.current.contains(e.target) &&
                (!triggerRef?.current || !triggerRef.current.contains(e.target))) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleMouseDown);
        return () => document.removeEventListener('mousedown', handleMouseDown);
    }, [onClose, triggerRef]);

    const getAutoStatus = (autoKey) => {
        if (autoKey === 'missingPK') return summary.missingPK ?? 'na';
        return summary[autoKey] ?? 'na';
    };

    // Track which autoKeys have already had their detail section rendered
    const shownAutoKeys = new Set();

    return (
        <div className="nf-checklist" ref={ref} role="dialog" aria-label={`NF Rules — ${stageForm}`}>
            <div className="nf-checklist__header">
                <span className="nf-checklist__title">NF Rules — {stageForm}</span>
                <button className="nf-checklist__close" onClick={onClose} aria-label="Close">×</button>
            </div>
            <ul className="nf-checklist__rules">
                {rules.map((rule, i) => {
                    if (rule.type === 'manual') {
                        const checked = violationChecks[rule.checkIndex] ?? false;
                        return (
                            <li key={i} className="nf-rule nf-rule--manual">
                                <div className="nf-rule__label" onClick={() => onToggle(rule.checkIndex)}>
                                    <button
                                        type="button"
                                        className={`nf-rule__circle${checked ? ' nf-rule__circle--checked' : ''}`}
                                        aria-pressed={checked}
                                        aria-label={checked ? 'Mark as uncomplete' : 'Mark as complete'}
                                    />
                                    <span className="nf-rule__text">{rule.text}</span>
                                </div>
                            </li>
                        );
                    }

                    const status = getAutoStatus(rule.autoKey);
                    const isFirst = !shownAutoKeys.has(rule.autoKey);
                    shownAutoKeys.add(rule.autoKey);

                    return (
                        <li key={i} className={`nf-rule nf-rule--auto nf-rule--${status}`}>
                            <div className="nf-rule__label">
                                <StatusBadge status={status} />
                                <span className="nf-rule__text">{rule.text}</span>
                            </div>
                            {isFirst && <RuleDetail autoKey={rule.autoKey} analysis={analysis} />}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

export default NFViolationChecklistModal;

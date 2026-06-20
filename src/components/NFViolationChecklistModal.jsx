import { useEffect, useRef } from 'react';
import { STAGE_RULES } from '../config/normalizationConfig.js';
import './styles/NFViolationChecklistModal.css';

const STATUS_CONFIG = {
    pass:    { icon: '✓', label: 'Пройдено',      cls: 'pass'    },
    error:   { icon: '✕', label: 'Помилка',       cls: 'error'   },
    warning: { icon: '!', label: 'Попередження',  cls: 'warning' },
    na:      { icon: '—', label: 'Н/Д',           cls: 'na'      },
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
                    <li key={t.tableId}>Таблиця <strong>{t.tableName}</strong> не має первинного ключа</li>
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
                    <li key={i}><strong>{a.name}</strong> у {a.tableName}</li>
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
                    <li key={i}><strong>{a.name}</strong> у {a.tableName}</li>
                ))}
            </ul>
        );
    }

    if (autoKey === 'fds_present') {
        if (summary.fds_present !== 'warning') return null;
        return <p className="nf-rule__detail-note">Функціональні залежності ще не накреслені — використовуйте інструмент дужок ФЗ для позначення залежностей у кожній таблиці.</p>;
    }

    if (autoKey === '2nf') {
        const st = summary['2nf'];
        if (st === 'warning') {
            return <p className="nf-rule__detail-note">ФЗ не накреслені для деяких таблиць з композитним PK — намалюйте ФЗ для перевірки 2НФ.</p>;
        }
        if (st !== 'error') return null;
        return (
            <ul className="nf-rule__detail">
                {summary['2nf_violations'].map((v, i) => (
                    <li key={i}>
                        <strong>{v.tableName}</strong>:&nbsp;
                        {'{' + v.partialKeyAttrs.join(', ') + '}'}&nbsp;→&nbsp;
                        {'{' + v.dependentAttrs.join(', ') + '}'}
                        &nbsp;— часткова залежність
                    </li>
                ))}
            </ul>
        );
    }

    if (autoKey === '3nf') {
        const st = summary['3nf'];
        if (st === 'warning') {
            return <p className="nf-rule__detail-note">ФЗ не накреслені для деяких таблиць — намалюйте ФЗ для перевірки 3НФ.</p>;
        }
        if (st !== 'error') return null;
        return (
            <ul className="nf-rule__detail">
                {summary['3nf_violations'].map((v, i) => (
                    <li key={i}>
                        <strong>{v.tableName}</strong>:&nbsp;
                        {'{' + v.determinantAttrs.join(', ') + '}'}&nbsp;→&nbsp;
                        {'{' + v.dependentAttrs.join(', ') + '}'}
                        &nbsp;— транзитивна залежність
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
        <div className="nf-checklist" ref={ref} role="dialog" aria-label={`Правила НФ — ${stageForm}`}>
            <div className="nf-checklist__header">
                <span className="nf-checklist__title">Правила НФ — {stageForm}</span>
                <button className="nf-checklist__close" onClick={onClose} aria-label="Закрити">×</button>
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
                                        aria-label={checked ? 'Позначити як не завершено' : 'Позначити як завершено'}
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

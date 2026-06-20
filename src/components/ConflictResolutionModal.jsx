import React from 'react';
import './styles/ConflictResolutionModal.css';

const STAGE_LABELS = { '1NF': '1NF', 'FDs': 'FDs', '2NF': '2NF', '3NF': '3NF' };

const SummaryColumn = ({ title, summary, isLocal }) => {
    const date = isLocal && summary.lastSavedAt
        ? new Date(summary.lastSavedAt).toLocaleString()
        : null;

    return (
        <div className="crm-column">
            <div className="crm-column__header">{title}</div>
            {isLocal
                ? <div className="crm-column__date">Останнє збереження: {date ?? '—'}</div>
                : <div className="crm-column__date--placeholder" aria-hidden="true">placeholder</div>
            }
            <table className="crm-table">
                <tbody>
                    <tr>
                        <td className="crm-table__label">Атрибути</td>
                        <td className="crm-table__value">{summary.attrCount}</td>
                    </tr>
                    {summary.stages.map((s) => (
                        <tr key={s.form}>
                            <td className="crm-table__label">{STAGE_LABELS[s.form] ?? s.form}</td>
                            <td className="crm-table__value">
                                {s.tableCount} {s.tableCount === 1 ? 'таблиця' : s.tableCount < 5 ? 'таблиці' : 'таблиць'}
                                {s.fdCount > 0 && `, ${s.fdCount} ФЗ`}
                                {s.relCount > 0 && `, ${s.relCount} зв.`}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const ConflictResolutionModal = ({ serverSummary, localSummary, onUseServer, onUseLocal }) => (
    <div className="crm-overlay">
        <div className="crm-modal" role="dialog" aria-modal="true" aria-labelledby="crm-title">
            <div className="crm-modal__strip" />
            <div className="crm-modal__inner">
                <div className="crm-modal__head">
                    <h2 className="crm-modal__title" id="crm-title">Виявлено конфлікт даних</h2>
                    <p className="crm-modal__sub">
                        Ваші локальні дані відрізняються від збережених на сервері.
                        Оберіть версію для завантаження.
                    </p>
                </div>
                <div className="crm-columns">
                    <SummaryColumn title="Версія сервера" summary={serverSummary} isLocal={false} />
                    <div className="crm-divider" />
                    <SummaryColumn title="Локальна версія" summary={localSummary} isLocal={true} />
                </div>
                <div className="crm-actions">
                    <button className="crm-btn crm-btn--ghost" onClick={onUseServer}>
                        Використати версію сервера
                    </button>
                    <button className="crm-btn crm-btn--primary" onClick={onUseLocal}>
                        Використати локальну версію
                    </button>
                </div>
            </div>
        </div>
    </div>
);

export default ConflictResolutionModal;

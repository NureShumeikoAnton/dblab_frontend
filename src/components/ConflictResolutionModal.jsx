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
                ? <div className="crm-column__date">Last saved: {date ?? '—'}</div>
                : <div className="crm-column__date--placeholder" aria-hidden="true">placeholder</div>
            }
            <table className="crm-table">
                <tbody>
                    <tr>
                        <td className="crm-table__label">Attributes</td>
                        <td className="crm-table__value">{summary.attrCount}</td>
                    </tr>
                    {summary.stages.map((s) => (
                        <tr key={s.form}>
                            <td className="crm-table__label">{STAGE_LABELS[s.form] ?? s.form}</td>
                            <td className="crm-table__value">
                                {s.tableCount} {s.tableCount === 1 ? 'table' : 'tables'}
                                {s.fdCount > 0 && `, ${s.fdCount} FDs`}
                                {s.relCount > 0 && `, ${s.relCount} rels`}
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
                    <h2 className="crm-modal__title" id="crm-title">Data Conflict Detected</h2>
                    <p className="crm-modal__sub">
                        Your local data differs from what is stored on the server.
                        Choose which version to load.
                    </p>
                </div>
                <div className="crm-columns">
                    <SummaryColumn title="Server version" summary={serverSummary} isLocal={false} />
                    <div className="crm-divider" />
                    <SummaryColumn title="Local version" summary={localSummary} isLocal={true} />
                </div>
                <div className="crm-actions">
                    <button className="crm-btn crm-btn--ghost" onClick={onUseServer}>
                        Use server version
                    </button>
                    <button className="crm-btn crm-btn--primary" onClick={onUseLocal}>
                        Use local version
                    </button>
                </div>
            </div>
        </div>
    </div>
);

export default ConflictResolutionModal;

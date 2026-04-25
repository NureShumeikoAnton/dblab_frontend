import React from 'react';
import './styles/AttributeItem.css';

const IconEyeOpen = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
    </svg>
);

const IconEyeOff = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
);

const IconTrash = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
);

const AttributeItem = ({ attribute, isUnused, retireBlocked, onToggleRetire, onDelete }) => {
    const { name, data_type, isRetired } = attribute;

    const retireTitle = retireBlocked
        ? 'Used in a table at this or a later stage — remove from canvas first'
        : isRetired
            ? 'Show from this stage'
            : 'Hide from this stage';

    const handleDragStart = (e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('application/dblab-attribute', attribute.id);

        const ghost = document.createElement('div');
        ghost.style.cssText = [
            'position:fixed', 'top:-9999px', 'left:-9999px',
            'display:flex', 'align-items:center', 'gap:8px',
            'padding:7px 12px',
            'background:#eef6fb', 'border:1.5px solid #7ec8e3', 'border-radius:6px',
            'font-family:inherit', 'font-size:13px', 'font-weight:500', 'color:#1e293b',
            'pointer-events:none', 'box-shadow:0 4px 12px rgba(0,0,0,0.18)',
            'white-space:nowrap',
        ].join(';');
        ghost.textContent = name;

        const badge = document.createElement('span');
        badge.style.cssText = [
            'font-size:11px', 'font-weight:600', 'color:#2980B9',
            'background:#e8f4fb', 'padding:2px 6px', 'border-radius:4px',
        ].join(';');
        badge.textContent = data_type;
        ghost.appendChild(badge);

        document.body.appendChild(ghost);
        e.dataTransfer.setDragImage(ghost, ghost.offsetWidth / 2, ghost.offsetHeight / 2);
        setTimeout(() => document.body.removeChild(ghost), 0);
    };

    return (
        <div
            className={`attribute-item${isRetired ? ' attribute-item--retired' : ''}`}
            draggable={!isRetired}
            onDragStart={isRetired ? undefined : handleDragStart}
        >
            <span className="attribute-item__name">{name}</span>
            <div className="attribute-item__right">
                <span className="attribute-item__type">{data_type}</span>
                <div className="attribute-item__actions">
                    <button
                        className={`attribute-item__action-btn${isRetired ? ' attribute-item__action-btn--muted' : ''}${retireBlocked ? ' attribute-item__action-btn--disabled' : ''}`}
                        title={retireTitle}
                        onClick={retireBlocked ? undefined : onToggleRetire}
                        disabled={retireBlocked}
                    >
                        {isRetired ? <IconEyeOff /> : <IconEyeOpen />}
                    </button>
                    {isUnused && (
                        <button
                            className="attribute-item__action-btn attribute-item__action-btn--danger"
                            title="Delete attribute"
                            onClick={onDelete}
                        >
                            <IconTrash />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AttributeItem;

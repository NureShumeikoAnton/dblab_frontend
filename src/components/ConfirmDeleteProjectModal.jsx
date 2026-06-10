import React from 'react';
import './styles/ConfirmDeleteProjectModal.css';

const ConfirmDeleteProjectModal = ({ projectName, onConfirm, onCancel, isDeleting = false, error = null }) => {
    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget && !isDeleting) onCancel();
    };

    return (
        <div className="cdp-overlay" onClick={handleOverlayClick}>
            <div className="cdp-modal" role="dialog" aria-modal="true" aria-labelledby="cdp-title">
                <div className="cdp-modal__strip" />
                <div className="cdp-modal__inner">
                    <h2 className="cdp-modal__title" id="cdp-title">Delete project?</h2>
                    <p className="cdp-modal__text">
                        This will permanently delete <strong>“{projectName}”</strong> with
                        all its stages, tables, attributes and dependencies.
                        This action cannot be undone.
                    </p>
                    {error && <div className="cdp-error" role="alert">{error}</div>}
                    <div className="cdp-actions">
                        <button
                            type="button"
                            className="cdp-btn cdp-btn--ghost"
                            onClick={onCancel}
                            disabled={isDeleting}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="cdp-btn cdp-btn--danger"
                            onClick={onConfirm}
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Deleting…' : 'Delete project'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDeleteProjectModal;

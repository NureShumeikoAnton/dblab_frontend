import React from 'react';
import './styles/SessionExpiredModal.css';

const SessionExpiredModal = ({ onLogin, onContinue }) => (
    <div className="sem-overlay">
        <div className="sem-modal" role="dialog" aria-modal="true" aria-labelledby="sem-title">
            <div className="sem-modal__strip" />
            <div className="sem-modal__inner">
                <h2 className="sem-modal__title" id="sem-title">Session expired</h2>
                <p className="sem-modal__text">
                    Your login session has expired, so changes can no longer be saved
                    to the server. Your work is still being saved locally in this
                    browser and will sync once you log in again.
                </p>
                <div className="sem-actions">
                    <button type="button" className="sem-btn sem-btn--ghost" onClick={onContinue}>
                        Continue working offline
                    </button>
                    <button type="button" className="sem-btn sem-btn--primary" onClick={onLogin}>
                        Log in again
                    </button>
                </div>
            </div>
        </div>
    </div>
);

export default SessionExpiredModal;

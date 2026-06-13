import React from 'react';
import './styles/EditorLoadingOverlay.css';

const EditorLoadingOverlay = () => (
    <div className="elo-overlay" role="status" aria-live="polite">
        <div className="elo-spinner" aria-hidden="true" />
        <span className="elo-text">Завантаження проекту…</span>
    </div>
);

export default EditorLoadingOverlay;

import React from 'react';
import './styles/StageButton.css';

const StageButton = ({ label, isActive, onClick }) => {
    return (
        <button
            className={`stage-button${isActive ? ' stage-button--active' : ''}`}
            onClick={onClick}
        >
            {label}
            {/* Completion dot — hidden until Phase 12/15 wires it up */}
            <span className="stage-button__dot" aria-hidden="true" />
        </button>
    );
};

export default StageButton;

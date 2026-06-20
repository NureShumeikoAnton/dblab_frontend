import React from 'react';
import './styles/StageButton.css';

const StageButton = ({ label, isActive, isComplete, onClick }) => {
    return (
        <button
            className={`stage-button${isActive ? ' stage-button--active' : ''}${isComplete ? ' stage-button--complete' : ''}`}
            onClick={onClick}
        >
            {label}
            <span className="stage-button__dot" aria-hidden="true" />
        </button>
    );
};

export default StageButton;

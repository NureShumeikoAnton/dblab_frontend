import React from 'react';
import StageButton from './StageButton.jsx';
import './styles/StageBar.css';

const STAGES = ['0NF', '1NF', '2NF', '3NF'];

const StageBar = ({ currentStageIndex, onStageChange }) => {
    return (
        <div className="stage-bar">
            <div className="stage-bar__stages">
                {STAGES.map((label, index) => (
                    <StageButton
                        key={label}
                        label={label}
                        isActive={currentStageIndex === index}
                        onClick={() => onStageChange(index)}
                    />
                ))}
            </div>
            <button className="stage-bar__check-btn" disabled>
                ✓ Check NF Rules
            </button>
        </div>
    );
};

export default StageBar;

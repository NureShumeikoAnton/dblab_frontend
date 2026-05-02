import { useState, useRef } from 'react';
import StageButton from './StageButton.jsx';
import NFViolationChecklistModal from './NFViolationChecklistModal.jsx';
import useEditorStore from '../store/editorStore.js';
import { useNFAnalysis } from '../hooks/useNFAnalysis.jsx';
import './styles/StageBar.css';

const STAGES = ['0NF', '1NF', '2NF', '3NF'];

const StageBar = ({ currentStageIndex, onStageChange }) => {
    const [showChecklist, setShowChecklist] = useState(false);
    const btnRef = useRef(null);

    const stages = useEditorStore((s) => s.stages);
    const isStageComplete = useEditorStore((s) => s.isStageComplete);
    const toggleViolationCheck = useEditorStore((s) => s.toggleViolationCheck);
    const analysis = useNFAnalysis();

    return (
        <div className="stage-bar">
            <div className="stage-bar__stages">
                {STAGES.map((label, index) => (
                    <StageButton
                        key={label}
                        label={label}
                        isActive={currentStageIndex === index}
                        isComplete={isStageComplete(index)}
                        onClick={() => onStageChange(index)}
                    />
                ))}
            </div>
            <div className="stage-bar__check-wrap">
                <button
                    ref={btnRef}
                    className="stage-bar__check-btn"
                    onClick={() => setShowChecklist((v) => !v)}
                >
                    ✓ Check NF Rules
                </button>
                {showChecklist && (
                    <NFViolationChecklistModal
                        stageForm={stages[currentStageIndex].form}
                        violationChecks={stages[currentStageIndex].violationChecks}
                        analysis={analysis}
                        onToggle={(i) => toggleViolationCheck(currentStageIndex, i)}
                        onClose={() => setShowChecklist(false)}
                        triggerRef={btnRef}
                    />
                )}
            </div>
        </div>
    );
};

export default StageBar;

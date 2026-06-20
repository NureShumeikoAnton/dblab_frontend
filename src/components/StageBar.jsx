import { useState, useRef, useMemo } from 'react';
import StageButton from './StageButton.jsx';
import NFViolationChecklistModal from './NFViolationChecklistModal.jsx';
import ConfirmResetModal from './ConfirmResetModal.jsx';
import UnusedAttrsWarningModal from './UnusedAttrsWarningModal.jsx';
import useEditorStore from '../store/editorStore.js';
import { useNFAnalysis, useNFAnalysisTrigger } from '../hooks/useNFAnalysis.jsx';
import './styles/StageBar.css';

const STAGES = ['1НФ', 'ФЗ', '2НФ', '3НФ'];

const StageBar = ({ currentStageIndex, onStageChange }) => {
    const [showChecklist, setShowChecklist] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [showUnusedWarning, setShowUnusedWarning] = useState(false);
    const btnRef = useRef(null);

    const stages = useEditorStore((s) => s.stages);
    const attributePool = useEditorStore((s) => s.attributePool);
    const isStageComplete = useEditorStore((s) => s.isStageComplete);
    const toggleViolationCheck = useEditorStore((s) => s.toggleViolationCheck);
    const resetStage = useEditorStore((s) => s.resetStage);
    const analysis = useNFAnalysis();
    const triggerCheck = useNFAnalysisTrigger();

    const unusedActiveCount = useMemo(() => {
        const placedInStage = new Set(
            stages[currentStageIndex]?.tables.flatMap((t) =>
                t.tableAttributes.map((ta) => ta.attributeId)
            ) ?? []
        );
        return attributePool.filter(
            (attr) => attr.retired_at_stage_Id === null && !placedInStage.has(attr.id)
        ).length;
    }, [attributePool, stages, currentStageIndex]);

    const handleStageChange = (index) => {
        if (index > currentStageIndex && unusedActiveCount > 0) {
            setShowUnusedWarning(true);
            return;
        }
        onStageChange(index);
    };

    return (
        <div className="stage-bar">
            <div className="stage-bar__stages">
                {STAGES.map((label, index) => (
                    <StageButton
                        key={label}
                        label={label}
                        isActive={currentStageIndex === index}
                        isComplete={isStageComplete(index)}
                        onClick={() => handleStageChange(index)}
                    />
                ))}
            </div>
            <div className="stage-bar__actions">
                <button
                    className="stage-bar__reset-btn"
                    onClick={() => setShowResetConfirm(true)}
                >
                    ↺ Скинути етап
                </button>
                {showResetConfirm && (
                    <ConfirmResetModal
                        stageLabel={STAGES[currentStageIndex]}
                        onConfirm={() => {
                            resetStage(currentStageIndex);
                            setShowResetConfirm(false);
                        }}
                        onCancel={() => setShowResetConfirm(false)}
                    />
                )}
                <div className="stage-bar__check-wrap">
                <button
                    ref={btnRef}
                    className="stage-bar__check-btn"
                    onClick={() => {
                        if (!showChecklist) triggerCheck?.();
                        setShowChecklist((v) => !v);
                    }}
                >
                    ✓ Перевірити правила НФ
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
            {showUnusedWarning && (
                <UnusedAttrsWarningModal
                    count={unusedActiveCount}
                    onClose={() => setShowUnusedWarning(false)}
                />
            )}
        </div>
    );
};

export default StageBar;

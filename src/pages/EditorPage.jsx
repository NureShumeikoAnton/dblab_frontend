import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import useEditorStore from '../store/editorStore.js';
import EditorToolbar from '../components/EditorToolbar.jsx';
import EditorCanvas from '../components/EditorCanvas.jsx';
import AttributePanel from '../components/AttributePanel.jsx';
import StageBar from '../components/StageBar.jsx';
import StageInitDialog from '../components/StageInitDialog.jsx';
import { NFAnalysisProvider } from '../hooks/useNFAnalysis.jsx';
import './styles/EditorPage.css';

const AUTOSAVE_INTERVAL_MS = 30_000;
const STAGE_LABELS = ['1NF', 'FDs', '2NF', '3NF'];

const EditorPage = () => {
    const { projectId } = useParams();

    const loadMockData = useEditorStore((s) => s.loadMockData);
    const loadEmptyMockData = useEditorStore((s) => s.loadEmptyMockData);
    const loadLocalState = useEditorStore((s) => s.loadLocalState);
    const projectName = useEditorStore((s) => s.project.name);
    const currentStageIndex = useEditorStore((s) => s.currentStageIndex);
    const setCurrentStageIndex = useEditorStore((s) => s.setCurrentStageIndex);
    const stages = useEditorStore((s) => s.stages);
    const initializeStageEmpty = useEditorStore((s) => s.initializeStageEmpty);
    const initializeStageCopyFromPrevious = useEditorStore((s) => s.initializeStageCopyFromPrevious);

    useEffect(() => {
        if (projectId === '2') {
            loadEmptyMockData();
        } else {
            loadMockData();
        }
        // Restore positions + violationChecks from localStorage after mock data loads.
        // loadLocalState reads project.id from the store — must be called after load.
        loadLocalState();
    }, [projectId]);

    // Autosave every 30s when there are unsaved changes
    useEffect(() => {
        const interval = setInterval(() => {
            const { ui, saveProject } = useEditorStore.getState();
            if (ui.hasUnsavedChanges && !ui.isSaving) {
                console.log('[editor] autosave…');
                saveProject(null);
            }
        }, AUTOSAVE_INTERVAL_MS);
        return () => clearInterval(interval);
    }, []);

    const isUninitialized = !stages[currentStageIndex].initialized;
    const stageLabel = STAGE_LABELS[currentStageIndex];
    const prevStageLabel = currentStageIndex > 0 ? STAGE_LABELS[currentStageIndex - 1] : null;

    return (
        <div className="editor-page">
            <NFAnalysisProvider key={currentStageIndex} stageIndex={currentStageIndex}>
                <EditorToolbar projectName={projectName} />
                <div className="editor-page__main">
                    <EditorCanvas />
                    <AttributePanel />
                </div>
                <StageBar
                    currentStageIndex={currentStageIndex}
                    onStageChange={setCurrentStageIndex}
                />
                {isUninitialized && (
                    <StageInitDialog
                        stageLabel={stageLabel}
                        prevStageLabel={prevStageLabel}
                        onStartEmpty={() => initializeStageEmpty(currentStageIndex)}
                        onCopyFromPrevious={() => initializeStageCopyFromPrevious(currentStageIndex)}
                    />
                )}
            </NFAnalysisProvider>
        </div>
    );
};

export default EditorPage;

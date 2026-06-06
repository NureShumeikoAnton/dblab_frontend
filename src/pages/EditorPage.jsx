import React, { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import useAuthHeader from 'react-auth-kit/hooks/useAuthHeader';
import useEditorStore from '../store/editorStore.js';
import EditorToolbar from '../components/EditorToolbar.jsx';
import EditorCanvas from '../components/EditorCanvas.jsx';
import AttributePanel from '../components/AttributePanel.jsx';
import StageBar from '../components/StageBar.jsx';
import StageInitDialog from '../components/StageInitDialog.jsx';
import { NFAnalysisProvider } from '../hooks/useNFAnalysis.jsx';
import API_CONFIG from '../config/api.js';
import { loadFromLocal } from '../utils/serializer.js';
import './styles/EditorPage.css';

const AUTOSAVE_INTERVAL_MS = 30_000;
const STAGE_LABELS = ['1NF', 'FDs', '2NF', '3NF'];

// Project IDs that trigger mock data instead of a real API fetch
const MOCK_IDS = new Set(['mock', '1']);

const EditorPage = () => {
    const { projectId } = useParams();
    const authHeader = useAuthHeader();
    const authHeaderRef = useRef(authHeader);
    authHeaderRef.current = authHeader;

    const loadMockData = useEditorStore((s) => s.loadMockData);
    const loadEmptyMockData = useEditorStore((s) => s.loadEmptyMockData);
    const loadLocalState = useEditorStore((s) => s.loadLocalState);
    const loadProject = useEditorStore((s) => s.loadProject);
    const projectName = useEditorStore((s) => s.project.name);
    const currentStageIndex = useEditorStore((s) => s.currentStageIndex);
    const setCurrentStageIndex = useEditorStore((s) => s.setCurrentStageIndex);
    const stages = useEditorStore((s) => s.stages);
    const initializeStageEmpty = useEditorStore((s) => s.initializeStageEmpty);
    const initializeStageCopyFromPrevious = useEditorStore((s) => s.initializeStageCopyFromPrevious);

    useEffect(() => {
        if (projectId === '2') {
            loadEmptyMockData();
            loadLocalState();
        } else if (!projectId || MOCK_IDS.has(projectId)) {
            loadMockData();
            loadLocalState();
        } else {
            const token = authHeader?.split(' ')[1] ?? null;
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            fetch(`${API_CONFIG.BASE_URL}/project/${projectId}`, { headers })
                .then((r) => {
                    if (!r.ok) throw new Error(`HTTP ${r.status}`);
                    return r.json();
                })
                .then((data) => {
                    loadProject(data, loadFromLocal(projectId));
                })
                .catch((err) => {
                    console.error('[editor] load failed', err);
                });
        }
    }, [projectId]);

    // Autosave every 30s — uses ref so the interval always has the latest token
    useEffect(() => {
        const interval = setInterval(() => {
            const { ui, saveProject } = useEditorStore.getState();
            if (ui.hasUnsavedChanges && !ui.isSaving) {
                console.log('[editor] autosave…');
                const token = authHeaderRef.current?.split(' ')[1] ?? null;
                saveProject(token);
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

import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import useAuthHeader from 'react-auth-kit/hooks/useAuthHeader';
import useEditorStore from '../store/editorStore.js';
import EditorToolbar from '../components/EditorToolbar.jsx';
import EditorCanvas from '../components/EditorCanvas.jsx';
import AttributePanel from '../components/AttributePanel.jsx';
import StageBar from '../components/StageBar.jsx';
import StageInitDialog from '../components/StageInitDialog.jsx';
import ConflictResolutionModal from '../components/ConflictResolutionModal.jsx';
import { NFAnalysisProvider } from '../hooks/useNFAnalysis.jsx';
import API_CONFIG from '../config/api.js';
import { loadFromLocal, deserializeFromAPI, compareStructural } from '../utils/serializer.js';
import './styles/EditorPage.css';

const AUTOSAVE_INTERVAL_MS = 30_000;
const STAGE_LABELS = ['1NF', 'FDs', '2NF', '3NF'];

const EditorPage = () => {
    const { projectId } = useParams();
    const authHeader = useAuthHeader();
    const authHeaderRef = useRef(authHeader);
    authHeaderRef.current = authHeader;

    const [conflictData, setConflictData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadProject = useEditorStore((s) => s.loadProject);
    const loadFromLocalSnapshot = useEditorStore((s) => s.loadFromLocalSnapshot);
    const setLastSaveError = useEditorStore((s) => s.setLastSaveError);
    const projectName = useEditorStore((s) => s.project.name);
    const currentStageIndex = useEditorStore((s) => s.currentStageIndex);
    const setCurrentStageIndex = useEditorStore((s) => s.setCurrentStageIndex);
    const stages = useEditorStore((s) => s.stages);
    const initializeStageEmpty = useEditorStore((s) => s.initializeStageEmpty);
    const initializeStageCopyFromPrevious = useEditorStore((s) => s.initializeStageCopyFromPrevious);

    useEffect(() => {
        const token = authHeader?.split(' ')[1] ?? null;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const localData = loadFromLocal(projectId);

        fetch(`${API_CONFIG.BASE_URL}/project/${projectId}`, { headers })
            .then((r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then((rawApiData) => {
                const serverDeserialized = deserializeFromAPI(rawApiData);
                const { hasConflict, serverSummary, localSummary } =
                    compareStructural(serverDeserialized, localData);

                if (hasConflict) {
                    setConflictData({ rawApiData, localData, serverSummary, localSummary });
                } else {
                    loadProject(rawApiData, localData);
                }
                setIsLoading(false);
            })
            .catch((err) => {
                console.error('[editor] load failed', err);
                if (localData?.snapshot) {
                    loadFromLocalSnapshot(localData, projectId);
                    setLastSaveError('Server unavailable — loaded from local cache');
                } else {
                    setLastSaveError(`Failed to load project: ${err.message}`);
                }
                setIsLoading(false);
            });
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
                {!isLoading && isUninitialized && (
                    <StageInitDialog
                        stageLabel={stageLabel}
                        prevStageLabel={prevStageLabel}
                        onStartEmpty={() => initializeStageEmpty(currentStageIndex)}
                        onCopyFromPrevious={() => initializeStageCopyFromPrevious(currentStageIndex)}
                    />
                )}
                {conflictData && (
                    <ConflictResolutionModal
                        serverSummary={conflictData.serverSummary}
                        localSummary={conflictData.localSummary}
                        onUseServer={() => {
                            loadProject(conflictData.rawApiData, conflictData.localData);
                            setConflictData(null);
                        }}
                        onUseLocal={() => {
                            loadProject(conflictData.rawApiData, null);
                            loadFromLocalSnapshot(conflictData.localData);
                            setConflictData(null);
                        }}
                    />
                )}
            </NFAnalysisProvider>
        </div>
    );
};

export default EditorPage;

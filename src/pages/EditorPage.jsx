import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import useEditorStore from '../store/editorStore.js';
import EditorToolbar from '../components/EditorToolbar.jsx';
import EditorCanvas from '../components/EditorCanvas.jsx';
import AttributePanel from '../components/AttributePanel.jsx';
import StageBar from '../components/StageBar.jsx';
import './styles/EditorPage.css';

const EditorPage = () => {
    const { projectId } = useParams();

    const loadMockData = useEditorStore((s) => s.loadMockData);
    const projectName = useEditorStore((s) => s.project.name);
    const currentStageIndex = useEditorStore((s) => s.currentStageIndex);
    const setCurrentStageIndex = useEditorStore((s) => s.setCurrentStageIndex);
    const visibleAttributes = useEditorStore((s) => s.visibleAttributes);

    useEffect(() => {
        loadMockData();
    }, [projectId]);

    const attributes = visibleAttributes(currentStageIndex);

    return (
        <div className="editor-page">
            <EditorToolbar projectName={projectName} />
            <div className="editor-page__main">
                <EditorCanvas />
                <AttributePanel attributes={attributes} />
            </div>
            <StageBar
                currentStageIndex={currentStageIndex}
                onStageChange={setCurrentStageIndex}
            />
        </div>
    );
};

export default EditorPage;

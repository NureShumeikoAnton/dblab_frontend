import React from 'react';
import useEditorStore from '../store/editorStore.js';
import './styles/SaveStatus.css';

const SaveStatus = () => {
    const hasUnsavedChanges = useEditorStore((s) => s.ui.hasUnsavedChanges);

    return hasUnsavedChanges ? (
        <span className="save-status save-status--unsaved">● Unsaved</span>
    ) : (
        <span className="save-status save-status--saved">✓ Saved</span>
    );
};

export default SaveStatus;

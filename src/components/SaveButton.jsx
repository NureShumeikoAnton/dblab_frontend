import React from 'react';
import useEditorStore from '../store/editorStore.js';
import './styles/SaveButton.css';

const SaveButton = () => {
    const hasUnsavedChanges = useEditorStore((s) => s.ui.hasUnsavedChanges);
    const isSaving = useEditorStore((s) => s.ui.isSaving);

    return (
        <button className="save-button" disabled>
            Save
            {/* Unsaved dot — visible in Phase 16 when save is wired up */}
            {hasUnsavedChanges && !isSaving && (
                <span className="save-button__dot" title="Unsaved changes" aria-label="Unsaved changes" />
            )}
        </button>
    );
};

export default SaveButton;

import useAuthHeader from 'react-auth-kit/hooks/useAuthHeader';
import useEditorStore from '../store/editorStore.js';
import './styles/SaveButton.css';

const SaveButton = () => {
    const hasUnsavedChanges = useEditorStore((s) => s.ui.hasUnsavedChanges);
    const isSaving = useEditorStore((s) => s.ui.isSaving);
    const saveProject = useEditorStore((s) => s.saveProject);
    const authHeader = useAuthHeader();

    const handleSave = () => {
        const token = authHeader?.split(' ')[1] ?? null;
        saveProject(token);
    };

    return (
        <button
            className="save-button"
            onClick={handleSave}
            disabled={isSaving}
            title={isSaving ? 'Збереження…' : hasUnsavedChanges ? 'Зберегти зміни' : 'Немає незбережених змін'}
        >
            {isSaving ? 'Збереження…' : 'Зберегти'}
            {hasUnsavedChanges && !isSaving && (
                <span className="save-button__dot" title="Незбережені зміни" aria-label="Незбережені зміни" />
            )}
        </button>
    );
};

export default SaveButton;

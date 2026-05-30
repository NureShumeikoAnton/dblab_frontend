import useEditorStore from '../store/editorStore.js';
import './styles/SaveStatus.css';

const SaveStatus = () => {
    const isLocalSaved = useEditorStore((s) => s.ui.isLocalSaved);
    const isServerSaved = useEditorStore((s) => s.ui.isServerSaved);
    const projectId = useEditorStore((s) => s.project.id);

    return (
        <div className="save-status">
            <span className={`save-status__badge ${isLocalSaved ? 'save-status__badge--saved' : 'save-status__badge--unsaved'}`}>
                {isLocalSaved ? '✓' : '●'} Local
            </span>
            {projectId && (
                <span className={`save-status__badge ${isServerSaved ? 'save-status__badge--saved' : 'save-status__badge--unsaved'}`}>
                    {isServerSaved ? '✓' : '●'} Server
                </span>
            )}
        </div>
    );
};

export default SaveStatus;

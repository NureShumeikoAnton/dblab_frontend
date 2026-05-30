import useEditorStore from '../store/editorStore.js';
import SaveButton from './SaveButton.jsx';
import ShowFDsToggle from './ShowFDsToggle.jsx';
import TableToolbar from './TableToolbar.jsx';
import AttributeRowToolbar from './AttributeRowToolbar.jsx';
import FDToolbar from './FDToolbar.jsx';
import RelationshipToolbar from './RelationshipToolbar.jsx';
import './styles/EditorToolbar.css';

const EditorToolbar = ({ projectName }) => {
    const selectedTableId = useEditorStore((s) => s.ui.selectedTableId);
    const selectedTableAttribute = useEditorStore((s) => s.ui.selectedTableAttribute);
    const selectedFDId = useEditorStore((s) => s.ui.selectedFDId);
    const selectedRelationshipId = useEditorStore((s) => s.ui.selectedRelationshipId);
    const lastSaveError = useEditorStore((s) => s.ui.lastSaveError);

    return (
        <div className="editor-toolbar">
            <span className="editor-toolbar__title">{projectName}</span>
            {selectedTableAttribute && <AttributeRowToolbar />}
            {!selectedTableAttribute && selectedTableId && <TableToolbar />}
            {!selectedTableAttribute && !selectedTableId && selectedFDId && <FDToolbar />}
            {!selectedTableAttribute && !selectedTableId && !selectedFDId && selectedRelationshipId && <RelationshipToolbar />}
            <div className="editor-toolbar__actions">
                {lastSaveError && (
                    <span className="editor-toolbar__save-error" title={lastSaveError}>
                        Autosave failed — click Save to retry
                    </span>
                )}
                <ShowFDsToggle />
                <SaveButton />
            </div>
        </div>
    );
};

export default EditorToolbar;

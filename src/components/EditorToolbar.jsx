import useEditorStore from '../store/editorStore.js';
import SaveButton from './SaveButton.jsx';
import ShowFDsToggle from './ShowFDsToggle.jsx';
import TableToolbar from './TableToolbar.jsx';
import './styles/EditorToolbar.css';

const EditorToolbar = ({ projectName }) => {
    const selectedTableId = useEditorStore((s) => s.ui.selectedTableId);

    return (
        <div className="editor-toolbar">
            <span className="editor-toolbar__title">{projectName}</span>
            {selectedTableId && <TableToolbar />}
            <div className="editor-toolbar__actions">
                <ShowFDsToggle />
                <SaveButton />
            </div>
        </div>
    );
};

export default EditorToolbar;

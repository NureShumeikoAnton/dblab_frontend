import useEditorStore from '../store/editorStore.js';
import SaveButton from './SaveButton.jsx';
import ShowFDsToggle from './ShowFDsToggle.jsx';
import TableToolbar from './TableToolbar.jsx';
import AttributeRowToolbar from './AttributeRowToolbar.jsx';
import FDToolbar from './FDToolbar.jsx';
import './styles/EditorToolbar.css';

const EditorToolbar = ({ projectName }) => {
    const selectedTableId = useEditorStore((s) => s.ui.selectedTableId);
    const selectedTableAttribute = useEditorStore((s) => s.ui.selectedTableAttribute);
    const selectedFDId = useEditorStore((s) => s.ui.selectedFDId);

    return (
        <div className="editor-toolbar">
            <span className="editor-toolbar__title">{projectName}</span>
            {selectedTableAttribute && <AttributeRowToolbar />}
            {!selectedTableAttribute && selectedTableId && <TableToolbar />}
            {!selectedTableAttribute && !selectedTableId && selectedFDId && <FDToolbar />}
            <div className="editor-toolbar__actions">
                <ShowFDsToggle />
                <SaveButton />
            </div>
        </div>
    );
};

export default EditorToolbar;

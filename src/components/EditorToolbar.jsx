import React from 'react';
import SaveButton from './SaveButton.jsx';
import ShowFDsToggle from './ShowFDsToggle.jsx';
import './styles/EditorToolbar.css';

const EditorToolbar = ({ projectName }) => {
    return (
        <div className="editor-toolbar">
            <span className="editor-toolbar__title">{projectName}</span>
            <div className="editor-toolbar__actions">
                <ShowFDsToggle />
                <SaveButton />
            </div>
        </div>
    );
};

export default EditorToolbar;

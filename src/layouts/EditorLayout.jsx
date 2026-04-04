import { Outlet } from 'react-router-dom';
import EditorHeader from '../components/EditorHeader.jsx';
import './styles/EditorLayout.css';

const EditorLayout = () => {
    return (
        <div className="editor-layout">
            <EditorHeader />
            <div className="editor-layout__body">
                <Outlet />
            </div>
        </div>
    );
};

export default EditorLayout;

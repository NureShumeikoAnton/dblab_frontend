import useEditorStore from '../store/editorStore.js';
import './styles/ShowFDsToggle.css';

const ShowFDsToggle = () => {
    const showFDs = useEditorStore((s) => s.ui.showFDs);
    const toggleShowFDs = useEditorStore((s) => s.toggleShowFDs);

    return (
        <button
            className={`show-fds-toggle${showFDs ? ' show-fds-toggle--active' : ''}`}
            onClick={toggleShowFDs}
        >
            Show FDs
        </button>
    );
};

export default ShowFDsToggle;

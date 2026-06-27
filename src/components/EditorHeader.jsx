import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Undo2, Redo2 } from 'lucide-react';
import { useStore } from 'zustand';
import useAuthUser from 'react-auth-kit/hooks/useAuthUser';
import useEditorStore from '../store/editorStore.js';
import WorkingTimer from './WorkingTimer.jsx';
import SaveStatus from './SaveStatus.jsx';
import './styles/EditorHeader.css';

const EditorHeader = () => {
    const navigate = useNavigate();
    const authUser = useAuthUser();
    const username = authUser ? authUser.username : null;

    const flagUnsaved = useEditorStore(s => s.flagUnsaved);
    const canUndo = useStore(useEditorStore.temporal, s => s.pastStates.length > 0);
    const canRedo = useStore(useEditorStore.temporal, s => s.futureStates.length > 0);

    const handleUndo = () => {
        useEditorStore.temporal.getState().undo();
        flagUnsaved();
    };

    const handleRedo = () => {
        useEditorStore.temporal.getState().redo();
        flagUnsaved();
    };

    return (
        <div className="editor-header">
            <div className="editor-header__left">
                {/* TODO: replace ArrowLeft with custom SVG when assets are ready */}
                <button
                    className="editor-header__back"
                    onClick={() => navigate('/projects')}
                    title="На головну сторінку"
                    aria-label="На головну сторінку"
                >
                    <ArrowLeft size={14} />
                    <span>На головну</span>
                </button>
                <span className="editor-header__divider" />
                <button
                    className="editor-header__history-btn"
                    onClick={handleUndo}
                    disabled={!canUndo}
                    title="Скасувати (Ctrl+Z)"
                    aria-label="Скасувати"
                >
                    <Undo2 size={14} />
                </button>
                <button
                    className="editor-header__history-btn"
                    onClick={handleRedo}
                    disabled={!canRedo}
                    title="Повторити (Ctrl+Shift+Z)"
                    aria-label="Повторити"
                >
                    <Redo2 size={14} />
                </button>
            </div>

            <div className="editor-header__center">
                <WorkingTimer />
            </div>

            <div className="editor-header__right">
                <SaveStatus />
                {username && (
                    <>
                        <span className="editor-header__divider" />
                        <div className="editor-header__user">
                            <User size={12} />
                            <span className="editor-header__username">{username}</span>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default EditorHeader;

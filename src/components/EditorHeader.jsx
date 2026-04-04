import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User } from 'lucide-react';
import useAuthUser from 'react-auth-kit/hooks/useAuthUser';
import WorkingTimer from './WorkingTimer.jsx';
import SaveStatus from './SaveStatus.jsx';
import './styles/EditorHeader.css';

const EditorHeader = () => {
    const navigate = useNavigate();
    const authUser = useAuthUser();
    const username = authUser ? authUser.username : null;

    return (
        <div className="editor-header">
            <div className="editor-header__left">
                {/* TODO: replace ArrowLeft with custom SVG when assets are ready */}
                <button
                    className="editor-header__back"
                    onClick={() => navigate('/projects')}
                    title="Back to projects"
                    aria-label="Back to projects"
                >
                    <ArrowLeft size={14} />
                    <span>Back</span>
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

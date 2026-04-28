import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import useAuthUser from 'react-auth-kit/hooks/useAuthUser';
import dayjs from 'dayjs';
import { MOCK_PROJECTS, MOCK_PROJECT_COMMENTS } from '../mocks/expertiseMockData.js';
import { CommentInput, CommentThread, pushComment } from '../components/ProjectComments.jsx';
import './styles/ClientPages.css';
import './styles/ExpertiseProjectPage.css';

// Collects all descendants of a given comment ID from a flat array
function collectSubtree(allComments, rootId) {
    const result = [];
    const queue = [rootId];
    while (queue.length) {
        const id = queue.shift();
        const children = allComments.filter(c => c.reply_to_Id === id);
        children.forEach(c => {
            result.push(c);
            queue.push(c.project_comment_Id);
        });
    }
    return result;
}

const ExpertiseThreadPage = () => {
    const { projectId, commentId } = useParams();
    const navigate = useNavigate();
    const authUser = useAuthUser();

    const project = MOCK_PROJECTS.find(p => p.project_Id === parseInt(projectId));
    const rootComment = MOCK_PROJECT_COMMENTS.find(
        c => String(c.project_comment_Id) === commentId
    );

    const [allComments, setAllComments] = useState(() =>
        rootComment ? collectSubtree(MOCK_PROJECT_COMMENTS, rootComment.project_comment_Id) : []
    );

    if (!project || !rootComment) {
        return (
            <div className="client-page">
                <p className="expertise-empty">Коментар не знайдено.</p>
                <button className="cancel-btn-text" onClick={() => navigate(`/expertise/${projectId}`)}>
                    <ArrowLeft size={16} /> Назад до проєкту
                </button>
            </div>
        );
    }

    const addComment = (text, replyToId) => {
        const c = pushComment(
            text,
            parseInt(projectId),
            rootComment.expertise_Id,
            authUser?.user_Id ?? null,
            authUser?.username ?? 'Анонім',
            replyToId
        );
        setAllComments(prev => [...prev, c]);
    };

    const handleSaveEdit = (id, newText) => {
        setAllComments(prev => prev.map(c => c.project_comment_Id === id ? { ...c, text: newText } : c));
        const idx = MOCK_PROJECT_COMMENTS.findIndex(c => c.project_comment_Id === id);
        if (idx !== -1) MOCK_PROJECT_COMMENTS[idx].text = newText;
    };

    const handleDelete = (id) => {
        setAllComments(prev => prev.filter(c => c.project_comment_Id !== id));
        const idx = MOCK_PROJECT_COMMENTS.findIndex(c => c.project_comment_Id === id);
        if (idx !== -1) MOCK_PROJECT_COMMENTS.splice(idx, 1);
    };

    const handleContinueThread = (id) => navigate(`/expertise/${projectId}/comment/${id}`);

    const [replyOpen, setReplyOpen] = useState(false);
    const formattedDate = dayjs(rootComment.creation_date).format('DD.MM.YYYY HH:mm');

    // Thread comments: treat direct children of root as top-level (reply_to_Id = rootComment.id)
    const threadComments = allComments.map(c =>
        c.reply_to_Id === rootComment.project_comment_Id
            ? { ...c, reply_to_Id: null }   // promote to top-level for CommentThread
            : c
    );

    return (
        <div className="client-page">
            <button className="cancel-btn-text" onClick={() => navigate(`/expertise/${projectId}`)}>
                <ArrowLeft size={16} /> Назад до проєкту «{project.name}»
            </button>

            <h1 className="page-title thread-page-title">Гілка коментарів</h1>

            {/* Subtree nested directly inside the root comment card */}
            <div className="thread-root-comment">
                <div className="project-comment__header">
                    <span className="project-comment__author">{rootComment.author_nickname}</span>
                    <span className="project-comment__date">{formattedDate}</span>
                    {authUser && (
                        <div className="project-comment__header-actions">
                            <button className="reply-btn" onClick={() => setReplyOpen(o => !o)}>
                                <MessageSquare size={13} /> Відповісти
                            </button>
                        </div>
                    )}
                </div>
                <p className="project-comment__text thread-root-text">{rootComment.text}</p>

                {replyOpen && (
                    <div className="project-comment__reply-input">
                        <CommentInput
                            placeholder={`Відповідь для @${rootComment.author_nickname}…`}
                            submitLabel="Відповісти"
                            onSubmit={(text) => { addComment(text, rootComment.project_comment_Id); setReplyOpen(false); }}
                            onCancel={() => setReplyOpen(false)}
                        />
                    </div>
                )}

                {threadComments.length === 0 ? (
                    <p className="project-section__empty" style={{ marginTop: '1rem' }}>
                        Відповідей ще немає.
                    </p>
                ) : (
                    <div className="project-comment__replies" style={{ marginTop: '1rem' }}>
                        <CommentThread
                            comments={threadComments}
                            currentUserId={authUser?.user_Id}
                            onAdd={(text, replyToId) => addComment(text, replyToId ?? rootComment.project_comment_Id)}
                            onSaveEdit={handleSaveEdit}
                            onDelete={handleDelete}
                            onContinueThread={handleContinueThread}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExpertiseThreadPage;

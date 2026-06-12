import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import useAuthUser from 'react-auth-kit/hooks/useAuthUser';
import useAuthHeader from 'react-auth-kit/hooks/useAuthHeader';
import dayjs from 'dayjs';
import axios from 'axios';
import API_CONFIG from '../config/api.js';
import { CommentInput, CommentThread } from '../components/ProjectComments.jsx';
import './styles/ClientPages.css';
import './styles/ExpertiseProjectPage.css';

const ExpertiseThreadPage = () => {
    const { projectId, commentId } = useParams();
    const navigate = useNavigate();
    const authUser = useAuthUser();
    const authHeader = useAuthHeader();
    const isAdmin = authUser?.role === 'admin';

    const [project, setProject] = useState(null);
    const [rootComment, setRootComment] = useState(null);
    const [allComments, setAllComments] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [projRes, threadRes] = await Promise.all([
                axios.get(`${API_CONFIG.BASE_URL}/project/${projectId}`),
                axios.get(`${API_CONFIG.BASE_URL}/projectComment/getThread/${commentId}`)
            ]);
            
            setProject({
                ...projRes.data,
                isarchived: projRes.data.is_archived
            });
            
            const root = threadRes.data;
            setRootComment(root);
            setAllComments(root.replies || []);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching thread data', err);
            setLoading(false);
        }
    };

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchData();
    }, [projectId, commentId]);

    const addComment = async (text, replyToId) => {
        try {
            await axios.post(`${API_CONFIG.BASE_URL}/projectComment/create`, {
                text,
                projectId: projectId,
                expertiseId: rootComment.expertise_Id,
                reply_to_id: replyToId
            }, {
                headers: { 'Authorization': authHeader }
            });
            fetchData();
        } catch (error) {
            console.error('Error adding comment:', error);
        }
    };

    const handleSaveEdit = async (id, newText) => {
        try {
            await axios.put(`${API_CONFIG.BASE_URL}/projectComment/${id}`, {
                text: newText
            }, {
                headers: { 'Authorization': authHeader }
            });
            fetchData();
        } catch (error) {
            console.error('Error editing comment:', error);
        }
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`${API_CONFIG.BASE_URL}/projectComment/delete/${id}`, {
                headers: { 'Authorization': authHeader }
            });
            fetchData();
        } catch (error) {
            console.error('Error deleting comment:', error);
        }
    };

    const handleContinueThread = (id) => navigate(`/expertise/${projectId}/comment/${id}`);

    const [replyOpen, setReplyOpen] = useState(false);

    if (loading) {
        return <div className="client-page"><p className="expertise-empty">Завантаження...</p></div>;
    }

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

    const formattedDate = dayjs(rootComment.date || rootComment.creation_date).format('DD.MM.YYYY HH:mm');
    const rootCommentId = rootComment.comment_id || rootComment.project_comment_Id;
    const authorNickname = rootComment.User?.nickname || rootComment.author_nickname;

    return (
        <div className="client-page">
            <button className="cancel-btn-text" onClick={() => navigate(`/expertise/${projectId}`)}>
                <ArrowLeft size={16} /> Назад до проєкту «{project.name}»
            </button>

            <h1 className="page-title thread-page-title">Гілка коментарів</h1>

            <div className="thread-root-comment">
                <div className="project-comment__header">
                    <span className="project-comment__author">{authorNickname}</span>
                    <span className="project-comment__date">{formattedDate}</span>
                    {(!project.isarchived && authUser) && (
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
                            placeholder={`Відповідь для @${authorNickname}…`}
                            submitLabel="Відповісти"
                            onSubmit={(text) => { addComment(text, rootCommentId); setReplyOpen(false); }}
                            onCancel={() => setReplyOpen(false)}
                        />
                    </div>
                )}

                {!allComments || allComments.length === 0 ? (
                    <p className="project-section__empty mt-1rem">
                        Відповідей ще немає.
                    </p>
                ) : (
                    <div className="project-comment__replies mt-1rem">
                        <CommentThread
                            comments={allComments}
                            currentUserId={authUser?.id || authUser?.user_Id}
                            isArchived={project.isarchived}
                            onAdd={(text, replyToId) => addComment(text, replyToId ?? rootCommentId)}
                            onSaveEdit={handleSaveEdit}
                            onDelete={handleDelete}
                            onContinueThread={handleContinueThread}
                            isAdmin={isAdmin}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExpertiseThreadPage;

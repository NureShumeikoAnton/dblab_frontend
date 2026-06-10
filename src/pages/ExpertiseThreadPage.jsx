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

    const [project, setProject] = useState(null);
    const [rootComment, setRootComment] = useState(null);
    const [allComments, setAllComments] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [projRes, threadRes] = await Promise.all([
                axios.get(`${API_CONFIG.BASE_URL}/project/getById/${projectId}`),
                axios.get(`${API_CONFIG.BASE_URL}/projectComment/getThread/${commentId}`)
            ]);
            
            setProject(projRes.data);
            
            const root = threadRes.data;
            const flatComments = [];
            const extractComments = (commentsList) => {
                if (!commentsList) return;
                commentsList.forEach(c => {
                    const { replies, User, ...rest } = c;
                    flatComments.push({
                        ...rest,
                        project_comment_Id: c.comment_id,
                        author_nickname: User?.nickname,
                        author_user_Id: User?.user_Id,
                        expertise_Id: c.expertise_id,
                        reply_to_Id: c.previous_comment_id,
                        text: c.text,
                        creation_date: c.date,
                        score: c.mark
                    });
                    extractComments(replies);
                });
            };
            
            const { replies: rootReplies, User: rootUser, ...rootRest } = root;
            const mappedRoot = {
                ...rootRest,
                project_comment_Id: root.comment_id,
                author_nickname: rootUser?.nickname,
                author_user_Id: rootUser?.user_Id,
                expertise_Id: root.expertise_id,
                reply_to_Id: root.previous_comment_id,
                text: root.text,
                creation_date: root.date,
                score: root.mark
            };
            setRootComment(mappedRoot);
            
            extractComments(rootReplies);
            setAllComments(flatComments);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching thread data', err);
            setLoading(false);
        }
    };

    useEffect(() => {
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

    const formattedDate = dayjs(rootComment.creation_date).format('DD.MM.YYYY HH:mm');

    const threadComments = allComments.map(c =>
        c.reply_to_Id === rootComment.project_comment_Id
            ? { ...c, reply_to_Id: null }
            : c
    );

    return (
        <div className="client-page">
            <button className="cancel-btn-text" onClick={() => navigate(`/expertise/${projectId}`)}>
                <ArrowLeft size={16} /> Назад до проєкту «{project.name}»
            </button>

            <h1 className="page-title thread-page-title">Гілка коментарів</h1>

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

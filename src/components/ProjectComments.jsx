import React, { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import dayjs from 'dayjs';
import axios from 'axios';
import API_CONFIG from '../config/api.js';

const MAX_REPLY_DEPTH = 4;
const REPLY_AUTO_EXPAND_LEVELS = 2;

export function CommentInput({ onSubmit, placeholder = 'Залиште коментар...', submitLabel = 'Коментувати', onCancel }) {
    const [text, setText] = useState('');
    return (
        <div className="project-comment-input">
            <textarea
                className="project-comment-textarea"
                placeholder={placeholder}
                value={text}
                onChange={e => setText(e.target.value)}
                rows={2}
            />
            <div className="project-comment-actions">
                {onCancel && (
                    <button className="cancel-btn-text" onClick={() => { setText(''); onCancel(); }}>
                        Скасувати
                    </button>
                )}
                <button
                    className={`action-btn ${!text.trim() ? 'action-btn--disabled' : ''}`}
                    onClick={() => { if (!text.trim()) return; onSubmit(text.trim()); setText(''); }}
                    disabled={!text.trim()}
                >
                    {submitLabel}
                </button>
            </div>
        </div>
    );
}

export function CommentThread({ comments, currentUserId, onAdd, onSaveEdit, onDelete, onContinueThread, isArchived }) {
    if (!comments) return null;
    return (
        <div className="project-comments-list">
            {comments.map(c => (
                <ProjectComment
                    key={c.project_comment_Id || c.comment_Id || c.comment_id}
                    comment={c}
                    currentUserId={currentUserId}
                    onReply={(parentId, text) => onAdd(text, parentId)}
                    onSaveEdit={onSaveEdit}
                    onDelete={onDelete}
                    onContinueThread={onContinueThread}
                    isArchived={isArchived}
                    depth={0}
                    autoExpandLevels={0}
                />
            ))}
        </div>
    );
}

export function ProjectComment({ comment, currentUserId, onReply, onSaveEdit, onDelete, onContinueThread, isArchived, depth = 0, autoExpandLevels = 0 }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [replyOpen, setReplyOpen] = useState(false);
    const [repliesExpanded, setRepliesExpanded] = useState(autoExpandLevels > 0);
    const [childLevels, setChildLevels] = useState(autoExpandLevels - 1);
    const [editing, setEditing] = useState(false);
    
    const text = comment.text;
    const [editText, setEditText] = useState(text);

    useEffect(() => {
        setEditText(text);
    }, [text]);

    const [fetchedThread, setFetchedThread] = useState(null);
    const [loadingThread, setLoadingThread] = useState(false);

    const commentId = comment.project_comment_Id || comment.comment_Id || comment.comment_id;
    const authorName = comment.author_nickname || comment.author?.nickname || comment.User?.nickname;
    const authorId = comment.author_user_Id || comment.author?.user_Id || comment.User?.user_Id;
    const creationDate = comment.creation_date || comment.date;

    const displayReplies = fetchedThread || comment.replies || [];

    const fetchThreadData = async () => {
        setLoadingThread(true);
        try {
            const res = await axios.get(`${API_CONFIG.BASE_URL}/projectComment/getThread/${commentId}`);
            setFetchedThread(res.data.replies || []);
        } catch (e) {
            console.error("Failed to load thread", e);
        } finally {
            setLoadingThread(false);
        }
    };

    const handleToggleReplies = async () => {
        if (!repliesExpanded) {
            setChildLevels(REPLY_AUTO_EXPAND_LEVELS - 1);
            if (!fetchedThread && commentId) {
                await fetchThreadData();
            }
        }
        setRepliesExpanded(o => !o);
    };

    const isOwner = currentUserId != null && currentUserId === authorId;
    const formattedDate = dayjs(creationDate).format('DD.MM.YYYY HH:mm');

    const visibleReplyCount = fetchedThread ? fetchedThread.length : (comment.replies ? comment.replies.length : 0);

    return (
        <div className="project-comment">
            <div className="project-comment__header">
                <span className="project-comment__author">{authorName}</span>
                <span className="project-comment__date">{formattedDate}</span>
                <div className="project-comment__header-actions">
                    {(!isArchived && currentUserId) && (
                        <button className="reply-btn" onClick={() => setReplyOpen(o => !o)}>
                            <MessageSquare size={13} /> Відповісти
                        </button>
                    )}
                    {(!isArchived && isOwner) && (
                        <div className="project-comment__menu-wrapper">
                            <button className="project-comment__menu-btn" onClick={() => setMenuOpen(o => !o)}>
                                &#8942;
                            </button>
                            {menuOpen && (
                                <div className="project-comment__menu">
                                    <button onClick={() => { setEditing(true); setMenuOpen(false); }}>
                                        Редагувати
                                    </button>
                                    <button onClick={() => { onDelete(commentId); setMenuOpen(false); }}>
                                        Видалити
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {editing ? (
                <div className="project-comment__edit">
                    <textarea
                        className="project-comment-textarea"
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        rows={2}
                    />
                    <div className="project-comment-actions">
                        <button className="cancel-btn-text" onClick={() => setEditing(false)}>Скасувати</button>
                        <button
                            className="action-btn"
                            onClick={() => { onSaveEdit(commentId, editText.trim()); setEditing(false); }}
                            disabled={!editText.trim()}
                        >
                            Зберегти
                        </button>
                    </div>
                </div>
            ) : (
                <p className="project-comment__text">{text}</p>
            )}

            {replyOpen && (
                <div className="project-comment__reply-input">
                    <CommentInput
                        placeholder={`Відповідь для @${authorName}…`}
                        submitLabel="Відповісти"
                        onSubmit={async (newText) => { 
                            await onReply(commentId, newText); 
                            setReplyOpen(false); 
                            
                            // Immediately fetch the thread to update the UI with the new reply
                            await fetchThreadData();
                            if (!repliesExpanded) {
                                setRepliesExpanded(true);
                            }
                        }}
                        onCancel={() => setReplyOpen(false)}
                    />
                </div>
            )}

            {visibleReplyCount > 0 && depth < MAX_REPLY_DEPTH && (
                <>
                    <button className="show-replies-btn" onClick={handleToggleReplies} disabled={loadingThread}>
                        {loadingThread ? 'Завантаження...' : (repliesExpanded ? 'Приховати відповіді' : `Показати відповіді (${visibleReplyCount})`)}
                    </button>
                    {repliesExpanded && (
                        <div className="project-comment__replies">
                            {displayReplies.map(reply => (
                                <ProjectComment
                                    key={reply.project_comment_Id || reply.comment_Id || reply.comment_id}
                                    comment={reply}
                                    currentUserId={currentUserId}
                                    onReply={onReply}
                                    onSaveEdit={onSaveEdit}
                                    onDelete={onDelete}
                                    onContinueThread={onContinueThread}
                                    isArchived={isArchived}
                                    depth={depth + 1}
                                    autoExpandLevels={childLevels}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}

            {visibleReplyCount > 0 && depth >= MAX_REPLY_DEPTH && (
                <button className="continue-thread-btn" onClick={() => onContinueThread(commentId)}>
                    ↳ Продовжити гілку ({visibleReplyCount} {visibleReplyCount === 1 ? 'відповідь' : 'відповідей'})
                </button>
            )}
        </div>
    );
}

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare } from 'lucide-react';
import dayjs from 'dayjs';
import axios from 'axios';
import API_CONFIG from '../config/api.js';

const MAX_REPLY_DEPTH = 4;
const REPLY_AUTO_EXPAND_LEVELS = 2;

export function CommentInput({ onSubmit, placeholder = 'Залиште коментар...', submitLabel = 'Коментувати', onCancel }) {
    const [text, setText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
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
                    <button className="cancel-btn-text" onClick={() => { setText(''); onCancel(); }} disabled={isSubmitting}>
                        Скасувати
                    </button>
                )}
                <button
                    className={`action-btn ${(!text.trim() || isSubmitting) ? 'action-btn--disabled' : ''}`}
                    onClick={async () => { 
                        if (!text.trim() || isSubmitting) return; 
                        setIsSubmitting(true);
                        try {
                            const success = await onSubmit(text.trim());
                            if (success !== false) setText('');
                        } finally {
                            setIsSubmitting(false);
                        }
                    }}
                    disabled={!text.trim() || isSubmitting}
                >
                    {isSubmitting ? 'Завантаження...' : submitLabel}
                </button>
            </div>
        </div>
    );
}

export function CommentThread({ comments, currentUserId, onAdd, onSaveEdit, onDelete, onContinueThread, isArchived, isAdmin }) {
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
                    isAdmin={isAdmin}
                    depth={0}
                    autoExpandLevels={0}
                />
            ))}
        </div>
    );
}

export function ProjectComment({ comment, currentUserId, onReply, onSaveEdit, onDelete, onContinueThread, isArchived, isAdmin, depth = 0, autoExpandLevels = 0 }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [replyOpen, setReplyOpen] = useState(false);
    const [repliesExpanded, setRepliesExpanded] = useState(autoExpandLevels > 0);
    const [childLevels, setChildLevels] = useState(autoExpandLevels - 1);
    const [editing, setEditing] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
        };

        if (menuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [menuOpen]);
    
    const [localText, setLocalText] = useState(comment.text);
    const [editText, setEditText] = useState(comment.text);

    useEffect(() => {
        setLocalText(comment.text);
        setEditText(comment.text);
    }, [comment.text]);

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

    const isOwner = currentUserId != null && authorId != null && Number(currentUserId) === Number(authorId);
    const formattedDate = dayjs(creationDate).format('DD.MM.YYYY HH:mm');

    const visibleReplyCount = fetchedThread ? fetchedThread.length : (comment.replies ? comment.replies.length : 0);

    const [isSavingEdit, setIsSavingEdit] = useState(false);

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
                    {(!isArchived && (isOwner || isAdmin)) && (
                        <div className="project-comment__menu-wrapper" ref={menuRef}>
                            <button className="project-comment__menu-btn" onClick={() => setMenuOpen(o => !o)}>
                                &#8942;
                            </button>
                            {menuOpen && (
                                <div className="project-comment__menu">
                                    {isOwner && (
                                        <button onClick={() => { setEditing(true); setMenuOpen(false); }}>
                                            Редагувати
                                        </button>
                                    )}
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
                        disabled={isSavingEdit}
                    />
                    <div className="project-comment-actions">
                        <button className="cancel-btn-text" onClick={() => setEditing(false)} disabled={isSavingEdit}>Скасувати</button>
                        <button
                            className={`action-btn ${(!editText.trim() || isSavingEdit) ? 'action-btn--disabled' : ''}`}
                            onClick={async () => { 
                                if (!editText.trim() || isSavingEdit) return;
                                setIsSavingEdit(true);
                                try {
                                    const success = await onSaveEdit(commentId, editText.trim()); 
                                    if (success !== false) {
                                        setLocalText(editText.trim());
                                        setEditing(false); 
                                    }
                                } finally {
                                    setIsSavingEdit(false);
                                }
                            }}
                            disabled={!editText.trim() || isSavingEdit}
                        >
                            {isSavingEdit ? 'Збереження...' : 'Зберегти'}
                        </button>
                    </div>
                </div>
            ) : (
                <p className="project-comment__text">{localText}</p>
            )}

            {replyOpen && (
                <div className="project-comment__reply-input">
                    <CommentInput
                        placeholder={`Відповідь для @${authorName}…`}
                        submitLabel="Відповісти"
                        onSubmit={async (newText) => { 
                            const success = await onReply(commentId, newText); 
                            if (success !== false) {
                                setReplyOpen(false); 
                                
                                // Immediately fetch the thread to update the UI with the new reply
                                await fetchThreadData();
                                if (!repliesExpanded) {
                                    setRepliesExpanded(true);
                                }
                            }
                            return success;
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
                                    isAdmin={isAdmin}
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

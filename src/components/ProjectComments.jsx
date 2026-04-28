import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import dayjs from 'dayjs';
import { MOCK_PROJECT_COMMENTS } from '../mocks/expertiseMockData.js';

const MAX_REPLY_DEPTH = 4;
const REPLY_AUTO_EXPAND_LEVELS = 2;

export function pushComment(text, projectId, expertiseId, authorUserId, authorNickname, replyToId = null) {
    const c = {
        project_comment_Id: Date.now(),
        text,
        creation_date: new Date().toISOString(),
        score: 0,
        author_user_Id: authorUserId,
        author_nickname: authorNickname,
        project_Id: projectId,
        expertise_Id: expertiseId,
        reply_to_Id: replyToId,
    };
    MOCK_PROJECT_COMMENTS.push(c);
    return c;
}

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

export function CommentThread({ comments, currentUserId, onAdd, onSaveEdit, onDelete, onContinueThread }) {
    const topLevel = comments.filter(c => !c.reply_to_Id);
    return (
        <div className="project-comments-list">
            {topLevel.map(c => (
                <ProjectComment
                    key={c.project_comment_Id}
                    comment={c}
                    replies={comments.filter(r => r.reply_to_Id === c.project_comment_Id)}
                    allComments={comments}
                    currentUserId={currentUserId}
                    onReply={(parentId, text) => onAdd(text, parentId)}
                    onSaveEdit={onSaveEdit}
                    onDelete={onDelete}
                    onContinueThread={onContinueThread}
                    depth={0}
                    autoExpandLevels={0}
                />
            ))}
        </div>
    );
}

export function ProjectComment({ comment, replies, allComments, currentUserId, onReply, onSaveEdit, onDelete, onContinueThread, depth = 0, autoExpandLevels = 0 }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [replyOpen, setReplyOpen] = useState(false);
    const [repliesExpanded, setRepliesExpanded] = useState(autoExpandLevels > 0);
    const [childLevels, setChildLevels] = useState(autoExpandLevels - 1);
    const [editing, setEditing] = useState(false);
    const [editText, setEditText] = useState(comment.text);

    const handleToggleReplies = () => {
        if (!repliesExpanded) setChildLevels(REPLY_AUTO_EXPAND_LEVELS - 1);
        setRepliesExpanded(o => !o);
    };

    const isOwner = currentUserId != null && currentUserId === comment.author_user_Id;
    const formattedDate = dayjs(comment.creation_date).format('DD.MM.YYYY HH:mm');

    return (
        <div className="project-comment">
            <div className="project-comment__header">
                <span className="project-comment__author">{comment.author_nickname}</span>
                <span className="project-comment__date">{formattedDate}</span>
                <div className="project-comment__header-actions">
                    {currentUserId && (
                        <button className="reply-btn" onClick={() => setReplyOpen(o => !o)}>
                            <MessageSquare size={13} /> Відповісти
                        </button>
                    )}
                    {isOwner && (
                        <div className="project-comment__menu-wrapper">
                            <button className="project-comment__menu-btn" onClick={() => setMenuOpen(o => !o)}>
                                &#8942;
                            </button>
                            {menuOpen && (
                                <div className="project-comment__menu">
                                    <button onClick={() => { setEditing(true); setMenuOpen(false); }}>
                                        Редагувати
                                    </button>
                                    <button onClick={() => { onDelete(comment.project_comment_Id); setMenuOpen(false); }}>
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
                            onClick={() => { onSaveEdit(comment.project_comment_Id, editText.trim()); setEditing(false); }}
                            disabled={!editText.trim()}
                        >
                            Зберегти
                        </button>
                    </div>
                </div>
            ) : (
                <p className="project-comment__text">{comment.text}</p>
            )}

            {replyOpen && (
                <div className="project-comment__reply-input">
                    <CommentInput
                        placeholder={`Відповідь для @${comment.author_nickname}…`}
                        submitLabel="Відповісти"
                        onSubmit={(text) => { onReply(comment.project_comment_Id, text); setReplyOpen(false); }}
                        onCancel={() => setReplyOpen(false)}
                    />
                </div>
            )}

            {replies.length > 0 && depth < MAX_REPLY_DEPTH && (
                <>
                    <button className="show-replies-btn" onClick={handleToggleReplies}>
                        {repliesExpanded ? 'Приховати відповіді' : `Показати відповіді (${replies.length})`}
                    </button>
                    {repliesExpanded && (
                        <div className="project-comment__replies">
                            {replies.map(reply => (
                                <ProjectComment
                                    key={reply.project_comment_Id}
                                    comment={reply}
                                    replies={allComments.filter(r => r.reply_to_Id === reply.project_comment_Id)}
                                    allComments={allComments}
                                    currentUserId={currentUserId}
                                    onReply={onReply}
                                    onSaveEdit={onSaveEdit}
                                    onDelete={onDelete}
                                    onContinueThread={onContinueThread}
                                    depth={depth + 1}
                                    autoExpandLevels={childLevels}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}

            {replies.length > 0 && depth >= MAX_REPLY_DEPTH && (
                <button className="continue-thread-btn" onClick={() => onContinueThread(comment.project_comment_Id)}>
                    ↳ Продовжити гілку ({replies.length} {replies.length === 1 ? 'відповідь' : 'відповідей'})
                </button>
            )}
        </div>
    );
}

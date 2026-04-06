import React, { useState, useRef, useEffect } from "react";
import CommentComponent from "./CommentComponent";
import './styles/CommentComponents.css';

const CommentsSection = ({ comments, currentUserId, onSubmit, onUpdate, onDelete }) => {
    const [commentText, setCommentText] = useState("");
    const [editingCommentId, setEditingCommentId] = useState(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.style.height = "auto";
            inputRef.current.style.height = inputRef.current.scrollHeight + "px";
        }
    }, [commentText]);

    const handleSubmit = () => {
        if (!commentText.trim()) return;
        
        if (editingCommentId) {
            onUpdate(commentText, editingCommentId);
        } else {
            onSubmit(commentText);
        }
        
        setCommentText("");
        setEditingCommentId(null);
    };

    const handleCancel = () => {
        setCommentText("");
        setEditingCommentId(null);
    };

    const handleEditInitiate = (comment) => {
        setCommentText(comment.text);
        setEditingCommentId(comment.comment_Id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => { if(inputRef.current) inputRef.current.focus(); }, 300);
    };

    return (
        <div className="comments-wrapper">
            <h4 className="comments-title">{comments.length} коментарі</h4>
            
            <div className="comment-input-section">
                <div className="comment-input-wrapper">
                    <textarea 
                        ref={inputRef}
                        className={`comment-textarea ${editingCommentId ? 'editing' : ''}`}
                        placeholder="Залиште свій коментар..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        rows={1}
                    />
                    <div className="input-actions">
                        {(commentText || editingCommentId) && (
                            <button className="btn-cancel" onClick={handleCancel}>Скасувати</button>
                        )}
                        <button 
                            className={`btn-submit ${commentText.trim() ? 'active' : ''} ${editingCommentId ? 'editing' : ''}`}
                            onClick={handleSubmit}
                            disabled={!commentText.trim()}
                        >
                            {editingCommentId ? 'Зберегти' : 'Коментувати'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="comments-list">
                {comments && comments.map(comment => (
                    <CommentComponent
                        key={comment.comment_Id}
                        comment={comment}
                        currentUserId={currentUserId}
                        onEdit={handleEditInitiate}
                        onDelete={onDelete}
                    />
                ))}
            </div>
        </div>
    );
};

export default CommentsSection;
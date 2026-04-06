import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import API_CONFIG from "../config/api.js";
import useAuthHeader from "react-auth-kit/hooks/useAuthHeader";
import { MoreVertical, ThumbsUp } from 'lucide-react';
import './styles/CommentComponents.css';

const CommentComponent = ({ comment, currentUserId, onEdit, onDelete }) => {
  const authHeader = useAuthHeader();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [isLiked, setIsLiked] = useState(comment.is_liked || false); 
  const [likesCount, setLikesCount] = useState(comment.likes);

  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
        if (menuRef.current && !menuRef.current.contains(event.target)) {
            setIsMenuOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLikeToggle = async () => {
    if (!authHeader) return;
    const token = authHeader.split(' ')[1];
    
    const newLikedState = !isLiked;
    const newLikesCount = newLikedState ? likesCount + 1 : likesCount - 1;
    const apiFlag = newLikedState ? 1 : 0;

    setIsLiked(newLikedState);
    setLikesCount(newLikesCount);

    try {
        await axios.put(
            `${API_CONFIG.BASE_URL}/comment/switchLike/${comment.comment_Id}`,
            { flag: apiFlag },
            { headers: { 'Authorization': token } }
        );
    } catch (error) {
        console.error("Like failed", error);
        setIsLiked(!newLikedState);
        setLikesCount(likesCount);
    }
  };

  const handleDeleteClick = () => {
      if (onDelete) onDelete(comment.comment_Id);
      setIsMenuOpen(false);
  };

  const handleEditClick = () => {
      if (onEdit) onEdit(comment);
      setIsMenuOpen(false);
  };

  const isOwner = (currentUserId == comment.user_Id);

  const formattedDate = new Date(comment.creation_date).toLocaleString('uk-UA', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className="horizontal-flex-container">
      <div className="comment-container">
        <div className="comment-header">
          <span className="comment-nickname">{comment.nickname}</span>
          <span className="comment-date">{formattedDate}</span>
        </div>
        <div className="comment-text">{comment.text}</div>
        <div className="comment-likes">
            <button 
                className={`comment-like-btn ${isLiked ? 'active' : ''}`} 
                onClick={handleLikeToggle}
                title={isLiked ? "Прибрати лайк" : "Лайкнути"}
            >
                <ThumbsUp size={16} fill={isLiked ? "currentColor" : "none"} />
                {likesCount}
            </button>
        </div>
      </div>

      {isOwner && (
          <div className="comment-menu-wrapper" ref={menuRef}>
            <button className="menu-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                <MoreVertical size={20} />
            </button>
            
            {isMenuOpen && (
                <div className="dropdown-menu">
                    <button className="dropdown-item" onClick={handleEditClick}>
                        Редагувати
                    </button>
                    <button className="dropdown-item" onClick={handleDeleteClick}>
                        Видалити
                    </button>
                </div>
            )}
          </div>
      )}
    </div>
  );
};

export default CommentComponent;
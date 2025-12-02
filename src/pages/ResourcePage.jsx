import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import API_CONFIG from "../config/api.js";
import useAuthHeader from "react-auth-kit/hooks/useAuthHeader";
import useAuthUser from "react-auth-kit/hooks/useAuthUser";
import { MoreVertical, ThumbsUp, Eye, ChevronDown } from 'lucide-react';
import "./styles/ResourcePage.css";

const ResourcePage = () => {
  const { resourceId } = useParams();
  const [resource, setResource] = useState(null);
  const [comments, setComments] = useState([]);

  // UI States
  const [isRatingsOpen, setIsRatingsOpen] = useState(false);
  const [isResourceLiked, setIsResourceLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  
// Form State
  const [commentText, setCommentText] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const inputRef = useRef(null);

  const authHeader = useAuthHeader();
  const authUser = useAuthUser();

  // User data
  let currentUserId = authUser?.user_Id;
  let currentUserNickname = authUser?.username || "Me";

  // Fetch Resource
  useEffect(() => {
    if (!authHeader) return;
    const token = authHeader.split(' ')[1];
    
    axios.get(`${API_CONFIG.BASE_URL}/resource/getById/${resourceId}`, {
        headers: { 'Authorization': token },
    })
    .then((response) => {
        let resourceData = response.data;
        const interaction = resourceData.InteractionUserResources?.[0];
        
        setIsResourceLiked(interaction?.is_liked || false);
        setLikesCount(resourceData.likes_cache);

        // Встановити перегляд ресурсу
        if (!interaction?.is_viewed) {
            axios.post(`${API_CONFIG.BASE_URL}/interactionUserResource/createOrUpdate`, {
                resource_Id: resourceId,
                is_viewed: true,
            }, {
                headers: { 'Authorization': token }
            }).catch(e => console.error("Failed to register view", e));

            resourceData = {
                ...resourceData,
                views_cache: resourceData.views_cache + 1,
                InteractionUserResources: [{ ...(interaction || {}), is_viewed: true }]
            };
        }
        setResource(resourceData);
    })
    .catch((error) => console.error("Error fetching resource:", error));
  }, [resourceId, authHeader]);

  // Fetch Comments
  useEffect(() => {
    if (!authHeader) return;
    const token = authHeader.split(' ')[1];
    axios.get(`${API_CONFIG.BASE_URL}/comment/getForResource/${resourceId}/1/10`, {
        headers: { 'Authorization': token },
    })
    .then(response => setComments(response.data))
    .catch(error => console.error("Error fetching comments:", error));
  }, [resourceId, authHeader]);

  useEffect(() => {
    if (inputRef.current) {
        inputRef.current.style.height = "auto";
        inputRef.current.style.height = inputRef.current.scrollHeight + "px";
    }
  }, [commentText]);

  // Resource Like Handler
  const handleResourceLike = async () => {
      const token = authHeader.split(' ')[1];
      const newLikedState = !isResourceLiked;
      
      setIsResourceLiked(newLikedState);
      setLikesCount(prev => prev + (newLikedState ? 1 : -1));

      try {
          await axios.post(`${API_CONFIG.BASE_URL}/interactionUserResource/createOrUpdate`, {
              resource_Id: resourceId,
              is_liked: newLikedState,
              is_viewed: true
          }, {
              headers: { 'Authorization': token }
          });
      } catch (error) {
          console.error("Resource like failed", error);
          setIsResourceLiked(!newLikedState);
          setLikesCount(prev => prev + (newLikedState ? -1 : 1));
      }
  };

  const handleCommentSubmit = async () => {
    if (!commentText.trim()) return;
    const token = authHeader.split(' ')[1];

    try {
        if (editingCommentId) {
            await axios.put(`${API_CONFIG.BASE_URL}/comment/updateText/${editingCommentId}`,{ text: commentText }, { headers: { 'Authorization': token } });
            setComments(prev => prev.map(c => c.comment_Id === editingCommentId ? { ...c, text: commentText } : c));
            setEditingCommentId(null);
        } else {
            const response = await axios.post(`${API_CONFIG.BASE_URL}/comment/createForResource`, { text: commentText, resource_Id: resourceId }, { headers: { 'Authorization': token } });
            const newComment = { ...response.data, nickname: currentUserNickname, user_Id: currentUserId, likes: 0, creation_date: response.data.creation_date || new Date().toISOString() };
            setComments([newComment, ...comments]);
        }
        setCommentText("");
    } catch (error) { console.error("Failed to submit comment", error); }
  };

  const handleEditClick = (comment) => {
    setCommentText(comment.text);
    setEditingCommentId(comment.comment_Id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => { if(inputRef.current) inputRef.current.focus(); }, 300);
  };

  const handleCancel = () => {
    setCommentText("");
    setEditingCommentId(null);
  };


  if (!resource) return <p className="loading">Завантаження...</p>;

  const {
    name, description, link_to_resource, origination_date, publish_date,
    views_cache, is_recommended, producer, User, Ratings,
    DevelopmentDirections, LinkType, InteractionUserResources
  } = resource;
  
  const isViewed = InteractionUserResources?.[0]?.is_viewed;

  return (
    <div className="resource-container">
      {/* Header: Title & Author */}
      <div className="resource-header">
        <h1 className="resource-title">
          {name} {is_recommended && <span className="verified" title="Рекомендовано">✔</span>}
        </h1>
        <h2 className="author-name">{User?.nickname}</h2>
      </div>

      {/* Directions Section */}
      <div className="directions-container">
        <h3 className="section-heading">Напрямки:</h3>
        <div className="directions-tags">
            {DevelopmentDirections.map(dir => 
                <span className="direction-tag" key={dir.development_direction_Id}>
                    {dir.development_direction_name}
                </span>
            )}
        </div>
      </div>

      {/* Description */}
      <h3 className="section-heading">Опис:</h3>
      <p className="description">{description}</p>

      {/* Meta Data Group */}
      <div className="meta-section">
          <div className="meta-row">
            <span className="meta-label">Першоджерело:</span>
            <span className="meta-value">
                <a href={link_to_resource} target="_blank" rel="noreferrer">
                  {link_to_resource}
                </a>
                {LinkType && <span style={{color: '#999', marginLeft: '8px'}}>({LinkType.link_type_name.toLowerCase()})</span>}
            </span>
          </div>

          <div className="meta-row">
            <span className="meta-label">Виробник:</span>
            <span className="meta-value">{producer || "Невідомо"}</span>
          </div>

          <div className="meta-row">
             <span className="meta-label">Дата появи:</span>
             <span className="meta-value">{new Date(origination_date).toLocaleDateString("uk-UA")}</span>
          </div>

          <div className="meta-row">
             <span className="meta-label">Опубліковано:</span>
             <span className="meta-value">{new Date(publish_date).toLocaleDateString("uk-UA")}</span>
          </div>
      </div>
      
      {/* Ratings Dropdown */}
      <div className="ratings-section">
          <div 
            className="ratings-dropdown-header" 
            onClick={() => setIsRatingsOpen(!isRatingsOpen)}
          >
              Місця у рейтингах
              <ChevronDown className={`dropdown-arrow ${isRatingsOpen ? 'open' : ''}`} size={20}/>
          </div>
          
          {isRatingsOpen && (
             <ul className="ratings-list">
               {Ratings?.length > 0 ? (
                 Ratings.map((rating) => (
                   <li key={rating.rating_Id}>
                     {`#${rating.RatingResource.rating_position} у ${rating.name}`}
                   </li>
                 ))
               ) : (
                 <li style={{background: 'none', border: 'none', padding: 0, color: '#666'}}>
                    Цей ресурс поки не входить до рейтингів.
                 </li>
               )}
             </ul>
          )}
      </div>

      {/* Stats Bar (Likes/Views) */}
      <div className="stats">
        <button 
            className={`stat-item ${isResourceLiked ? 'active' : ''}`}
            onClick={handleResourceLike}
            title={isResourceLiked ? "Прибрати лайк" : "Лайкнути"}
        >
          <ThumbsUp size={20} fill={isResourceLiked ? "currentColor" : "none"} /> 
          <span>{likesCount}</span>
        </button>
        
        <div className="stat-item view-only" title="Перегляди">
            <Eye size={20} /> 
            <span>{views_cache}</span>
        </div>
      </div>

      {/* Comments Section */}
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
                        onClick={handleCommentSubmit}
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
                    comments={comments}
                    setComments={setComments}
                    currentUserId={currentUserId}
                    onEdit={() => handleEditClick(comment)}
                />
            ))}
        </div>
      </div>
    </div>
  );
};

const CommentComponent = ({ comment, comments, setComments, currentUserId, onEdit }) => {
  const authHeader = useAuthHeader();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const menuRef = useRef(null);

  // Закриття меню при кліку зовні
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
    const token = authHeader.split(' ')[1];
    const newIsLiked = !isLiked;
    const apiFlag = newIsLiked ? 1 : 0;

    setIsLiked(newIsLiked);
    setComments(prev => prev.map(c => 
        c.comment_Id === comment.comment_Id 
        ? { ...c, likes: c.likes + (newIsLiked ? 1 : -1) } 
        : c
    ));

    try {
        await axios.put(
            `${API_CONFIG.BASE_URL}/comment/switchLike/${comment.comment_Id}`,
            { flag: apiFlag },
            { headers: { 'Authorization': token } }
        );
    } catch (error) {
        console.error("Like failed", error);
        setIsLiked(!newIsLiked);
        setComments(prev => prev.map(c => 
            c.comment_Id === comment.comment_Id 
            ? { ...c, likes: c.likes + (newIsLiked ? -1 : 1) } 
            : c
        ));
    }
  };

  const deleteComment = () => {
    if(!window.confirm("Видалити коментар?")) return;

    axios
      .delete(`${API_CONFIG.BASE_URL}/comment/deleteResourceComment/${comment.comment_Id}`, {
        headers: {
          'Authorization': authHeader.split(' ')[1]
        },
      })
      .then(() => {
        setComments(comments.filter(c => c.comment_Id !== comment.comment_Id));
      })
      .catch((error) => {
        console.error("Error deleting comment:", error);
      });
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
                {comment.likes}
            </button>
        </div>
      </div>

      {/* Меню "Три крапки" тільки для власника */}
      {isOwner && (
          <div className="comment-menu-wrapper" ref={menuRef}>
            <button className="menu-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                <MoreVertical size={20} />
            </button>
            
            {isMenuOpen && (
                <div className="dropdown-menu">
                    <button 
                        className="dropdown-item" 
                        onClick={() => { setIsMenuOpen(false); onEdit(); }}
                    >
                        Редагувати
                    </button>
                    <button 
                        className="dropdown-item" 
                        onClick={() => { setIsMenuOpen(false); deleteComment(); }}
                    >
                        Видалити
                    </button>
                </div>
            )}
          </div>
      )}
    </div>
  );
};

export default ResourcePage;
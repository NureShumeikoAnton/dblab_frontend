import React, { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import API_CONFIG from "../config/api.js";
import useAuthHeader from "react-auth-kit/hooks/useAuthHeader";
import useAuthUser from "react-auth-kit/hooks/useAuthUser";
import { MoreVertical, ThumbsUp, Eye, ChevronDown, ArrowLeft } from 'lucide-react';
import "./styles/ResourcePage.css";
import CommentsSection from "../components/CommentsSection.jsx";

const ResourcePage = () => {
  const { resourceId } = useParams();

  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const returnToStack = searchParams.get('returnToStack');
  const stackId = searchParams.get('stackId');

  const [resource, setResource] = useState(null);
  const [comments, setComments] = useState([]);

  // UI States
  const [isRatingsOpen, setIsRatingsOpen] = useState(false);
  const [isResourceLiked, setIsResourceLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

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

  const handleReturnToStack = () => {
      if (authUser?.user_Id && stackId) {
          navigate(`/library/mystacks/${authUser.user_Id}?openEdit=true&stackId=${stackId}`);
      }
  };

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

  const handleCommentSubmit = async (text) => {
      const token = authHeader.split(' ')[1];
      try {
          const response = await axios.post(`${API_CONFIG.BASE_URL}/comment/createForResource`, 
              { text, resource_Id: resourceId }, 
              { headers: { 'Authorization': token } }
          );
          
          const newComment = { 
              ...response.data, 
              nickname: currentUserNickname, 
              user_Id: currentUserId, 
              likes: 0, 
              creation_date: new Date().toISOString() 
          };
          setComments(prev => [newComment, ...prev]);
      } catch (error) { console.error("Resource comment submit failed", error); }
  };

  const handleCommentUpdate = async (text, commentId) => {
      const token = authHeader.split(' ')[1];
      try {
          await axios.put(`${API_CONFIG.BASE_URL}/comment/updateTextForResourceComment/${commentId}`,
             { text }, 
             { headers: { 'Authorization': token } }
          );
          setComments(prev => prev.map(c => c.comment_Id === commentId ? { ...c, text } : c));
      } catch (error) { console.error("Update failed", error); }
  };

  const handleCommentDelete = async (commentId) => {
      if(!window.confirm("Видалити коментар?")) return;
      try {
          await axios.delete(`${API_CONFIG.BASE_URL}/comment/deleteResourceComment/${commentId}`, {
              headers: { 'Authorization': authHeader.split(' ')[1] }
          });
          setComments(prev => prev.filter(c => c.comment_Id !== commentId));
      } catch (error) { console.error("Delete failed", error); }
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
      
       <CommentsSection 
        comments={comments} 
        currentUserId={currentUserId}
        onSubmit={handleCommentSubmit}
        onUpdate={handleCommentUpdate}
        onDelete={handleCommentDelete}
      />

      {returnToStack && stackId && (
        <button className="floating-return-btn" onClick={handleReturnToStack} title="Повернутися до редагування стеку">
            <ArrowLeft size={24} />
            <span>Назад до стеку</span>
        </button>
      )}
    </div>
  );
};

export default ResourcePage;
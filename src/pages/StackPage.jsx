import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import API_CONFIG from "../config/api.js";
import useAuthHeader from "react-auth-kit/hooks/useAuthHeader";
import useAuthUser from "react-auth-kit/hooks/useAuthUser";
import { ThumbsUp, Eye } from 'lucide-react';
import CommentsSection from "../components/CommentsSection";
import "./styles/StackPage.css";

const StackPage = () => {
  const { stackId } = useParams();
  const [stack, setStack] = useState(null);
  const [comments, setComments] = useState([]); 
  
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  const authHeader = useAuthHeader();
  const authUser = useAuthUser();
  const navigate = useNavigate();
  const requestRef = useRef(null);

  let currentUserId = authUser?.user_Id;
  let currentUserNickname = authUser?.username || "Me";

  // Fetch stack
  useEffect(() => {
    if (!authHeader) return;
    if (requestRef.current === stackId) return;
    requestRef.current = stackId;

    const token = authHeader.split(' ')[1];
    
    axios.get(`${API_CONFIG.BASE_URL}/stack/getById/${stackId}`, {
        headers: { 'Authorization': token },
    })
    .then((response) => {
        let stackData = response.data;
        
        const interactions = stackData.InteractionUserStacks || stackData.Interaction_user_stacks || [];
        const interaction = interactions[0];
        
        setIsLiked(interaction?.is_liked || false);
        setLikesCount(stackData.likes_cache);

        if (!interaction?.is_viewed) {
            axios.post(`${API_CONFIG.BASE_URL}/interactionUserStack/createOrUpdate`, {
                stack_Id: stackId,
                is_viewed: true,
                is_liked: interaction?.is_liked || false 
            }, { headers: { 'Authorization': token } }).catch(e => console.error("Failed to register stack view", e));

            stackData = { ...stackData, views_cache: stackData.views_cache + 1 };
        }
        setStack(stackData);
    })
    .catch(err => {
        console.error("Stack fetch error:", err);
        requestRef.current = null;
    });

    return () => { requestRef.current = null; };
  }, [stackId, authHeader]);

  // Fetch comments
  useEffect(() => {
    if (!authHeader) return;
    const token = authHeader.split(' ')[1];
    axios.get(`${API_CONFIG.BASE_URL}/comment/getForStack/${stackId}/1/10`, {
        headers: { 'Authorization': token },
    })
    .then(response => setComments(response.data))
    .catch(error => console.error("Error fetching stack comments:", error));
  }, [stackId, authHeader]);


  // Handlers

  const handleStackLike = async () => {
      const token = authHeader.split(' ')[1];
      const newLikedState = !isLiked;

      setIsLiked(newLikedState);
      setLikesCount(prev => prev + (newLikedState ? 1 : -1));

      try {
          await axios.post(`${API_CONFIG.BASE_URL}/interactionUserStack/createOrUpdate`, {
              stack_Id: stackId,
              is_liked: newLikedState,
              is_viewed: true
          }, { headers: { 'Authorization': token } });
      } catch (error) {
          console.error("Stack like failed", error);
          setIsLiked(!newLikedState);
          setLikesCount(prev => prev + (newLikedState ? -1 : 1));
      }
  };

  const handleCommentSubmit = async (text) => {
      const token = authHeader.split(' ')[1];
      try {
          const response = await axios.post(`${API_CONFIG.BASE_URL}/comment/createForStack`, 
              { text, stack_Id: stackId }, 
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
      } catch (error) { console.error("Stack comment submit failed", error); }
  };

  const handleCommentUpdate = async (text, commentId) => {
      const token = authHeader.split(' ')[1];
      try {
          await axios.put(`${API_CONFIG.BASE_URL}/comment/updateTextForStackComment/${commentId}`,
             { text }, 
             { headers: { 'Authorization': token } }
          );
          setComments(prev => prev.map(c => c.comment_Id === commentId ? { ...c, text } : c));
      } catch (error) { console.error("Update failed", error); }
  };

  const handleCommentDelete = async (commentId) => {
      if(!window.confirm("Видалити коментар?")) return;
      try {
          await axios.delete(`${API_CONFIG.BASE_URL}/comment/deleteStackComment/${commentId}`, {
              headers: { 'Authorization': authHeader.split(' ')[1] }
          });
          setComments(prev => prev.filter(c => c.comment_Id !== commentId));
      } catch (error) { console.error("Delete failed", error); }
  };

  if (!stack) return <div className="loading">Завантаження...</div>;

  return (
    <div className="stack-page-container">
      <div className="stack-page-header">
        <h1 className="stack-page-title">{stack.name}</h1>
        <h2 className="stack-page-author">{stack.User?.nickname}</h2>
      </div>

      <h3 className="stack-section-heading">Опис стеку:</h3>
      <p className="stack-page-description">{stack.description}</p>

      <h3 className="stack-section-heading">Ресурси у цьому стеку:</h3>
      <div className="stack-resources-list">
          {stack.Resources?.map(res => (
              <div 
                key={res.resource_Id} 
                className="stack-resource-card"
                onClick={() => navigate(`/library/resource/${res.resource_Id}`)}
              >
                  <div className="stack-res-title">{res.name}</div>
                  <div className="stack-res-producer">{res.producer || "Unknown"}</div>
              </div>
          ))}
          {(!stack.Resources || stack.Resources.length === 0) && <p style={{paddingLeft: '16px', color: '#666'}}>Ресурсів немає</p>}
      </div>

      <div className="stack-stats-bar">
        <button 
            className={`stack-stat-item ${isLiked ? 'active' : ''}`} 
            onClick={handleStackLike}
        >
          <ThumbsUp size={20} fill={isLiked ? "currentColor" : "none"} /> 
          <span>{likesCount}</span>
        </button>
        
        <div className="stack-stat-item view-only">
            <Eye size={20} /> 
            <span>{stack.views_cache}</span>
        </div>
      </div>

      <CommentsSection 
        comments={comments} 
        currentUserId={currentUserId}
        onSubmit={handleCommentSubmit}
        onUpdate={handleCommentUpdate}
        onDelete={handleCommentDelete}
      />
    </div>
  );
};

export default StackPage;
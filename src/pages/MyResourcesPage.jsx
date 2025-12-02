import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_CONFIG from '../config/api';
import useAuthHeader from 'react-auth-kit/hooks/useAuthHeader';
import { MoreVertical, Plus, ThumbsUp, Eye } from 'lucide-react';
import './styles/MyResourcesPage.css';

const MyResourcesPage = () => {
    const { userId } = useParams();
    const authHeader = useAuthHeader();
    const navigate = useNavigate();
    const [resources, setResources] = useState([]);
    const [linkTypes, setLinkTypes] = useState([]);
    const [directions, setDirections] = useState([]);
    
    // Modal & Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentResourceId, setCurrentResourceId] = useState(null);
    const [formErrors, setFormErrors] = useState({});
    
    const initialFormState = {
        name: '',
        description: '',
        link_to_resource: '',
        origination_date: '',
        producer: '',
        link_type_Id: '',
        direction_Ids: []
    };
    const [formData, setFormData] = useState(initialFormState);

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            if(!authHeader) return;
            const token = authHeader.split(' ')[1];
            const config = { headers: { 'Authorization': token } };

            try {
                const [resResources, resLinkTypes, resDirections] = await Promise.all([
                    axios.get(`${API_CONFIG.BASE_URL}/resource/getAllByAuthor/${userId}`, config),
                    axios.get(`${API_CONFIG.BASE_URL}/linkType/getAll`, config),
                    axios.get(`${API_CONFIG.BASE_URL}/developmentDirection/getAll`, config)
                ]);

                setResources(resResources.data);
                setLinkTypes(resLinkTypes.data);
                setDirections(resDirections.data);
            } catch (error) {
                console.error("Error loading data:", error);
            }
        };
        fetchData();
    }, [userId, authHeader]);

    // Actions

    const handleDelete = async (resourceId) => {
        if(!window.confirm("Ви впевнені, що хочете видалити цей ресурс?")) return;
        
        try {
            const token = authHeader.split(' ')[1];
            await axios.delete(`${API_CONFIG.BASE_URL}/resource/delete/${resourceId}`, {
                headers: { 'Authorization': token }
            });
            setResources(prev => prev.filter(r => r.resource_Id !== resourceId));
        } catch (error) {
            console.error("Delete failed:", error);
            alert("Не вдалося видалити ресурс");
        }
    };

    const openAddModal = () => {
        setFormData(initialFormState);
        setFormErrors({});
        setIsEditMode(false);
        setIsModalOpen(true);
    };

    const openEditModal = (resource) => {
        setFormData({
            name: resource.name,
            description: resource.description,
            link_to_resource: resource.link_to_resource,
            origination_date: resource.origination_date ? resource.origination_date.split('T')[0] : '',
            producer: resource.producer || '',
            link_type_Id: resource.link_type_Id || '',
            direction_Ids: resource.DevelopmentDirections 
                ? resource.DevelopmentDirections.map(d => d.development_direction_Id) 
                : []
        });
        setCurrentResourceId(resource.resource_Id);
        setFormErrors({});
        setIsEditMode(true);
        setIsModalOpen(true);
    };

    // Validation
    const validateForm = () => {
        let errors = {};
        let isValid = true;

        // Name
        if (!formData.name || !formData.name.trim()) {
            errors.name = "Назва обов'язкова";
            isValid = false;
        } else if (formData.name.length > 255) {
            errors.name = "Назва занадто довга (макс 255)";
            isValid = false;
        }

        // Description
        if (!formData.description || !formData.description.trim()) {
            errors.description = "Опис обов'язковий";
            isValid = false;
        }

        // Link
        if (!formData.link_to_resource || !formData.link_to_resource.trim()) {
            errors.link_to_resource = "Посилання обов'язкове";
            isValid = false;
        } else if (formData.link_to_resource.length > 2083) {
            errors.link_to_resource = "Посилання занадто довге";
            isValid = false;
        }

        // Producer
        if (formData.producer && !formData.producer.trim()) {
            errors.producer = "Поле не може містити лише пробіли";
            isValid = false;
        }

        // Link Type
        if (!formData.link_type_Id) {
            errors.link_type_Id = "Оберіть тип посилання";
            isValid = false;
        }

        setFormErrors(errors);
        return isValid;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        const token = authHeader.split(' ')[1];
        const config = { headers: { 'Authorization': token } };
        
        const payload = {
            ...formData,
            producer: formData.producer.trim() === '' ? null : formData.producer
        };

        try {
            let response;
            if (isEditMode) {
                response = await axios.put(`${API_CONFIG.BASE_URL}/resource/${currentResourceId}`, payload, config);
                
                // Update local list
                setResources(prev => prev.map(r => 
                    r.resource_Id === currentResourceId ? response.data : r
                ));
            } else {
                response = await axios.post(`${API_CONFIG.BASE_URL}/resource/create`, payload, config);
                // Add to local list
                setResources(prev => [response.data, ...prev]);
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error("Save failed:", error);
            // Handle backend unique constraint error
            if (error.response?.data?.message?.toLowerCase().includes("unique")) {
                setFormErrors(prev => ({ ...prev, name: "Ресурс з такою назвою вже існує" }));
            } else {
                alert("Помилка при збереженні: " + (error.response?.data?.message || error.message));
            }
        }
    };

    const handleDirectionChange = (id) => {
        const currentIds = [...formData.direction_Ids];
        if (currentIds.includes(id)) {
            setFormData({ ...formData, direction_Ids: currentIds.filter(x => x !== id) });
        } else {
            setFormData({ ...formData, direction_Ids: [...currentIds, id] });
        }
    };

    return (
        <div className="my-resources-page">
            <div className="page-header">
                <h1 className="page-title">Мої ресурси</h1>
                <button className="add-resource-btn" onClick={openAddModal} title="Додати ресурс">
                    <Plus size={32} />
                </button>
            </div>

            <div className="resources-list">
                {resources.map(resource => (
                    <ResourceListItem 
                        key={resource.resource_Id} 
                        resource={resource} 
                        onEdit={() => openEditModal(resource)}
                        onDelete={() => handleDelete(resource.resource_Id)}
                        onNavigate={() => navigate(`/library/resource/${resource.resource_Id}`)}
                    />
                ))}
                {resources.length === 0 && <p style={{color: '#666'}}>У вас поки немає створених ресурсів.</p>}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={(e) => { if(e.target === e.currentTarget) setIsModalOpen(false) }}>
                    <div className="modal-content">
                        <h2 className="modal-title">{isEditMode ? 'Редагування ресурсу' : 'Новий ресурс'}</h2>
                        <div className="resource-form">
                            
                            <div className="form-group">
                                <label className="form-label">Назва *</label>
                                <input 
                                    type="text" className="form-input" 
                                    value={formData.name} 
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                />
                                {formErrors.name && <span className="error-text">{formErrors.name}</span>}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Посилання *</label>
                                <input 
                                    type="text" className="form-input" 
                                    value={formData.link_to_resource} 
                                    onChange={(e) => setFormData({...formData, link_to_resource: e.target.value})}
                                />
                                {formErrors.link_to_resource && <span className="error-text">{formErrors.link_to_resource}</span>}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Тип посилання *</label>
                                <select 
                                    className="form-select"
                                    value={formData.link_type_Id}
                                    onChange={(e) => setFormData({...formData, link_type_Id: e.target.value})}
                                >
                                    <option value="">Оберіть тип...</option>
                                    {linkTypes.map(lt => (
                                        <option key={lt.link_type_Id} value={lt.link_type_Id}>{lt.link_type_name}</option>
                                    ))}
                                </select>
                                {formErrors.link_type_Id && <span className="error-text">{formErrors.link_type_Id}</span>}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Опис *</label>
                                <textarea 
                                    className="form-textarea" rows="4"
                                    value={formData.description} 
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                />
                                {formErrors.description && <span className="error-text">{formErrors.description}</span>}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Виробник</label>
                                <input 
                                    type="text" className="form-input" 
                                    value={formData.producer} 
                                    onChange={(e) => setFormData({...formData, producer: e.target.value})}
                                />
                                {formErrors.producer && <span className="error-text">{formErrors.producer}</span>}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Дата виникнення</label>
                                <input 
                                    type="date" className="form-input" 
                                    value={formData.origination_date} 
                                    onChange={(e) => setFormData({...formData, origination_date: e.target.value})}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Напрямки</label>
                                <div className="direction-select-container">
                                    {directions.map(dir => (
                                        <div key={dir.development_direction_Id} className="direction-checkbox-item">
                                            <input 
                                                type="checkbox" 
                                                id={`dir-${dir.development_direction_Id}`}
                                                checked={formData.direction_Ids.includes(dir.development_direction_Id)}
                                                onChange={() => handleDirectionChange(dir.development_direction_Id)}
                                            />
                                            <label 
                                                htmlFor={`dir-${dir.development_direction_Id}`}
                                                className="checkbox-label"
                                            >
                                                {dir.development_direction_name || "Unnamed Direction"}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button className="btn-cancel" onClick={() => setIsModalOpen(false)}>Скасувати</button>
                                <button className="btn-save" onClick={handleSubmit}>Зберегти</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const ResourceListItem = ({ resource, onEdit, onDelete, onNavigate }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);

    const isVerified = resource.is_verified;

    useEffect(() => {
        const handleClickOutside = (e) => {
            if(menuRef.current && !menuRef.current.contains(e.target)) setIsMenuOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Only navigate if verified
    const handleCardClick = () => {
        if (isVerified) {
            onNavigate();
        }
    };

    return (
        // Add 'disabled' class if not verified to kill hover effects in CSS
        <div className={`resource-list-item ${!isVerified ? 'disabled' : ''}`}>
            
            <div className="resource-info" onClick={handleCardClick}>
                <div className="resource-name">
                    {resource.name}
                    {resource.is_recommended && (
                        <span className="recommended-tick" title="Рекомендовано">✔</span>
                    )}
                </div>
                
                <div className="resource-meta">
                    <span>Опубліковано: {new Date(resource.publish_date).toLocaleDateString('uk-UA')}</span>
                    <div className="resource-stats">
                        <span><ThumbsUp size={14} style={{marginRight:'4px'}} /> {resource.likes_cache}</span>
                        <span><Eye size={14} style={{marginRight:'4px'}} /> {resource.views_cache}</span>
                    </div>
                </div>
            </div>

            <div className={`status-badge ${isVerified ? 'verified' : 'unverified'}`}>
                {isVerified ? 'Верифіковано' : 'Не верифіковано'}
            </div>

            <div className="resource-actions" ref={menuRef}>
                <button className="action-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                    <MoreVertical size={20} />
                </button>
                {isMenuOpen && (
                    <div className="context-menu">
                        <button className="context-menu-item" onClick={() => { setIsMenuOpen(false); onEdit(); }}>
                            Редагувати
                        </button>
                        <button className="context-menu-item delete" onClick={() => { setIsMenuOpen(false); onDelete(); }}>
                            Видалити
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyResourcesPage;
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import API_CONFIG from '../config/api';
import useAuthHeader from 'react-auth-kit/hooks/useAuthHeader';
import { MoreVertical, Plus, ThumbsUp, Eye, Trash2 } from 'lucide-react';
import './styles/MyResourcesPage.css';
import './styles/MyStacksPage.css';

const MyStacksPage = () => {
    const { userId } = useParams();
    const authHeader = useAuthHeader();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    
    const [stacks, setStacks] = useState([]);
    
    // Modal & Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalStep, setModalStep] = useState('form'); // 'form' | 'success_create'
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentStackId, setCurrentStackId] = useState(null);
    const [currentStackResources, setCurrentStackResources] = useState([]);
    const [formErrors, setFormErrors] = useState({});

    // Toast State (Undo logic)
    const [toast, setToast] = useState(null); // { message, undoAction: fn }

    const initialFormState = {
        name: '',
        description: ''
    };
    const [formData, setFormData] = useState(initialFormState);

    // Fetch Stacks
    const fetchStacks = async () => {
        if(!authHeader) return;
        const token = authHeader.split(' ')[1];
        try {
            const response = await axios.get(`${API_CONFIG.BASE_URL}/stack/getAllByAuthor/${userId}`, {
                headers: { 'Authorization': token }
            });
            setStacks(response.data);
        } catch (error) {
            console.error("Error loading stacks:", error);
        }
    };

    useEffect(() => {
        fetchStacks();
    }, [userId, authHeader]);

    // Check for return from Library (Open Edit Mode)
    useEffect(() => {
        const openEdit = searchParams.get('openEdit');
        const stackIdParam = searchParams.get('stackId');

        if (openEdit === 'true' && stackIdParam && authHeader) {
            const token = authHeader.split(' ')[1];
            axios.get(`${API_CONFIG.BASE_URL}/stack/getById/${stackIdParam}`, {
                headers: { 'Authorization': token }
            })
            .then(res => {
                const stack = res.data;
                openEditModal(stack);
                setSearchParams({});
            })
            .catch(err => console.error("Failed to fetch stack for edit:", err));
        }
    }, [searchParams, authHeader]);

    // Scroll restoration
    useEffect(() => {
        if (isEditMode && currentStackResources.length > 0) {
            const savedScroll = sessionStorage.getItem('stackFormScroll');
            const listElement = document.querySelector('.stack-resources-list-edit');
            
            if (savedScroll && listElement) {
                // Невелика затримка, щоб DOM встиг відмалюватися
                setTimeout(() => {
                    listElement.scrollTop = parseInt(savedScroll, 10);
                    // Очищаємо, щоб не скролило при звичайному відкритті
                    sessionStorage.removeItem('stackFormScroll'); 
                }, 100);
            }
        }
    }, [isEditMode, currentStackResources]);

    const handleViewResource = (resourceId) => {
        const listElement = document.querySelector('.stack-resources-list-edit');
        if (listElement) {
            sessionStorage.setItem('stackFormScroll', listElement.scrollTop);
        }
        navigate(`/library/resource/${resourceId}?returnToStack=true&stackId=${currentStackId}`);
    };

    const handleDeleteStack = async (stackId) => {
        if(!window.confirm("Ви впевнені, що хочете видалити цей стек?")) return;
        
        try {
            const token = authHeader.split(' ')[1];
            await axios.delete(`${API_CONFIG.BASE_URL}/stack/delete/${stackId}`, {
                headers: { 'Authorization': token }
            });
            setStacks(prev => prev.filter(s => s.stack_Id !== stackId));
        } catch (error) {
            console.error("Delete failed:", error);
            alert("Не вдалося видалити стек");
        }
    };

    const handleRemoveResource = async (resourceId) => {
        const token = authHeader.split(' ')[1];
        
        const removedResource = currentStackResources.find(r => r.resource_Id === resourceId);
        setCurrentStackResources(prev => prev.filter(r => r.resource_Id !== resourceId));

        setStacks(prevStacks => prevStacks.map(stack => {
            if (stack.stack_Id === currentStackId) {
                const updatedResources = (stack.Resources || []).filter(r => r.resource_Id !== resourceId);
                return { ...stack, Resources: updatedResources };
            }
            return stack;
        }));

        try {
            await axios.delete(`${API_CONFIG.BASE_URL}/stack/removeResource/${currentStackId}/${resourceId}`, {
                headers: { 'Authorization': token }
            });

            showToast(`Ресурс "${removedResource.name}" видалено.`, async () => {
                try {
                    await axios.post(`${API_CONFIG.BASE_URL}/stack/addResource/${currentStackId}/${resourceId}`, {}, {
                        headers: { 'Authorization': token }
                    });
                    
                    setCurrentStackResources(prev => [...prev, removedResource]);
                    setStacks(prevStacks => prevStacks.map(stack => {
                        if (stack.stack_Id === currentStackId) {
                            const currentRes = stack.Resources || [];
                            return { ...stack, Resources: [...currentRes, removedResource] };
                        }
                        return stack;
                    }));
                    
                    setToast(null);
                } catch (e) {
                    console.error("Undo failed", e);
                    alert("Не вдалося відновити ресурс");
                }
            });

        } catch (error) {
            console.error("Remove resource failed:", error);
            setCurrentStackResources(prev => [...prev, removedResource]);
            setStacks(prevStacks => prevStacks.map(stack => {
                if (stack.stack_Id === currentStackId) {
                    const currentRes = stack.Resources || [];
                    return { ...stack, Resources: [...currentRes, removedResource] };
                }
                return stack;
            }));
            alert("Помилка видалення ресурсу");
        }
    };

    const showToast = (message, undoAction) => {
        setToast({ message, undoAction });
        setTimeout(() => setToast(null), 5000);
    };

    const openAddModal = () => {
        setFormData(initialFormState);
        setFormErrors({});
        setIsEditMode(false);
        setModalStep('form');
        setIsModalOpen(true);
    };

    const openEditModal = (stack) => {
        setFormData({
            name: stack.name,
            description: stack.description
        });
        setCurrentStackId(stack.stack_Id);
        setCurrentStackResources(stack.Resources || []);
        
        setFormErrors({});
        setIsEditMode(true);
        setModalStep('form');
        setIsModalOpen(true);
    };

    const validateForm = () => {
        let errors = {};
        let isValid = true;
        if (!formData.name.trim()) {
            errors.name = "Назва обов'язкова";
            isValid = false;
        }
        if (!formData.description.trim()) {
            errors.description = "Опис обов'язковий";
            isValid = false;
        }
        setFormErrors(errors);
        return isValid;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;
        const token = authHeader.split(' ')[1];
        
        try {
            if (isEditMode) {
                // Update
                const response = await axios.put(`${API_CONFIG.BASE_URL}/stack/${currentStackId}`, formData, {
                    headers: { 'Authorization': token }
                });
                
                setStacks(prev => prev.map(s => s.stack_Id === currentStackId ? { ...s, ...formData } : s));
                alert("Інформацію оновлено"); 

            } else {
                // Create
                const response = await axios.post(`${API_CONFIG.BASE_URL}/stack/create`, formData, {
                    headers: { 'Authorization': token }
                });
                const newStack = response.data;
                setStacks(prev => [newStack, ...prev]);
                setCurrentStackId(newStack.stack_Id);
                setModalStep('success_create');
            }
        } catch (error) {
            console.error("Save failed:", error);
            if (error.response?.data?.message?.includes("unique")) {
                setFormErrors({ ...formErrors, name: "Стек з такою назвою вже існує" });
            }
        }
    };

    const goToAddResources = () => {
        navigate(`/library?stackId=${currentStackId}`);
    };

    return (
        <div className="my-resources-page">
            <div className="page-header">
                <h1 className="page-title">Мої Стеки</h1>
                <button className="add-resource-btn" onClick={openAddModal} title="Створити стек">
                    <Plus size={32} />
                </button>
            </div>

            <div className="resources-list">
                {stacks.map(stack => (
                    <StackListItem 
                        key={stack.stack_Id} 
                        stack={stack} 
                        onEdit={() => openEditModal(stack)}
                        onDelete={() => handleDeleteStack(stack.stack_Id)}
                        onNavigate={() => navigate(`/library/stack/${stack.stack_Id}`)}
                    />
                ))}
                {stacks.length === 0 && <p style={{color: '#666'}}>У вас поки немає створених стеків.</p>}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={(e) => { if(e.target === e.currentTarget) setIsModalOpen(false) }}>
                    <div className="modal-content">
                        
                        {!isEditMode && modalStep === 'success_create' && (
                            <div className="modal-step-success">
                                <h2 className="modal-title">Стек створено!</h2>
                                <p style={{marginBottom: '20px', color: '#333'}}>
                                    Додати ресурси до стеку <b>{formData.name}</b>?
                                </p>
                                <div className="modal-actions-centered">
                                    <button className="btn-cancel" onClick={() => setIsModalOpen(false)}>Не зараз</button>
                                    <button className="btn-save" onClick={goToAddResources}>Додати ресурси</button>
                                </div>
                            </div>
                        )}

                        {(isEditMode || modalStep === 'form') && (
                            <>
                                <h2 className="modal-title">{isEditMode ? 'Редагування стеку' : 'Новий стек'}</h2>
                                <div className="resource-form">
                                    <div className="form-group">
                                        <label className="form-label">Назва</label>
                                        <input 
                                            type="text" className="form-input" 
                                            value={formData.name} 
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        />
                                        {formErrors.name && <span className="error-text">{formErrors.name}</span>}
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Опис</label>
                                        <textarea 
                                            className="form-textarea" rows="3"
                                            value={formData.description} 
                                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        />
                                        {formErrors.description && <span className="error-text">{formErrors.description}</span>}
                                    </div>
                                    
                                    <div style={{display: 'flex', justifyContent: 'flex-end'}}>
                                        <button className="btn-save" style={{width:'auto'}} onClick={handleSubmit}>
                                            Зберегти інформацію
                                        </button>
                                    </div>

                                    {isEditMode && (
                                        <>
                                            <hr className="modal-divider"/>
                                            <h3 className="modal-subtitle">Ресурси у стеку:</h3>
                                            <div className="stack-resources-list-edit">
                                                {currentStackResources.map(res => (
                                                    <div 
                                                    key={res.resource_Id} 
                                                    className="stack-res-item-edit clickable-row" 
                                                    onClick={() => handleViewResource(res.resource_Id)}
                                                    title="Переглянути деталі ресурсу"
                                                >
                                                    <span className="res-name">
                                                        {res.name}
                                                    </span>
                                                    
                                                    <button 
                                                        className="btn-icon-remove" 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRemoveResource(res.resource_Id);
                                                        }}
                                                        title="Видалити зі стеку"
                                                    >
                                                        [ - ]
                                                    </button>
                                                </div>
                                                ))}
                                                {currentStackResources.length === 0 && <span className="empty-text">Стек порожній</span>}
                                            </div>
                                            
                                            <button className="btn-add-resource-dashed" onClick={goToAddResources}>
                                                [ + Додати ресурси ]
                                            </button>
                                        </>
                                    )}

                                    <div className="modal-actions">
                                        <button className="btn-cancel" onClick={() => setIsModalOpen(false)}>Закрити</button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast && (
                <div className="toast-notification">
                    <span>{toast.message}</span>
                    <div className="toast-actions">
                        <button onClick={toast.undoAction} className="toast-undo">Відміна</button>
                        <button onClick={() => setToast(null)} className="toast-close">ОК</button>
                    </div>
                </div>
            )}
        </div>
    );
};

const StackListItem = ({ stack, onEdit, onDelete, onNavigate }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);

    const isVerified = stack.is_verified || false; 

    useEffect(() => {
        const handleClickOutside = (e) => {
            if(menuRef.current && !menuRef.current.contains(e.target)) setIsMenuOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleCardClick = () => {
        if (isVerified) onNavigate();
    };

    return (
        <div className={`resource-list-item ${!isVerified ? 'disabled' : ''} ${isMenuOpen ? 'z-index-active' : ''}`}>
            <div className="resource-info" onClick={handleCardClick}>
                <div className="resource-name">
                    {stack.name}
                    {stack.is_recommended && <span className="recommended-tick">✔</span>}
                </div>
                
                <div className="resource-meta">
                     <span>Створено: {new Date(stack.creation_date).toLocaleDateString('uk-UA')}</span>
                     <div className="resource-stats">
                        <span><ThumbsUp size={14} style={{marginRight:'4px'}} /> {stack.likes_cache}</span>
                        <span><Eye size={14} style={{marginRight:'4px'}} /> {stack.views_cache}</span>
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

export default MyStacksPage;
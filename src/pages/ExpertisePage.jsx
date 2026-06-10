import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, User, Calendar, ChevronRight, ArrowUpDown, X } from 'lucide-react';
import useAuthUser from 'react-auth-kit/hooks/useAuthUser';
import useAuthHeader from 'react-auth-kit/hooks/useAuthHeader';
import dayjs from 'dayjs';
import axios from 'axios';
import API_CONFIG from '../config/api.js';
import './styles/ClientPages.css';
import './styles/ExpertisePage.css';

const STATUS_LABEL = {
    'pending':   'Очікує',
    'in-review': 'На перевірці',
    'reviewed':  'Перевірено',
};

const ProjectCard = ({ project, onClick }) => (
    <div
        className="item-card expertise-card"
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && onClick()}
    >
        <div className="card-header">
            <h3>{project.name}</h3>
            <span className={`expertise-status-badge status-${project.status}`}>
                {STATUS_LABEL[project.status] || project.status}
            </span>
        </div>

        <p className="expertise-card-description">
            {project.description && project.description.length > 140
                ? project.description.slice(0, 140) + '…'
                : (project.description || '')}
        </p>

        <div className="expertise-card-meta">
            <span className="expertise-meta-item">
                <User size={14} />
                {project.author_nickname}
            </span>
            <span className="expertise-meta-item">
                <Calendar size={14} />
                {dayjs(project.creation_date).format('DD.MM.YYYY')}
            </span>
        </div>

        <div className="expertise-card-footer">
            <span className="expertise-details-link">
                Переглянути <ChevronRight size={15} />
            </span>
        </div>
    </div>
);

const ExpertisePage = () => {
    const navigate = useNavigate();
    const authUser = useAuthUser();

    const [projects, setProjects] = useState([]);
    const [statusFilter, setStatusFilter] = useState('');
    const [sortDir, setSortDir] = useState('desc');
    const [requestModalOpen, setRequestModalOpen] = useState(false);
    const [onlyMyExpertises, setOnlyMyExpertises] = useState(false);
    const [hasActiveRequest, setHasActiveRequest] = useState(false);

    const isStudent = authUser && authUser.role === 'student';
    const isAlreadyExpert = authUser && (authUser.role === 'expert' || authUser.role === 'admin');

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const response = await axios.get(`${API_CONFIG.BASE_URL}/project/getAll`);
                setProjects(response.data);
            } catch (error) {
                console.error("Error fetching projects:", error);
            }
        };
        fetchProjects();
    }, []);

    useEffect(() => {
        if (isStudent && authUser) {
            const pending = localStorage.getItem(`expert_request_pending_${authUser.user_Id}`) === 'true';
            setHasActiveRequest(pending);
        }
    }, [isStudent, authUser]);

    const displayed = useMemo(() => {
        let result = statusFilter
            ? projects.filter(p => p.status === statusFilter)
            : [...projects];
            
        if (onlyMyExpertises && authUser) {
            result = result.filter(p => p.reviewers && p.reviewers.some(r => r.user_Id === authUser.user_Id));
        }

        result.sort((a, b) => {
            const diff = new Date(a.creation_date) - new Date(b.creation_date);
            return sortDir === 'asc' ? diff : -diff;
        });
        return result;
    }, [projects, statusFilter, sortDir, onlyMyExpertises, authUser]);

    return (
        <div className="client-page">
            {requestModalOpen && (
                <ExpertRequestModal
                    authUser={authUser}
                    onClose={() => setRequestModalOpen(false)}
                    onRequestSubmitted={() => setHasActiveRequest(true)}
                />
            )}
            <div className="expertise-page-header">
                <h1 className="page-title">Експертиза проєктів</h1>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    {isStudent && !hasActiveRequest && (
                        <button
                            className="action-btn-outline"
                            onClick={() => setRequestModalOpen(true)}
                        >
                            Стати експертом
                        </button>
                    )}
                    {isStudent && hasActiveRequest && (
                        <span className="expert-request-pending-badge">Запит надіслано</span>
                    )}
                    {authUser && (
                        <button
                            className="action-btn"
                            onClick={() => navigate('/expertise/upload')}
                        >
                            <Plus size={18} />
                            Завантажити проєкт
                        </button>
                    )}
                </div>
            </div>

            <div className="expertise-controls">
                <div className="expertise-filter-group">
                    {['', 'pending', 'in-review', 'reviewed'].map(s => (
                        <button
                            key={s}
                            className={`expertise-filter-btn ${statusFilter === s ? 'active' : ''}`}
                            onClick={() => setStatusFilter(s)}
                        >
                            {s === '' ? 'Усі' : STATUS_LABEL[s]}
                        </button>
                    ))}
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {isAlreadyExpert && (
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-color)', fontSize: '0.9rem' }}>
                            <input 
                                type="checkbox" 
                                checked={onlyMyExpertises} 
                                onChange={e => setOnlyMyExpertises(e.target.checked)} 
                            />
                            Мої експертизи
                        </label>
                    )}
                    <button
                        className="expertise-sort-btn"
                        onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
                        title={sortDir === 'desc' ? 'Спочатку старі' : 'Спочатку нові'}
                    >
                        <ArrowUpDown size={15} />
                        {sortDir === 'desc' ? 'Спочатку старі' : 'Спочатку нові'}
                    </button>
                </div>
            </div>

            {displayed.length === 0 ? (
                <p className="expertise-empty">Проєктів не знайдено.</p>
            ) : (
                <div className="expertise-grid">
                    {displayed.map(project => (
                        <ProjectCard
                            key={project.project_Id}
                            project={project}
                            onClick={() => navigate(`/expertise/${project.project_Id}`)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ExpertisePage;

function ExpertRequestModal({ authUser, onClose, onRequestSubmitted }) {
    const [message, setMessage] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const authHeader = useAuthHeader();

    const handleSubmit = async () => {
        try {
            await axios.post(
                `${API_CONFIG.BASE_URL}/expertRequest/create`,
                { message: message.trim() || null },
                {
                    headers: {
                        'Authorization': authHeader
                    }
                }
            );
            if (authUser) {
                localStorage.setItem(`expert_request_pending_${authUser.user_Id}`, 'true');
            }
            if (onRequestSubmitted) {
                onRequestSubmitted();
            }
            setSubmitted(true);
        } catch (error) {
            console.error('Error submitting expert request:', error);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={e => e.stopPropagation()}>
                <div className="modal-card__header">
                    <h2 className="modal-card__title">Запит на роль експерта</h2>
                    <button className="modal-card__close" onClick={onClose} aria-label="Закрити">
                        <X size={18} />
                    </button>
                </div>
                {submitted ? (
                    <div className="modal-card__body">
                        <p style={{ color: 'var(--text-color)', marginBottom: '1rem' }}>
                            Ваш запит надіслано! Адміністратор розгляне його найближчасом.
                        </p>
                        <button className="action-btn" onClick={onClose}>Закрити</button>
                    </div>
                ) : (
                    <div className="modal-card__body">
                        <p className="modal-card__hint">
                            Напишіть повідомлення для адміністратора (необов’язково).
                        </p>
                        <textarea
                            className="upload-form__textarea"
                            rows={4}
                            placeholder="Наприклад: чому ви хочете стати експертом…"
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                        />
                        <div className="modal-card__actions">
                            <button className="cancel-btn-text" onClick={onClose}>Скасувати</button>
                            <button className="action-btn" onClick={handleSubmit}>Надіслати запит</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, User, Calendar, ChevronRight, ArrowUpDown } from 'lucide-react';
import useAuthUser from 'react-auth-kit/hooks/useAuthUser';
import dayjs from 'dayjs';
import { MOCK_PROJECTS } from '../mocks/expertiseMockData.js';
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
            {project.description.length > 140
                ? project.description.slice(0, 140) + '…'
                : project.description}
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

    const [projects] = useState(MOCK_PROJECTS);
    const [statusFilter, setStatusFilter] = useState('');
    const [sortDir, setSortDir] = useState('desc');

    const displayed = useMemo(() => {
        let result = statusFilter
            ? projects.filter(p => p.status === statusFilter)
            : [...projects];
        result.sort((a, b) => {
            const diff = new Date(a.creation_date) - new Date(b.creation_date);
            return sortDir === 'asc' ? diff : -diff;
        });
        return result;
    }, [projects, statusFilter, sortDir]);

    return (
        <div className="client-page">
            <div className="expertise-page-header">
                <h1 className="page-title">Експертиза проєктів</h1>
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
                <button
                    className="expertise-sort-btn"
                    onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
                    title={sortDir === 'desc' ? 'Спочатку нові' : 'Спочатку старі'}
                >
                    <ArrowUpDown size={15} />
                    {sortDir === 'desc' ? 'Спочатку нові' : 'Спочатку старі'}
                </button>
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

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthHeader from 'react-auth-kit/hooks/useAuthHeader';
import ProjectCardList from '../components/ProjectCardList.jsx';
import NewProjectModal from '../components/NewProjectModal.jsx';
import InteractiveGuideComponent from '../components/InteractiveGuideComponent.jsx';
import API_CONFIG from '../config/api.js';
import './styles/Projects.css';

const normalizeProject = (p) => ({
    id: p.project_Id ?? p.project_id ?? p.id,
    name: p.name,
    description: p.description ?? null,
    created_at: p.creation_date ?? p.created_at ?? null,
});

const ProjectsPage = () => {
    const navigate = useNavigate();
    const authHeader = useAuthHeader();
    const [projects, setProjects] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [loadError, setLoadError] = useState(null);

    useEffect(() => {
        const token = authHeader?.split(' ')[1] ?? null;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        fetch(`${API_CONFIG.BASE_URL}/project/getAll`, { headers })
            .then((r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then((data) => {
                const list = Array.isArray(data) ? data : (data.projects ?? []);
                setProjects(list.map(normalizeProject));
            })
            .catch((err) => {
                console.error('[ProjectsPage] load failed', err);
                setLoadError('Failed to load projects. Check your connection.');
            });
    }, [authHeader]);

    const handleCreate = async ({ name, description }) => {
        setIsCreating(true);
        const token = authHeader?.split(' ')[1] ?? null;
        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
        try {
            const r = await fetch(`${API_CONFIG.BASE_URL}/project/create`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ name, description }),
            });
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            const data = await r.json();
            const newId = data.project_id ?? data.id;
            navigate(`/projects/${newId}`);
        } catch (err) {
            console.error('[ProjectsPage] create failed', err);
            setIsCreating(false);
            setIsModalOpen(false);
        }
    };

    return (
        <div className="projects-page">
            <div className="projects-page__container">
                <div className="projects-page__top">
                    <div className="projects-page__header">
                        <h1 className="projects-page__title">
                            <span>My</span> Projects
                        </h1>
                        <p className="projects-page__sub">
                            Select one of your projects or create a new one
                        </p>
                        <button
                            className="projects-page__new-btn"
                            onClick={() => setIsModalOpen(true)}
                        >
                            + New Project
                        </button>
                    </div>
                    <InteractiveGuideComponent />
                </div>
                <div className="project-page__count">
                    {loadError
                        ? loadError
                        : `You have ${projects.length} ${projects.length === 1 ? 'project' : 'projects'}`}
                </div>
                <ProjectCardList
                    projects={projects}
                    onNew={() => setIsModalOpen(true)}
                />
            </div>

            {isModalOpen && (
                <NewProjectModal
                    onClose={() => !isCreating && setIsModalOpen(false)}
                    onSubmit={handleCreate}
                    isSubmitting={isCreating}
                />
            )}
        </div>
    );
};

export default ProjectsPage;

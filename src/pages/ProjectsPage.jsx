import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthHeader from 'react-auth-kit/hooks/useAuthHeader';
import useAuthUser from 'react-auth-kit/hooks/useAuthUser';
import ProjectCardList from '../components/ProjectCardList.jsx';
import NewProjectModal from '../components/NewProjectModal.jsx';
import EditProjectModal from '../components/EditProjectModal.jsx';
import ConfirmDeleteProjectModal from '../components/ConfirmDeleteProjectModal.jsx';
import InteractiveGuideComponent from '../components/InteractiveGuideComponent.jsx';
import API_CONFIG from '../config/api.js';
import { clearLocalProject } from '../utils/serializer.js';
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
    const authUser = useAuthUser();
    const username = authUser?.username ?? null;
    const [projects, setProjects] = useState([]);
    const [loadError, setLoadError] = useState(null);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [createError, setCreateError] = useState(null);

    const [editTarget, setEditTarget] = useState(null); // project | null
    const [isEditing, setIsEditing] = useState(false);
    const [editError, setEditError] = useState(null);

    const [deleteTarget, setDeleteTarget] = useState(null); // project | null
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState(null);

    const buildHeaders = (withJson = false) => {
        const token = authHeader?.split(' ')[1] ?? null;
        return {
            ...(withJson ? { 'Content-Type': 'application/json' } : {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
    };

    useEffect(() => {
        fetch(`${API_CONFIG.BASE_URL}/project/getAll/normalisation`, { headers: buildHeaders() })
            .then((r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then((data) => {
                const list = Array.isArray(data) ? data : (data.projects ?? []);
                const mine = list.filter((p) => p.author_nickname === username);
                setProjects(mine.map(normalizeProject));
            })
            .catch((err) => {
                console.error('[ProjectsPage] load failed', err);
                setLoadError('Не вдалося завантажити проекти. Перевірте підключення.');
            });
    }, [authHeader, username]);

    const handleCreate = async ({ name, description }) => {
        setIsCreating(true);
        setCreateError(null);
        try {
            const r = await fetch(`${API_CONFIG.BASE_URL}/project/create`, {
                method: 'POST',
                headers: buildHeaders(true),
                // Without isnormalisation the project won't be returned by
                // /getAll/normalisation after reload.
                body: JSON.stringify({ name, description, isnormalisation: true }),
            });
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            const data = await r.json();
            const newId = data.project_id ?? data.id;
            // Auto-increment ids can be reused after a DB reset — a stale snapshot
            // under this id would trigger a bogus conflict modal in the editor.
            clearLocalProject(newId);
            navigate(`/projects/${newId}`);
        } catch (err) {
            console.error('[ProjectsPage] create failed', err);
            setIsCreating(false);
            setCreateError('Не вдалося створити проект. Будь ласка, спробуйте ще раз.');
        }
    };

    const handleEdit = async ({ name, description }) => {
        setIsEditing(true);
        setEditError(null);
        try {
            const r = await fetch(`${API_CONFIG.BASE_URL}/project/${editTarget.id}`, {
                method: 'PUT',
                headers: buildHeaders(true),
                body: JSON.stringify({ name, description }),
            });
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            setProjects((prev) =>
                prev.map((p) => (p.id === editTarget.id ? { ...p, name, description } : p))
            );
            setEditTarget(null);
        } catch (err) {
            console.error('[ProjectsPage] edit failed', err);
            setEditError('Не вдалося зберегти зміни. Будь ласка, спробуйте ще раз.');
        } finally {
            setIsEditing(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        setDeleteError(null);
        try {
            const r = await fetch(`${API_CONFIG.BASE_URL}/project/delete/${deleteTarget.id}`, {
                method: 'DELETE',
                headers: buildHeaders(),
            });
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            clearLocalProject(deleteTarget.id);
            setProjects((prev) => prev.filter((p) => p.id !== deleteTarget.id));
            setDeleteTarget(null);
        } catch (err) {
            console.error('[ProjectsPage] delete failed', err);
            setDeleteError('Не вдалося видалити проект. Будь ласка, спробуйте ще раз.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="projects-page">
            <div className="projects-page__container">
                <div className="projects-page__top">
                    <div className="projects-page__header">
                        <h1 className="projects-page__title">
                            <span>Мої</span> Проекти
                        </h1>
                        <p className="projects-page__sub">
                            Оберіть один з ваших проектів або створіть новий
                        </p>
                        <button
                            className="projects-page__new-btn"
                            onClick={() => { setCreateError(null); setIsCreateOpen(true); }}
                        >
                            + Новий проект
                        </button>
                    </div>
                    <InteractiveGuideComponent />
                </div>
                <div className="project-page__count">
                    {loadError
                        ? loadError
                        : `У вас ${projects.length} ${
                            projects.length % 10 === 1 && projects.length % 100 !== 11
                                ? 'проект'
                                : projects.length % 10 >= 2 && projects.length % 10 <= 4 && (projects.length % 100 < 10 || projects.length % 100 >= 20)
                                    ? 'проекти'
                                    : 'проектів'
                        }`}
                </div>
                <ProjectCardList
                    projects={projects}
                    onNew={() => { setCreateError(null); setIsCreateOpen(true); }}
                    onEdit={(project) => { setEditError(null); setEditTarget(project); }}
                    onDelete={(project) => { setDeleteError(null); setDeleteTarget(project); }}
                />
            </div>

            {isCreateOpen && (
                <NewProjectModal
                    onClose={() => !isCreating && setIsCreateOpen(false)}
                    onSubmit={handleCreate}
                    isSubmitting={isCreating}
                    error={createError}
                />
            )}
            {editTarget && (
                <EditProjectModal
                    project={editTarget}
                    onClose={() => !isEditing && setEditTarget(null)}
                    onSubmit={handleEdit}
                    isSubmitting={isEditing}
                    error={editError}
                />
            )}
            {deleteTarget && (
                <ConfirmDeleteProjectModal
                    projectName={deleteTarget.name}
                    onConfirm={handleDelete}
                    onCancel={() => setDeleteTarget(null)}
                    isDeleting={isDeleting}
                    error={deleteError}
                />
            )}
        </div>
    );
};

export default ProjectsPage;

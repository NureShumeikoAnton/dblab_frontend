import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import './styles/ProjectCard.css';

const ProjectCard = ({ project, onEdit, onDelete }) => {
    const navigate = useNavigate();

    const date = new Date(project.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });

    return (
        <article
            className="project-card"
            onClick={() => navigate(`/projects/${project.id}`)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate(`/projects/${project.id}`)}
            aria-label={`Open project: ${project.name}`}
        >
            <div className="project-card__accent" />
            <div className="project-card__actions">
                <button
                    className="project-card__action"
                    onClick={(e) => { e.stopPropagation(); onEdit(project); }}
                    title="Edit project"
                    aria-label={`Edit project: ${project.name}`}
                >
                    <Pencil size={13} />
                </button>
                <button
                    className="project-card__action project-card__action--danger"
                    onClick={(e) => { e.stopPropagation(); onDelete(project); }}
                    title="Delete project"
                    aria-label={`Delete project: ${project.name}`}
                >
                    <Trash2 size={13} />
                </button>
            </div>
            <div className="project-card__body">
                <h3 className="project-card__name">{project.name}</h3>
                <p className="project-card__desc">
                    {project.description || 'No description provided.'}
                </p>
            </div>
            <div className="project-card__footer">
                <span className="project-card__date">{date}</span>
                <span className="project-card__open-hint">Open →</span>
            </div>
        </article>
    );
};

export default ProjectCard;

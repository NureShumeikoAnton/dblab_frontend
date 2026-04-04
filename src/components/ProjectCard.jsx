import React from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/ProjectCard.css';

const ProjectCard = ({ project }) => {
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

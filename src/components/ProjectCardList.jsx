import React from 'react';
import ProjectCard from './ProjectCard.jsx';
import './styles/ProjectCardList.css';

const EmptyState = ({ onNew }) => (
    <div className="pcl-empty">
        <div className="pcl-empty__icon" aria-hidden="true">
            <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="8" y="18" width="40" height="56" rx="4" stroke="#0094c8" strokeWidth="1.8" strokeDasharray="5 3" opacity="0.5"/>
                <rect x="8" y="18" width="40" height="13" rx="4" fill="#0094c8" fillOpacity="0.08"/>
                <line x1="8"  y1="31" x2="48" y2="31" stroke="#0094c8" strokeWidth="1.2" opacity="0.3"/>
                <line x1="16" y1="42" x2="38" y2="42" stroke="#0094c8" strokeWidth="1" opacity="0.2"/>
                <line x1="16" y1="52" x2="34" y2="52" stroke="#0094c8" strokeWidth="1" opacity="0.2"/>
                <line x1="16" y1="62" x2="40" y2="62" stroke="#0094c8" strokeWidth="1" opacity="0.2"/>
                <rect x="72" y="8"  width="40" height="38" rx="4" stroke="#F59650" strokeWidth="1.8" strokeDasharray="5 3" opacity="0.5"/>
                <rect x="72" y="8"  width="40" height="13" rx="4" fill="#F59650" fillOpacity="0.08"/>
                <line x1="72" y1="21" x2="112" y2="21" stroke="#F59650" strokeWidth="1.2" opacity="0.3"/>
                <line x1="80" y1="32" x2="102" y2="32" stroke="#F59650" strokeWidth="1" opacity="0.2"/>
                <rect x="72" y="58" width="40" height="30" rx="4" stroke="#0094c8" strokeWidth="1.8" strokeDasharray="5 3" opacity="0.5"/>
                <rect x="72" y="58" width="40" height="13" rx="4" fill="#0094c8" fillOpacity="0.08"/>
                <line x1="72" y1="71" x2="112" y2="71" stroke="#0094c8" strokeWidth="1.2" opacity="0.3"/>
                <path d="M48 46 Q60 46 72 27" stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="4 2" fill="none" opacity="0.5"/>
                <path d="M48 46 Q60 46 72 73" stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="4 2" fill="none" opacity="0.5"/>
            </svg>
        </div>
        <h3 className="pcl-empty__title">No projects yet</h3>
        <p className="pcl-empty__sub">
            Build your first normalized database schema —<br/>
            from raw data all the way to 3NF.
        </p>
        <button className="pcl-empty__btn" onClick={onNew}>
            + Create your first project
        </button>
    </div>
);

const ProjectCardList = ({ projects, onNew }) => {
    if (projects.length === 0) {
        return <EmptyState onNew={onNew} />;
    }

    return (
        <div className="pcl-grid">
            {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
            ))}
        </div>
    );
};

export default ProjectCardList;

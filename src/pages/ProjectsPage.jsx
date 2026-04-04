import React, { useState } from 'react';
import { MOCK_PROJECT, MOCK_STAGES } from '../store/mockData.js';
import ProjectCardList from '../components/ProjectCardList.jsx';
import NewProjectModal from '../components/NewProjectModal.jsx';
import InteractiveGuideComponent from '../components/InteractiveGuideComponent.jsx';
import './styles/Projects.css';

const MOCK_PROJECTS = [
    {
        ...MOCK_PROJECT,
        created_at: '2026-03-10',
        stages: MOCK_STAGES,
    },
];

const ProjectsPage = () => {
    const [projects] = useState(MOCK_PROJECTS);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleCreate = ({ name, description }) => {
        console.log('[ProjectsPage] New project submitted:', { name, description });
        setIsModalOpen(false);
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
                    You have {projects.length} {projects.length === 1 ? 'project' : 'projects'}
                </div>
                <ProjectCardList
                    projects={projects}
                    onNew={() => setIsModalOpen(true)}
                />
            </div>

            {isModalOpen && (
                <NewProjectModal
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={handleCreate}
                />
            )}
        </div>
    );
};

export default ProjectsPage;

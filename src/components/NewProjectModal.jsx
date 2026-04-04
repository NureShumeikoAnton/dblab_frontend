import React, { useState } from 'react';
import './styles/NewProjectModal.css';

const NewProjectModal = ({ onClose, onSubmit }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        console.log('[NewProjectModal] Submitting:', { name, description });
        onSubmit({ name, description });
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <div className="npm-overlay" onClick={handleOverlayClick}>
            <div className="npm-modal" role="dialog" aria-modal="true" aria-labelledby="npm-title">
                <div className="npm-modal__strip" />
                <div className="npm-modal__inner">
                    <div className="npm-modal__head">
                        <h2 className="npm-modal__title" id="npm-title">New Project</h2>
                        <button className="npm-modal__close" onClick={onClose} aria-label="Close">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                        </button>
                    </div>

                    <form className="npm-form" onSubmit={handleSubmit}>
                        <div className="npm-field">
                            <label className="npm-field__label" htmlFor="npm-name">
                                Project name <span className="npm-field__req">*</span>
                            </label>
                            <input
                                id="npm-name"
                                className="npm-field__input"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Library Management System"
                                autoFocus
                                required
                            />
                        </div>
                        <div className="npm-field">
                            <label className="npm-field__label" htmlFor="npm-desc">
                                Description{' '}
                                <span className="npm-field__opt">optional</span>
                            </label>
                            <textarea
                                id="npm-desc"
                                className="npm-field__textarea"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="What domain does this schema model?"
                                rows={3}
                            />
                        </div>
                        <div className="npm-actions">
                            <button type="button" className="npm-btn npm-btn--ghost" onClick={onClose}>
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="npm-btn npm-btn--primary"
                                disabled={!name.trim()}
                            >
                                Create project
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default NewProjectModal;

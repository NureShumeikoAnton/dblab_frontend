import React, { useState } from 'react';
import './styles/EditProjectModal.css';

const EditProjectModal = ({ project, onClose, onSubmit, isSubmitting = false, error = null }) => {
    const [name, setName] = useState(project.name ?? '');
    const [description, setDescription] = useState(project.description ?? '');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSubmit({ name: name.trim(), description });
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
    };

    return (
        <div className="epm-overlay" onClick={handleOverlayClick}>
            <div className="epm-modal" role="dialog" aria-modal="true" aria-labelledby="epm-title">
                <div className="epm-modal__strip" />
                <div className="epm-modal__inner">
                    <div className="epm-modal__head">
                        <h2 className="epm-modal__title" id="epm-title">Редагувати проект</h2>
                        <button className="epm-modal__close" onClick={onClose} aria-label="Закрити">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                        </button>
                    </div>

                    <form className="epm-form" onSubmit={handleSubmit}>
                        <div className="epm-field">
                            <label className="epm-field__label" htmlFor="epm-name">
                                Назва проекту <span className="epm-field__req">*</span>
                            </label>
                            <input
                                id="epm-name"
                                className="epm-field__input"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoFocus
                                required
                            />
                        </div>
                        <div className="epm-field">
                            <label className="epm-field__label" htmlFor="epm-desc">
                                Опис{' '}
                                <span className="epm-field__opt">необов'язково</span>
                            </label>
                            <textarea
                                id="epm-desc"
                                className="epm-field__textarea"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                            />
                        </div>
                        {error && <div className="epm-error" role="alert">{error}</div>}
                        <div className="epm-actions">
                            <button type="button" className="epm-btn epm-btn--ghost" onClick={onClose}>
                                Скасувати
                            </button>
                            <button
                                type="submit"
                                className="epm-btn epm-btn--primary"
                                disabled={!name.trim() || isSubmitting}
                            >
                                {isSubmitting ? 'Збереження…' : 'Зберегти зміни'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditProjectModal;

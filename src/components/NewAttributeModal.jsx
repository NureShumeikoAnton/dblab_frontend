import React, { useState, useEffect } from 'react';
import './styles/NewAttributeModal.css';

const DATA_TYPES = ['INT', 'VARCHAR', 'TEXT', 'DATE', 'BOOLEAN', 'DECIMAL', 'TIMESTAMP', 'UUID'];

const NewAttributeModal = ({ isOpen, mode, onClose, onSubmit }) => {
    const [name, setName] = useState('');
    const [dataType, setDataType] = useState('VARCHAR');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setName('');
            setDataType('VARCHAR');
            setError('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) {
            setError('Name is required.');
            return;
        }
        onSubmit({ name: trimmed, data_type: dataType });
    };

    const subtitle =
        mode === 'global'
            ? 'Available from: 0NF (all stages)'
            : 'Available from: this stage';

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal__header">
                    <div>
                        <h2 className="modal__title">Add attribute</h2>
                        <p className="modal__subtitle">{subtitle}</p>
                    </div>
                    <button className="modal__close" onClick={onClose}>×</button>
                </div>
                <form className="modal__form" onSubmit={handleSubmit}>
                    <label className="modal__label">
                        Name
                        <input
                            className="modal__input"
                            type="text"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                setError('');
                            }}
                            autoFocus
                            placeholder="e.g. customer_id"
                        />
                        {error && <span className="modal__error">{error}</span>}
                    </label>
                    <label className="modal__label">
                        Data type
                        {/* TODO: replace with custom select component */}
                        <select
                            className="modal__select"
                            value={dataType}
                            onChange={(e) => setDataType(e.target.value)}
                        >
                            {DATA_TYPES.map((t) => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </label>
                    <div className="modal__actions">
                        <button type="button" className="modal__btn modal__btn--secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="modal__btn modal__btn--primary">
                            Add
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewAttributeModal;

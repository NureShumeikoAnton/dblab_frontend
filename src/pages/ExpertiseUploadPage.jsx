import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import useAuthUser from 'react-auth-kit/hooks/useAuthUser';
import { useToast } from '../context/ToastContext.jsx';
import { MOCK_PROJECTS, MOCK_DATA_MODELS, DATA_MODEL_TYPES, TYPE_LABEL } from '../mocks/expertiseMockData.js';
import './styles/ClientPages.css';
import './styles/ExpertiseUploadPage.css';

const ExpertiseUploadPage = () => {
    const navigate = useNavigate();
    const authUser = useAuthUser();
    const { addToast } = useToast();

    React.useEffect(() => {
        if (authUser === null) navigate('/expertise', { replace: true });
    }, [authUser, navigate]);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [dataModels, setDataModels] = useState([{ link: '', type: 'er_model' }]);
    const [errors, setErrors] = useState({});

    const handleModelChange = (index, field, value) => {
        setDataModels(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m));
    };

    const handleAddModel = () => {
        setDataModels(prev => [...prev, { link: '', type: 'er_model' }]);
    };

    const handleRemoveModel = (index) => {
        setDataModels(prev => prev.filter((_, i) => i !== index));
    };

    const validate = () => {
        const e = {};
        if (!name.trim()) e.name = "Назва обов'язкова";
        if (dataModels.some(m => !m.link.trim())) e.dataModels = 'Усі посилання на моделі мають бути заповнені';
        return e;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) {
            setErrors(errs);
            return;
        }

        const newId = Math.max(...MOCK_PROJECTS.map(p => p.project_Id)) + 1;
        MOCK_PROJECTS.push({
            project_Id: newId,
            name: name.trim(),
            description: description.trim(),
            creation_date: new Date().toISOString(),
            status: 'pending',
            is_for_expertise: true,
            is_for_normalization: false,
            author_user_Id: authUser?.user_Id ?? null,
            author_nickname: authUser?.username ?? 'Невідомий',
        });

        let nextModelId = Math.max(...MOCK_DATA_MODELS.map(m => m.data_model_Id), 0) + 1;
        dataModels.forEach(m => {
            MOCK_DATA_MODELS.push({
                data_model_Id: nextModelId++,
                file: m.link.trim(),
                type: m.type,
                upload_date: new Date().toISOString(),
                project_Id: newId,
            });
        });

        addToast('Проєкт успішно завантажено!', 'success');
        navigate('/expertise');
    };

    return (
        <div className="client-page">
            <button className="cancel-btn-text" onClick={() => navigate('/expertise')}>
                <ArrowLeft size={16} /> Назад до списку
            </button>

            <h1 className="page-title">Завантажити проєкт</h1>

            <form className="upload-form" onSubmit={handleSubmit} noValidate>
                <div className="upload-form__field">
                    <label className="upload-form__label">Назва *</label>
                    <input
                        className={`upload-form__input ${errors.name ? 'input-error' : ''}`}
                        type="text"
                        placeholder="Назва проєкту"
                        value={name}
                        onChange={e => {
                            setName(e.target.value);
                            setErrors(prev => ({ ...prev, name: undefined }));
                        }}
                    />
                    {errors.name && <span className="upload-form__error">{errors.name}</span>}
                </div>

                <div className="upload-form__field">
                    <label className="upload-form__label">Опис</label>
                    <textarea
                        className="upload-form__textarea"
                        placeholder="Короткий опис проєкту..."
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        rows={4}
                    />
                </div>

                <div className="upload-form__field">
                    <label className="upload-form__label">Моделі даних *</label>

                    {dataModels.map((model, index) => (
                        <div key={index} className="model-row">
                            <select
                                className="upload-form__select"
                                value={model.type}
                                onChange={e => handleModelChange(index, 'type', e.target.value)}
                            >
                                {DATA_MODEL_TYPES.map(t => (
                                    <option key={t} value={t}>{TYPE_LABEL[t]}</option>
                                ))}
                            </select>
                            <input
                                className={`upload-form__input ${errors.dataModels && !model.link.trim() ? 'input-error' : ''}`}
                                type="url"
                                placeholder="Посилання (Google Drive тощо)"
                                value={model.link}
                                onChange={e => {
                                    handleModelChange(index, 'link', e.target.value);
                                    setErrors(prev => ({ ...prev, dataModels: undefined }));
                                }}
                            />
                            {dataModels.length > 1 && (
                                <button
                                    type="button"
                                    className="model-remove-btn"
                                    onClick={() => handleRemoveModel(index)}
                                    title="Видалити модель"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    ))}

                    {errors.dataModels && <span className="upload-form__error">{errors.dataModels}</span>}

                    <button type="button" className="action-btn-outline model-add-btn" onClick={handleAddModel}>
                        <Plus size={15} /> Додати модель
                    </button>
                </div>

                <div className="upload-form__actions">
                    <button type="submit" className="action-btn">Завантажити</button>
                    <button type="button" className="cancel-btn-text" onClick={() => navigate('/expertise')}>
                        Скасувати
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ExpertiseUploadPage;

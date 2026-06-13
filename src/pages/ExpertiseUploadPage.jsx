import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import useAuthUser from 'react-auth-kit/hooks/useAuthUser';
import useAuthHeader from 'react-auth-kit/hooks/useAuthHeader';
import axios from 'axios';
import API_CONFIG from '../config/api.js';
import { useToast } from '../context/ToastContext.jsx';
import './styles/ClientPages.css';
import './styles/ExpertiseUploadPage.css';

const DATA_MODEL_TYPES = ['conceptual_model', 'er_model', 'logical_model', 'physical_model', 'other'];

const TYPE_LABEL = {
    'conceptual_model': 'Концептуальна модель (UML)',
    'er_model': 'ЕR-модель',
    'logical_model': 'Логічна модель',
    'physical_model': 'Фізична модель',
    'other': 'Інше',
};

const ExpertiseUploadPage = () => {
    const navigate = useNavigate();
    const authUser = useAuthUser();
    const { addToast } = useToast();

    React.useEffect(() => {
        if (authUser === null) navigate('/expertise', { replace: true });
    }, [authUser, navigate]);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [dataModels, setDataModels] = useState([{ file: null, type: 'er_model' }]);
    const [errors, setErrors] = useState({});
    const authHeader = useAuthHeader();

    const handleModelChange = (index, field, value) => {
        setDataModels(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m));
    };

    const handleAddModel = () => {
        setDataModels(prev => [...prev, { file: null, type: 'er_model' }]);
    };

    const handleRemoveModel = (index) => {
        setDataModels(prev => prev.filter((_, i) => i !== index));
    };

    const validate = () => {
        const e = {};
        if (!name.trim()) e.name = "Назва обов'язкова";
        if (dataModels.some(m => !m.file)) {
            e.dataModels = 'Усі файли моделей мають бути завантажені';
        } else {
            const allowedExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.txt', '.sql', '.json'];
            const hasInvalidFile = dataModels.some(m => {
                if (!m.file || !m.file.name) return true;
                const ext = m.file.name.slice(m.file.name.lastIndexOf('.')).toLowerCase();
                return !allowedExtensions.includes(ext);
            });
            if (hasInvalidFile) {
                e.dataModels = 'Дозволені формати: png, jpg, jpeg, webp, txt, sql, json';
            }
        }
        return e;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) {
            setErrors(errs);
            return;
        }

        try {
            // 1. Create project
            const response = await axios.post(
                `${API_CONFIG.BASE_URL}/project/create`,
                { name: name.trim(), description: description.trim(), isexpertise: true },
                {
                    headers: {
                        'Authorization': authHeader
                    }
                }
            );

            const createdProject = response.data;
            const project_id = createdProject.project_id || createdProject.project_Id;

            // 2. Upload each data model
            for (const model of dataModels) {
                if (model.file) {
                    const formData = new FormData();
                    formData.append('file', model.file);
                    formData.append('type', model.type);

                    await axios.post(
                        `${API_CONFIG.BASE_URL}/model/create/${project_id}`,
                        formData,
                        {
                            headers: {
                                'Content-Type': 'multipart/form-data',
                                'Authorization': authHeader
                            }
                        }
                    );
                }
            }

            addToast('Проєкт успішно завантажено!', 'success');
            navigate('/expertise');
        } catch (error) {
            console.error('Error uploading project:', error);
            addToast('Не вдалося завантажити проєкт', 'error');
        }
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
                                className={`upload-form__input ${errors.dataModels && !model.file ? 'input-error' : ''}`}
                                type="file"
                                accept=".png,.jpg,.jpeg,.webp,.txt,.sql,.json"
                                onChange={e => {
                                    handleModelChange(index, 'file', e.target.files[0]);
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

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Calendar, FileSpreadsheet, FileText, FileCode, ExternalLink, Star, Plus, Trash2, X } from 'lucide-react';
import useAuthUser from 'react-auth-kit/hooks/useAuthUser';
import useAuthHeader from 'react-auth-kit/hooks/useAuthHeader';
import dayjs from 'dayjs';
import axios from 'axios';
import API_CONFIG from '../config/api.js';
import { CommentInput, CommentThread } from '../components/ProjectComments.jsx';
import './styles/ClientPages.css';
import './styles/ExpertiseProjectPage.css';

const STATUS_LABEL = {
    'pending':   'Очікує',
    'in-review': 'На перевірці',
    'reviewed':  'Перевірено',
};

const TYPE_LABEL = {
    'conceptual_model': 'Концептуальна модель (UML)',
    'er_model': 'ER-модель',
    'logical_model': 'Логічна модель',
    'physical_model': 'Фізична модель',
    'other': 'Інше',
};

function ModelIcon({ type }) {
    const typeIconMap = {
        'conceptual_model': <FileText size={16} />,
        'er_model':         <FileSpreadsheet size={16} />,
        'logical_model':    <FileSpreadsheet size={16} />,
        'physical_model':   <FileCode size={16} />,
        'other':            <FileText size={16} />,
    };
    return typeIconMap[type] || <FileText size={16} />;
}

const ExpertiseProjectPage = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const authUser = useAuthUser();
    const authHeader = useAuthHeader();

    const pid = parseInt(projectId);

    const [localProject, setLocalProject] = useState(null);
    const [dataModels, setDataModels] = useState([]);
    const [localExpertises, setLocalExpertises] = useState([]);
    const [allComments, setAllComments] = useState([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchProjectData = async () => {
        try {
            const response = await axios.get(`${API_CONFIG.BASE_URL}/project/${pid}`);
            const project = response.data;
            
            setLocalProject({
                ...project,
                author_nickname: project.author?.nickname,
            });
            setDataModels(project.models || []);
            setLocalExpertises((project.expertises || []).map(e => ({
                ...e,
                expert_nickname: e.expert?.nickname,
                expert_user_Id: e.expert?.user_Id,
                attachments: (e.attachments || []).map(a => ({
                    ...a,
                    link: `${API_CONFIG.BASE_URL}/imbed/photo/file/${a.link_url || a.link}`
                }))
            })));
            
            setAllComments(project.comments || []);
            
            setLoading(false);
        } catch (error) {
            console.error('Error fetching project:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjectData();
    }, [pid]);

    const isAdmin = authUser && authUser.role === 'admin';
    const isExpert = authUser && (authUser.role === 'expert' || authUser.role === 'admin');
    const isAuthor = authUser && localProject && authUser.user_Id === localProject.user_id;
    
    const myDraftExpertise = localExpertises.find(e => e.end_date === null && e.expert_user_Id === authUser?.user_Id);
    const hasCompletedReview = localExpertises.some(e => e.end_date !== null && e.expert_user_Id === authUser?.user_Id);
    const isMyClaim = !!myDraftExpertise;
    const canClaim = isExpert && !isMyClaim && !hasCompletedReview;
    
    const pendingReviewers = localExpertises.filter(e => e.end_date === null);

    const handleToggleArchive = async () => {
        try {
            await axios.put(`${API_CONFIG.BASE_URL}/project/archive/${pid}`, {}, {
                headers: { 'Authorization': authHeader }
            });
            await fetchProjectData();
        } catch (error) {
            console.error('Error toggling archive:', error);
        }
    };

    const [reviewScore, setReviewScore] = useState('');
    const [reviewText, setReviewText] = useState('');
    const [reviewAttachments, setReviewAttachments] = useState([{ file: null }]);

    if (loading) {
        return <div className="client-page"><p className="expertise-empty">Завантаження...</p></div>;
    }

    if (!localProject) {
        return (
            <div className="client-page">
                <p className="expertise-empty">Проєкт не знайдено.</p>
                <div className="project-page-actions">
                    <button className="cancel-btn-text" onClick={() => navigate('/expertise')}>
                        <ArrowLeft size={16} /> Назад
                    </button>
                </div>
            </div>
        );
    }

    const handleDeleteProject = async () => {
        try {
            await axios.delete(`${API_CONFIG.BASE_URL}/project/delete/${pid}`, {
                headers: { 'Authorization': authHeader }
            });
            setShowDeleteModal(false);
            navigate('/expertise');
        } catch (err) {
            console.error('Error deleting project', err);
            alert('Помилка при видаленні проєкту');
        }
    };

    const handleClaim = async () => {
        try {
            await axios.post(`${API_CONFIG.BASE_URL}/expertise/create/${pid}`, {}, {
                headers: { 'Authorization': authHeader }
            });
            await fetchProjectData();
        } catch (error) {
            console.error('Error claiming expertise:', error);
        }
    };

    const handleUnclaim = async () => {
        const draftId = myDraftExpertise?.expertise_Id;
        if (!draftId) return;
        try {
            await axios.delete(`${API_CONFIG.BASE_URL}/expertise/delete/${draftId}`, {
                headers: { 'Authorization': authHeader }
            });
            await fetchProjectData();
            setReviewScore(''); setReviewText(''); setReviewAttachments([{ file: null }]);
        } catch (error) {
            console.error('Error unclaiming expertise:', error);
        }
    };

    const handleSubmitReview = async () => {
        const score = parseInt(reviewScore);
        if (isNaN(score) || score < 0 || score > 100) return false;
        if (!reviewText.trim()) return false;
        
        const draftId = myDraftExpertise?.expertise_Id;
        if (!draftId) return false;

        try {
            await axios.put(`${API_CONFIG.BASE_URL}/expertise/update/${draftId}`, {
                score,
                review_text: reviewText.trim()
            }, {
                headers: { 'Authorization': authHeader }
            });

            const validAttachments = reviewAttachments.filter(a => a.file);
            for (const att of validAttachments) {
                const formData = new FormData();
                formData.append('photo', att.file);
                await axios.post(`${API_CONFIG.BASE_URL}/imbed/create/${draftId}`, formData, {
                    headers: { 'Authorization': authHeader, 'Content-Type': 'multipart/form-data' }
                });
            }

            await fetchProjectData();
            return true;
        } catch (error) {
            console.error('Error submitting review:', error);
            return false;
        }
    };

    const addComment = async (text, expertiseId = null, replyToId = null) => {
        try {
            await axios.post(`${API_CONFIG.BASE_URL}/projectComment/create`, {
                text,
                projectId: pid,
                expertiseId: expertiseId,
                reply_to_id: replyToId
            }, {
                headers: { 'Authorization': authHeader }
            });
            await fetchProjectData();
        } catch (error) {
            console.error('Error adding comment:', error);
        }
    };

    const handleSaveEdit = async (id, newText) => {
        try {
            await axios.put(`${API_CONFIG.BASE_URL}/projectComment/${id}`, {
                text: newText
            }, {
                headers: { 'Authorization': authHeader }
            });
            await fetchProjectData();
        } catch (error) {
            console.error('Error editing comment:', error);
        }
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`${API_CONFIG.BASE_URL}/projectComment/delete/${id}`, {
                headers: { 'Authorization': authHeader }
            });
            await fetchProjectData();
        } catch (error) {
            console.error('Error deleting comment:', error);
        }
    };

    const handleDeleteExpertise = async (expertiseId) => {
        if (!window.confirm("Видалити цю експертизу?")) return;
        try {
            await axios.delete(`${API_CONFIG.BASE_URL}/expertise/delete/${expertiseId}`, {
                headers: { 'Authorization': authHeader }
            });
            await fetchProjectData();
        } catch (err) {
            console.error('Error deleting expertise', err);
            alert('Помилка при видаленні експертизи');
        }
    };

    const projectComments = allComments.filter(c => !c.expertise_Id);
    const handleContinueThread = (commentId) => navigate(`/expertise/${projectId}/comment/${commentId}`);
    const completedExpertises = localExpertises.filter(e => e.end_date !== null);

    return (
        <div className="client-page">
            {showDeleteModal && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <div className="modal-card__header">
                            <h2>Видалення проєкту</h2>
                            <button className="modal-card__close" onClick={() => setShowDeleteModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-card__body">
                            <p>
                                Ви впевнені, що хочете видалити проєкт <strong>{localProject.name}</strong>?
                            </p>
                            <p className="confirm-delete-warning">
                                Ця дія є незворотною.
                            </p>
                            <div className="modal-card__actions">
                                <button className="cancel-btn-text" onClick={() => setShowDeleteModal(false)}>
                                    Скасувати
                                </button>
                                <button className="action-btn" onClick={handleDeleteProject} style={{ background: 'var(--danger-color)' }}>
                                    Видалити
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="project-page-actions-container">
                <button className="cancel-btn-text cancel-btn-text-no-margin" onClick={() => navigate('/expertise')}>
                    <ArrowLeft size={16} /> Назад до списку
                </button>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    {isAdmin && (
                        <button className="action-btn-outline action-btn-outline-primary" onClick={handleToggleArchive}>
                            {localProject.isarchived ? 'Відновити з архіву' : 'Заархівувати'}
                        </button>
                    )}
                    {(isAdmin || (!localProject.isarchived && isAuthor)) && (
                        <button className="action-btn-outline" style={{ borderColor: 'var(--danger-color)', color: 'var(--danger-color)' }} onClick={() => setShowDeleteModal(true)}>
                            <Trash2 size={16} /> Видалити
                        </button>
                    )}
                </div>
            </div>

            {localProject.isarchived && (
                <div className="archive-banner">
                    Цей проєкт архівовано. Зміни заборонені.
                </div>
            )}

            <div className="project-detail-header">
                <div>
                    <h1 className="project-detail-title">{localProject.name}</h1>
                    <div className="project-detail-meta">
                        <span className="expertise-meta-item"><User size={14} />Автор: {localProject.author_nickname}</span>
                        <span className="expertise-meta-item"><Calendar size={14} />{dayjs(localProject.creation_date).format('DD.MM.YYYY')}</span>
                    </div>
                    {pendingReviewers.length > 0 && (
                        <div className="project-detail-meta project-detail-meta-pending">
                            <span className="expertise-meta-item">
                                <User size={14} /> В процесі: {pendingReviewers.map((r, idx) => (
                                    <React.Fragment key={r.expertise_Id}>
                                        {r.expert_nickname}
                                        {isAdmin && (
                                            <button className="cancel-btn-text" style={{ padding: 0, margin: '0 4px', color: 'var(--danger-color)' }} onClick={() => handleDeleteExpertise(r.expertise_Id)}>
                                                <X size={12} />
                                            </button>
                                        )}
                                        {idx < pendingReviewers.length - 1 ? ', ' : ''}
                                    </React.Fragment>
                                ))}
                            </span>
                        </div>
                    )}
                    {completedExpertises.length > 0 && (
                        <div className="project-detail-meta project-detail-meta-completed">
                            <span className="expertise-meta-item">
                                <User size={14} /> Перевірено експертами: {completedExpertises.map(r => r.expert_nickname).join(', ')}
                            </span>
                        </div>
                    )}
                </div>
                <div className="expert-actions-container">
                    <span className={`expertise-status-badge status-${localProject.status}`}>
                        {STATUS_LABEL[localProject.status] || localProject.status}
                    </span>
                    {canClaim && !localProject.isarchived && <button className="action-btn" onClick={handleClaim}>Взяти на експертизу</button>}
                    {isMyClaim && !localProject.isarchived && <button className="btn-danger-outline" onClick={handleUnclaim}>Відмовитись</button>}
                </div>
            </div>

            {localProject.description && (
                <p className="project-detail-description">{localProject.description}</p>
            )}

            <DataModelsSection dataModels={dataModels} />

            <section className="project-section">
                <h2 className="section-title">Експертні оцінки</h2>
                {isMyClaim && myDraftExpertise && !localProject.isarchived && (
                    <ReviewForm
                        reviewScore={reviewScore} setReviewScore={setReviewScore}
                        reviewText={reviewText} setReviewText={setReviewText}
                        reviewAttachments={reviewAttachments} setReviewAttachments={setReviewAttachments}
                        onSubmit={handleSubmitReview}
                    />
                )}
                {completedExpertises.length === 0 && !isMyClaim ? (
                    <p className="project-section__empty">Оцінок ще немає.</p>
                ) : (
                    <div className="expertise-list">
                        {completedExpertises.map(ex => (
                            <ExpertiseReviewCard
                                key={ex.expertise_Id}
                                expertise={ex}
                                allComments={allComments}
                                authUser={authUser}
                                addComment={addComment}
                                onSaveEdit={handleSaveEdit}
                                onDelete={handleDelete}
                                onContinueThread={handleContinueThread}
                                isArchived={localProject.isarchived}
                                isAdmin={isAdmin}
                                onDeleteExpertise={handleDeleteExpertise}
                            />
                        ))}
                    </div>
                )}
            </section>

            <section className="project-section">
                <h2 className="section-title">Коментарі ({projectComments.length})</h2>
                {(!localProject.isarchived && authUser) && <CommentInput onSubmit={(text) => addComment(text, null)} />}
                <CommentThread
                    comments={projectComments}
                    currentUserId={authUser?.user_Id}
                    isArchived={localProject.isarchived}
                    onAdd={(text, replyToId) => addComment(text, null, replyToId)}
                    onSaveEdit={handleSaveEdit}
                    onDelete={handleDelete}
                    onContinueThread={handleContinueThread}
                    isArchived={localProject.isarchived}
                />
            </section>
        </div>
    );
};

export default ExpertiseProjectPage;

// ── Sub-components ────────────────────────────────────────────────────────────

function DataModelsSection({ dataModels }) {
    return (
        <section className="project-section">
            <h2 className="section-title">Моделі даних</h2>
            {dataModels.length === 0 ? (
                <p className="project-section__empty">Моделі відсутні.</p>
            ) : (
                <ul className="model-list">
                    {dataModels.map(m => (
                        <li key={m.data_model_Id} className="model-list__item">
                            <span className="model-list__icon"><ModelIcon type={m.type} /></span>
                            <span className="model-list__type">{TYPE_LABEL[m.type] || m.type}</span>
                            <a href={`${API_CONFIG.BASE_URL}/model/photo/file/${m.file_url || m.file}`} target="_blank" rel="noopener noreferrer" className="model-list__link">
                                {m.file_url || m.file} <ExternalLink size={13} />
                            </a>
                            <span className="model-list__date">{dayjs(m.upload_date).format('DD.MM.YYYY')}</span>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

function ExpertiseReviewCard({ expertise: ex, allComments, authUser, addComment, onSaveEdit, onDelete, onContinueThread, isArchived, isAdmin, onDeleteExpertise }) {
    const exComments = allComments.filter(c => c.expertise_Id === ex.expertise_Id);
    return (
        <div className="expertise-review-card">
            <div className="expertise-review-header">
                <span className="expertise-review-expert"><User size={14} /> {ex.expert_nickname}</span>
                {ex.score !== null && (
                    <span className="expertise-review-score"><Star size={14} /> {ex.score} / 100</span>
                )}
                <span className="expertise-review-dates">
                    {dayjs(ex.begin_date).format('DD.MM.YYYY')}
                    {ex.end_date && ` — ${dayjs(ex.end_date).format('DD.MM.YYYY')}`}
                </span>
                {isAdmin && (
                    <button className="cancel-btn-text" style={{ marginLeft: 'auto', padding: 0, color: 'var(--danger-color)' }} onClick={() => onDeleteExpertise(ex.expertise_Id)}>
                        <Trash2 size={14} />
                    </button>
                )}
            </div>
            {ex.review_text && <p className="expertise-review-text">{ex.review_text}</p>}
            {ex.attachments?.length > 0 && (
                <div className="expertise-review-attachments">
                    {ex.attachments.map(a => (
                        <a key={a.attachment_Id} href={a.link} target="_blank" rel="noopener noreferrer" className="model-list__link">
                            <ExternalLink size={13} /> Додаток
                        </a>
                    ))}
                </div>
            )}
            <div className="expertise-comment-section">
                <p className="expertise-comment-title">Коментарі до оцінки ({exComments.length})</p>
                {(!isArchived && authUser) && (
                    <CommentInput
                        placeholder="Коментар до цієї оцінки…"
                        onSubmit={(text) => addComment(text, ex.expertise_Id)}
                    />
                )}
                <CommentThread
                    comments={exComments}
                    currentUserId={authUser?.user_Id}
                    isArchived={isArchived}
                    onAdd={(text, replyToId) => addComment(text, ex.expertise_Id, replyToId)}
                    onSaveEdit={onSaveEdit}
                    onDelete={onDelete}
                    onContinueThread={onContinueThread}
                />
            </div>
        </div>
    );
}

function ReviewForm({ reviewScore, setReviewScore, reviewText, setReviewText, reviewAttachments, setReviewAttachments, onSubmit }) {
    const [errors, setErrors] = useState({});

    const validate = () => {
        const score = parseInt(reviewScore);
        const next = {};
        if (isNaN(score) || score < 0 || score > 100) next.score = 'Введіть число від 0 до 100.';
        if (!reviewText.trim()) next.text = 'Текст рецензії обов\'язковий.';
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = () => {
        if (validate()) onSubmit();
    };

    return (
        <div className="review-form-card">
            <p className="review-form__heading">Моя рецензія</p>

            <div className="review-form__field">
                <label className="review-form__label">Оцінка (0–100)</label>
                <input
                    type="number" min="0" max="100"
                    className={`review-form__input${errors.score ? ' input-error' : ''}`}
                    value={reviewScore}
                    onChange={e => { setReviewScore(e.target.value); if (errors.score) setErrors(p => ({ ...p, score: undefined })); }}
                    placeholder="наприклад, 85"
                />
                {errors.score && <span className="field-error">{errors.score}</span>}
            </div>

            <div className="review-form__field">
                <label className="review-form__label">Текст рецензії</label>
                <textarea
                    className={`review-form__textarea${errors.text ? ' input-error' : ''}`}
                    rows={5}
                    value={reviewText}
                    onChange={e => { setReviewText(e.target.value); if (errors.text) setErrors(p => ({ ...p, text: undefined })); }}
                    placeholder="Опишіть ваші зауваження та висновки…"
                />
                {errors.text && <span className="field-error">{errors.text}</span>}
            </div>

            <div className="review-form__field">
                <label className="review-form__label">Додатки (необов'язково)</label>
                {reviewAttachments.map((a, i) => (
                    <div key={i} className="review-attachment-row">
                        <input
                            type="file"
                            accept="image/png, image/jpeg, image/webp"
                            className="review-form__input"
                            onChange={e => {
                                const file = e.target.files[0];
                                if (file) {
                                    setReviewAttachments(prev => prev.map((x, j) => j === i ? { file } : x));
                                }
                            }}
                        />
                        {reviewAttachments.length > 1 && (
                            <button
                                className="model-remove-btn"
                                onClick={() => setReviewAttachments(prev => prev.filter((_, j) => j !== i))}
                                aria-label="Видалити"
                            >
                                <Trash2 size={15} />
                            </button>
                        )}
                    </div>
                ))}
                <button className="action-btn-outline model-add-btn" onClick={() => setReviewAttachments(prev => [...prev, { file: null }])}>
                    <Plus size={14} /> Додати файл
                </button>
            </div>

            <div className="upload-form__actions">
                <button className="action-btn" onClick={handleSubmit}>Надіслати оцінку</button>
            </div>
        </div>
    );
}

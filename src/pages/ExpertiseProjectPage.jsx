import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Calendar, FileSpreadsheet, FileText, FileCode, ExternalLink, Star, Plus, Trash2 } from 'lucide-react';
import useAuthUser from 'react-auth-kit/hooks/useAuthUser';
import dayjs from 'dayjs';
import {
    MOCK_PROJECTS,
    MOCK_DATA_MODELS,
    MOCK_EXPERTISES,
    MOCK_PROJECT_COMMENTS,
} from '../mocks/expertiseMockData.js';
import { CommentInput, CommentThread, pushComment } from '../components/ProjectComments.jsx';
import './styles/ClientPages.css';
import './styles/ExpertiseProjectPage.css';

const STATUS_LABEL = {
    'pending':   'Очікує',
    'in-review': 'На перевірці',
    'reviewed':  'Перевірено',
};

const TYPE_LABEL = {
    'db_model':   'DB Model',
    'erd':        'ERD',
    'sql_script': 'SQL Script',
};

function ModelIcon({ type }) {
    if (type === 'db_model') return <FileSpreadsheet size={16} />;
    if (type === 'sql_script') return <FileCode size={16} />;
    return <FileText size={16} />;
}

const ExpertiseProjectPage = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const authUser = useAuthUser();

    const pid = parseInt(projectId);

    const [localProject, setLocalProject] = useState(
        () => MOCK_PROJECTS.find(p => p.project_Id === pid)
    );
    const dataModels = MOCK_DATA_MODELS.filter(m => m.project_Id === pid);
    const [localExpertises, setLocalExpertises] = useState(
        () => MOCK_EXPERTISES.filter(e => e.project_Id === pid)
    );
    const [allComments, setAllComments] = useState(
        () => MOCK_PROJECT_COMMENTS.filter(c => c.project_Id === pid)
    );

    const isExpert = authUser?.role === 'expert' || authUser?.role === 'admin';
    const canClaim = isExpert && localProject?.status === 'pending';
    const isMyClaim = isExpert
        && localProject?.status === 'in-review'
        && localProject?.claimed_by_user_Id === authUser?.user_Id;
    const myDraftExpertise = isMyClaim
        ? localExpertises.find(e => e.end_date === null && e.expert_user_Id === authUser.user_Id)
        : null;

    const [reviewScore, setReviewScore] = useState('');
    const [reviewText, setReviewText] = useState('');
    const [reviewAttachments, setReviewAttachments] = useState([{ link: '' }]);

    if (!localProject) {
        return (
            <div className="client-page">
                <p className="expertise-empty">Проєкт не знайдено.</p>
                <button className="cancel-btn-text" onClick={() => navigate('/expertise')}>
                    <ArrowLeft size={16} /> Назад
                </button>
            </div>
        );
    }

    const handleClaim = () => {
        const updated = { ...localProject, status: 'in-review', claimed_by_user_Id: authUser.user_Id, claimed_by_nickname: authUser.username };
        const idx = MOCK_PROJECTS.findIndex(p => p.project_Id === pid);
        if (idx !== -1) Object.assign(MOCK_PROJECTS[idx], updated);
        const newExpertise = {
            expertise_Id: Date.now(), review_text: null, score: null,
            begin_date: new Date().toISOString(), end_date: null,
            project_Id: pid, expert_user_Id: authUser.user_Id, expert_nickname: authUser.username, attachments: [],
        };
        MOCK_EXPERTISES.push(newExpertise);
        setLocalProject(updated);
        setLocalExpertises(prev => [...prev, newExpertise]);
    };

    const handleUnclaim = () => {
        const updated = { ...localProject, status: 'pending', claimed_by_user_Id: null, claimed_by_nickname: null };
        const idx = MOCK_PROJECTS.findIndex(p => p.project_Id === pid);
        if (idx !== -1) Object.assign(MOCK_PROJECTS[idx], updated);
        const draftId = myDraftExpertise?.expertise_Id;
        const exIdx = MOCK_EXPERTISES.findIndex(e => e.expertise_Id === draftId);
        if (exIdx !== -1) MOCK_EXPERTISES.splice(exIdx, 1);
        setLocalProject(updated);
        setLocalExpertises(prev => prev.filter(e => e.expertise_Id !== draftId));
        setReviewScore(''); setReviewText(''); setReviewAttachments([{ link: '' }]);
    };

    const handleSubmitReview = () => {
        const score = parseInt(reviewScore);
        if (isNaN(score) || score < 0 || score > 100) return false;
        if (!reviewText.trim()) return false;
        const now = new Date().toISOString();
        const attachments = reviewAttachments
            .filter(a => a.link.trim())
            .map((a, i) => ({ attachment_Id: Date.now() + i, link: a.link.trim() }));
        const draftId = myDraftExpertise.expertise_Id;
        const exIdx = MOCK_EXPERTISES.findIndex(e => e.expertise_Id === draftId);
        if (exIdx !== -1) Object.assign(MOCK_EXPERTISES[exIdx], { review_text: reviewText.trim(), score, end_date: now, attachments });
        const updatedProject = { ...localProject, status: 'reviewed', claimed_by_user_Id: null, claimed_by_nickname: null };
        const pIdx = MOCK_PROJECTS.findIndex(p => p.project_Id === pid);
        if (pIdx !== -1) Object.assign(MOCK_PROJECTS[pIdx], updatedProject);
        setLocalExpertises(prev => prev.map(e =>
            e.expertise_Id === draftId ? { ...e, review_text: reviewText.trim(), score, end_date: now, attachments } : e
        ));
        setLocalProject(updatedProject);
        return true;
    };

    const addComment = (text, expertiseId = null, replyToId = null) => {
        const c = pushComment(text, pid, expertiseId, authUser?.user_Id ?? null, authUser?.username ?? 'Анонім', replyToId);
        setAllComments(prev => [...prev, c]);
    };

    const handleSaveEdit = (id, newText) => {
        setAllComments(prev => prev.map(c => c.project_comment_Id === id ? { ...c, text: newText } : c));
        const idx = MOCK_PROJECT_COMMENTS.findIndex(c => c.project_comment_Id === id);
        if (idx !== -1) MOCK_PROJECT_COMMENTS[idx].text = newText;
    };

    const handleDelete = (id) => {
        setAllComments(prev => prev.filter(c => c.project_comment_Id !== id));
        const idx = MOCK_PROJECT_COMMENTS.findIndex(c => c.project_comment_Id === id);
        if (idx !== -1) MOCK_PROJECT_COMMENTS.splice(idx, 1);
    };

    const projectComments = allComments.filter(c => !c.expertise_Id);
    const handleContinueThread = (commentId) => navigate(`/expertise/${projectId}/comment/${commentId}`);
    const completedExpertises = localExpertises.filter(e => e.end_date !== null);

    return (
        <div className="client-page">
            <button className="cancel-btn-text" onClick={() => navigate('/expertise')}>
                <ArrowLeft size={16} /> Назад до списку
            </button>

            <div className="project-detail-header">
                <div>
                    <h1 className="project-detail-title">{localProject.name}</h1>
                    <div className="project-detail-meta">
                        <span className="expertise-meta-item"><User size={14} />{localProject.author_nickname}</span>
                        <span className="expertise-meta-item"><Calendar size={14} />{dayjs(localProject.creation_date).format('DD.MM.YYYY')}</span>
                    </div>
                </div>
                <div className="expert-actions">
                    <span className={`expertise-status-badge status-${localProject.status}`}>
                        {STATUS_LABEL[localProject.status] || localProject.status}
                    </span>
                    {canClaim && <button className="action-btn" onClick={handleClaim}>Взяти в роботу</button>}
                    {isMyClaim && <button className="btn-danger-outline" onClick={handleUnclaim}>Відмовитись</button>}
                </div>
            </div>

            {localProject.description && (
                <p className="project-detail-description">{localProject.description}</p>
            )}

            <DataModelsSection dataModels={dataModels} />

            <section className="project-section">
                <h2 className="section-title">Експертні оцінки</h2>
                {isMyClaim && myDraftExpertise && (
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
                            />
                        ))}
                    </div>
                )}
            </section>

            <section className="project-section">
                <h2 className="section-title">Коментарі ({projectComments.length})</h2>
                {authUser && <CommentInput onSubmit={(text) => addComment(text, null)} />}
                <CommentThread
                    comments={projectComments}
                    currentUserId={authUser?.user_Id}
                    onAdd={(text, replyToId) => addComment(text, null, replyToId)}
                    onSaveEdit={handleSaveEdit}
                    onDelete={handleDelete}
                    onContinueThread={handleContinueThread}
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
                            <a href={m.file} target="_blank" rel="noopener noreferrer" className="model-list__link">
                                {m.file} <ExternalLink size={13} />
                            </a>
                            <span className="model-list__date">{dayjs(m.upload_date).format('DD.MM.YYYY')}</span>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

function ExpertiseReviewCard({ expertise: ex, allComments, authUser, addComment, onSaveEdit, onDelete, onContinueThread }) {
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
                {authUser && (
                    <CommentInput
                        placeholder="Коментар до цієї оцінки…"
                        onSubmit={(text) => addComment(text, ex.expertise_Id)}
                    />
                )}
                <CommentThread
                    comments={exComments}
                    currentUserId={authUser?.user_Id}
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
                            type="url"
                            className="review-form__input"
                            placeholder="https://…"
                            value={a.link}
                            onChange={e => setReviewAttachments(prev => prev.map((x, j) => j === i ? { link: e.target.value } : x))}
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
                <button className="action-btn-outline model-add-btn" onClick={() => setReviewAttachments(prev => [...prev, { link: '' }])}>
                    <Plus size={14} /> Додати посилання
                </button>
            </div>

            <div className="upload-form__actions">
                <button className="action-btn" onClick={handleSubmit}>Надіслати оцінку</button>
            </div>
        </div>
    );
}

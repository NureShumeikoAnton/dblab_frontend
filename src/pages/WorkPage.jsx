import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_CONFIG from '../config/api';
import useAuthHeader from 'react-auth-kit/hooks/useAuthHeader';
import { ArrowLeft, FileText, Calendar, User, Tag, ExternalLink } from 'lucide-react';
import './styles/ClientPages.css';
import './styles/WorkPage.css';

const WorkPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const authHeader = useAuthHeader();
    const [work, setWork] = useState(null);
    const [loading, setLoading] = useState(true);
    const [results, setResults] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const workRes = await axios.get(`${API_CONFIG.BASE_URL}/work/getall`);
                const currentWork = workRes.data.find(w => w.work_Id === parseInt(id));
                
                if (currentWork) {
                    setWork(currentWork);

                    try {
                        const resRes = await axios.get(`${API_CONFIG.BASE_URL}/result/work/${id}`, {
                            headers: { 'Authorization': authHeader }
                        });
                        setResults(resRes.data);
                    } catch (error) {
                        console.error("Error loading results:", error);
                        setResults([]);
                    }
                }
            } catch (error) {
                console.error("Error loading work:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const formatDate = (dateString) => {
        if (!dateString) return 'Не вказано';
        return new Date(dateString).toLocaleDateString('uk-UA', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    if (loading) {
        return <div className="loading">Завантаження даних...</div>;
    }

    if (!work) {
        return (
            <div className="client-page">
                <button onClick={() => navigate(-1)} className="back-btn">
                    <ArrowLeft size={16} /> Назад
                </button>
                <div className="no-results-message">
                    <p>Роботу не знайдено</p>
                </div>
            </div>
        );
    }

    return (
        <div className="client-page work-page">
            <button onClick={() => navigate(-1)} className="back-btn">
                <ArrowLeft size={16} /> Назад
            </button>

            <div className="work-header">
                <h1 className="work-title">{work.Proposal?.name || work.name || 'Робота без назви'}</h1>
                <div className="work-status-badge">
                    <span className={`badge ${
                        work.status === 'Активна' ? 'badge-green' :
                        work.status === 'Завершена' ? 'badge-blue' :
                        work.status === 'В обробці' ? 'badge-yellow' :
                        'badge-gray'
                    }`}>
                        {work.status}
                    </span>
                </div>
            </div>

            <div className="work-info-grid">
                <div className="work-info-card">
                    <h3 className="info-card-title">
                        <FileText size={20} /> Інформація про роботу
                    </h3>
                    <div className="info-item">
                        <span className="info-label">Назва:</span>
                        <span className="info-value">{work.Proposal?.name || work.name || 'Не вказано'}</span>
                    </div>
                    {work.Proposal?.description && (
                        <div className="info-item">
                            <span className="info-label">Опис пропозиції:</span>
                            <span className="info-value">{work.Proposal.description}</span>
                        </div>
                    )}
                    {work.comment && (
                        <div className="info-item">
                            <span className="info-label">Коментар:</span>
                            <span className="info-value">{work.comment}</span>
                        </div>
                    )}
                    {work.review && (
                        <div className="info-item">
                            <span className="info-label">Відгук викладача:</span>
                            <span className="info-value">{work.review}</span>
                        </div>
                    )}
                </div>

                <div className="work-info-card">
                    <h3 className="info-card-title">
                        <Calendar size={20} /> Дати
                    </h3>
                    <div className="info-item">
                        <span className="info-label">Дата прикріплення:</span>
                        <span className="info-value">{formatDate(work.begining_date)}</span>
                    </div>
                    {work.changes_date && (
                        <div className="info-item">
                            <span className="info-label">Останні зміни:</span>
                            <span className="info-value">{formatDate(work.changes_date)}</span>
                        </div>
                    )}
                </div>

                <div className="work-info-card">
                    <h3 className="info-card-title">
                        <User size={20} /> Учасники
                    </h3>
                    {work.User && (
                        <div className="info-item">
                            <span className="info-label">Студент:</span>
                            <span className="info-value">{work.User.nickname || work.User.email || 'Не вказано'}</span>
                        </div>
                    )}
                </div>

                {work.file && (
                    <div className="work-info-card">
                        <h3 className="info-card-title">
                            <ExternalLink size={20} /> Файл/Посилання
                        </h3>
                        <div className="info-item">
                            {work.file.startsWith('http') ? (
                                <a href={work.file} target="_blank" rel="noopener noreferrer" className="file-link">
                                    {work.file} <ExternalLink size={14} />
                                </a>
                            ) : (
                                <span className="info-value">{work.file}</span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {results.length > 0 && (
                <div className="work-results-section">
                    <h2 className="section-title">
                        <Tag size={20} /> Результати роботи
                    </h2>
                    <div className="results-grid">
                        {results.map(result => (
                            <div key={result.result_Id} className="result-card">
                                <h4>{result.name}</h4>
                                <p className="result-meta">
                                    {result.full_name}
                                    {result.year && ` • ${result.year} рік`}
                                    {result.pages && ` • ${result.pages} стор.`}
                                </p>
                                {result.status && (
                                    <span className={`badge ${
                                        result.status === 'Підтверджено' ? 'badge-green' :
                                        result.status === 'Відхилено' ? 'badge-red' :
                                        'badge-yellow'
                                    }`}>
                                        {result.status}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkPage;


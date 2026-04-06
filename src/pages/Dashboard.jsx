import React, { useEffect, useState } from 'react';
import axios from 'axios';
import API_CONFIG from '../config/api';
import useAuthUser from 'react-auth-kit/hooks/useAuthUser';
import useAuthHeader from 'react-auth-kit/hooks/useAuthHeader';
import { Clock, CheckCircle, XCircle, FileText, AlertCircle, Search, Trash2, Plus, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import './styles/ClientPages.css';

const Dashboard = () => {
    const [requests, setRequests] = useState([]); 
    const [activeProjects, setActiveProjects] = useState([]);
    const [results, setResults] = useState([]);
    const [resultTypes, setResultTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isResultModalOpen, setIsResultModalOpen] = useState(false);
    const [resultFormData, setResultFormData] = useState({
        name: '',
        year: new Date().getFullYear(),
        pages: '',
        full_name: '',
        result_type_Id: '',
        work_Id: ''
    });
    
    const authUser = useAuthUser();
    const authHeader = useAuthHeader();
    const navigate = useNavigate();
    const { addToast } = useToast();
    
    const userId = authUser?.id || authUser?.user_Id;

    useEffect(() => {
        const fetchData = async () => {
            if (!userId) {
                setLoading(false);
                return;
            }
            try {
                const [workRes, resultRes, typeRes] = await Promise.all([
                    axios.get(`${API_CONFIG.BASE_URL}/work/user/${userId}`, {
                        headers: { 'Authorization': authHeader }
                    }),
                    axios.get(`${API_CONFIG.BASE_URL}/result/getall`).catch(() => ({ data: [] })),
                    axios.get(`${API_CONFIG.BASE_URL}/resultType/getall`).catch(() => ({ data: [] }))
                ]);
                
                const allWorks = workRes.data;
                
                const myRequests = allWorks.filter(w => 
                    w.status === 'В обробці' || w.status === 'Відхилена' || w.status === 'pending'
                );
                
                const myProjects = allWorks.filter(w => 
                    w.status === 'Активна' || w.status === 'Завершена' || w.status === 'active'
                );

                const myWorkIds = allWorks.map(w => w.work_Id);
                const myResults = resultRes.data.filter(r => myWorkIds.includes(r.work_Id));

                setRequests(myRequests);
                setActiveProjects(myProjects);
                setResults(myResults);
                setResultTypes(typeRes.data);
            } catch (error) {
                console.error("Error loading dashboard:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [userId, authHeader]);

    const handleCancelRequest = async (workId) => {
        if (!window.confirm("Ви дійсно хочете скасувати цю заявку?")) return;

        const previousRequests = [...requests];
        setRequests(requests.filter(req => req.work_Id !== workId));

        try {
            await axios.delete(`${API_CONFIG.BASE_URL}/work/student/delete/${workId}`, {
                headers: { 'Authorization': authHeader }
            });
            addToast("Заявку скасовано", "success");
        } catch (error) {
            setRequests(previousRequests);
            console.error("Error cancelling:", error);
            const msg = error.response?.data?.message || "Не вдалось скасувати";
            addToast(msg, "error");
        }
    };

    const getStatusBadge = (status) => {
        switch(status) {
            case 'В обробці': 
            case 'pending':
                return <span className="badge badge-yellow"><Clock size={14}/> На розгляді</span>;
            case 'Активна': 
            case 'active':
                return <span className="badge badge-green"><CheckCircle size={14}/> Активна</span>;
            case 'Завершена': 
            case 'completed':
                return <span className="badge badge-blue"><CheckCircle size={14}/> Завершена</span>;
            case 'Відхилена': 
            case 'rejected':
                return <span className="badge badge-red"><XCircle size={14}/> Відхилено</span>;
            default: return <span className="badge badge-gray">{status}</span>;
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('uk-UA');
    };

    const handleAddResult = async () => {
        if (!resultFormData.name || !resultFormData.full_name || !resultFormData.work_Id) {
            addToast("Заповніть всі обов'язкові поля!", "error");
            return;
        }

        try {
            await axios.post(`${API_CONFIG.BASE_URL}/result/create`, 
                resultFormData,
                { headers: { 'Authorization': authHeader } }
            );
            addToast("Результат додано! Очікуйте підтвердження.", "success");
            setIsResultModalOpen(false);
            setResultFormData({
                name: '',
                year: new Date().getFullYear(),
                pages: '',
                full_name: '',
                result_type_Id: '',
                work_Id: ''
            });
            const resultRes = await axios.get(`${API_CONFIG.BASE_URL}/result/getall`);
            const workRes = await axios.get(`${API_CONFIG.BASE_URL}/work/user/${userId}`, {
                headers: { 'Authorization': authHeader }
            });
            const myWorkIds = workRes.data.map(w => w.work_Id);
            const myResults = resultRes.data.filter(r => myWorkIds.includes(r.work_Id));
            setResults(myResults);
        } catch (error) {
            console.error(error);
            addToast("Помилка додавання: " + (error.response?.data?.message || error.message), "error");
        }
    };

    if (loading) return <div className="loading">Завантаження кабінету...</div>;

    if (!authUser) {
        return (
            <div className="client-page">
                <h1 className="page-title">Особистий кабінет</h1>
                <div className="no-results-message">
                    <p>Спочатку треба зареєструватись</p>
                </div>
            </div>
        );
    }

    return (
        <div className="client-page">
            <h1 className="page-title">Особистий кабінет</h1>

            {/* БЛОК 1: Мої Заявки */}
            <div className="dashboard-section">
                <h2 className="section-title">Мої заявки</h2>
                {requests.length > 0 ? (
                    <div className="cards-grid-list">
                        {requests.map(req => {
                            const cardClass = (req.status === 'Відхилена' || req.status === 'rejected') 
                                ? 'item-card rejected-card' 
                                : 'item-card request-card';

                            return (
                                <div key={req.work_Id} className={cardClass}>
                                    <div className="card-header">
                                        <h3>{req.Proposal?.name || req.name}</h3>
                                        {getStatusBadge(req.status)}
                                    </div>
                                    
                                    <div className="request-body" style={{textAlign: 'center', margin: '20px 0'}}>
                                        <p className="date-text" style={{color: '#666', fontSize: '0.9rem'}}>
                                            Подано: {formatDate(req.begining_date)}
                                        </p>
                                        
                                        {req.review && (
                                            <div className="feedback-box" style={{marginTop: '20px'}}>
                                                <AlertCircle size={16} style={{display:'inline', marginBottom:'-3px', marginRight:'5px'}} />
                                                <span><strong>Коментар викладача:</strong> {req.review}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="card-footer-right">
                                        <button 
                                            className="cancel-btn-text" 
                                            onClick={() => handleCancelRequest(req.work_Id)}
                                            title="Видалити з історії"
                                        >
                                            <Trash2 size={16} /> {req.status === 'Відхилена' ? 'Видалити' : 'Скасувати'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="no-results-message">
                        <p>У вас немає активних заявок.</p>
                        <button className="action-btn" onClick={() => navigate('/studentproposals')}>
                            <Search size={18} /> Перейти до пропозицій
                        </button>
                    </div>
                )}
            </div>

            {/* БЛОК 2: Мої Роботи */}
            <div className="dashboard-section">
                <h2 className="section-title">Мої наукові роботи</h2>
                {activeProjects.length > 0 ? (
                    <div className="cards-grid-list">
                        {activeProjects.map(project => (
                            <div 
                                key={project.work_Id} 
                                className="item-card work-card-active clickable-result-card"
                                onClick={() => navigate(`/workpage/${project.work_Id}`)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="card-header">
                                    <h3>{project.Proposal?.name || project.name}</h3>
                                    {getStatusBadge(project.status)}
                                </div>
                                <div className="work-actions" onClick={(e) => e.stopPropagation()}>
                                    <button 
                                        className="action-btn-outline" 
                                        onClick={() => navigate(`/workpage/${project.work_Id}`)}
                                    >
                                        <FileText size={16}/> Деталі та Результати
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="no-results-message">
                        <p>У вас поки немає активних проєктів.</p>
                        <button className="action-btn" onClick={() => navigate('/studentproposals')}>
                            Перейти до пропозицій
                        </button>
                    </div>
                )}
            </div>

            {/* БЛОК 3: Результати */}
            <div className="dashboard-section">
                <div className="section-header-row" style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '20px'}}>
                    <h2 className="section-title">Мої результати</h2>
                    <button className="action-btn" onClick={() => setIsResultModalOpen(true)}>
                        <Plus size={18} /> Додати результат
                    </button>
                </div>

                {results.length > 0 ? (
                    <div className="cards-grid-list">
                        {results.map(res => (
                            <div 
                                key={res.result_Id} 
                                className="item-card result-item-card clickable-result-card"
                                onClick={() => res.work_Id && navigate(`/workpage/${res.work_Id}`)}
                                style={res.work_Id ? { cursor: 'pointer' } : {}}
                            >
                                <div className="card-header">
                                    <h3>{res.name}</h3>
                                    <div className="card-badges">
                                        <span className="badge badge-blue">{res.year} рік</span>
                                        {res.status && (
                                            res.status === 'Підтверджено' ? (
                                                <span className="badge badge-green">Підтверджено</span>
                                            ) : res.status === 'Відхилено' ? (
                                                <span className="badge badge-red">Відхилено</span>
                                            ) : (
                                                <span className="badge badge-yellow">В обробці</span>
                                            )
                                        )}
                                    </div>
                                </div>
                                <p className="card-description-left">
                                    {res.full_name}
                                    {res.pages && ` • ${res.pages} стор.`}
                                </p>
                                {res.work_Id && (
                                    <div className="card-footer" onClick={(e) => e.stopPropagation()}>
                                        <button 
                                            className="action-btn-outline" 
                                            onClick={() => navigate(`/workpage/${res.work_Id}`)}
                                        >
                                            Детальніше <FileText size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="no-results-message">
                        <p>У вас поки немає результатів.</p>
                    </div>
                )}
            </div>

            {/* Модалка додавання результату */}
            {isResultModalOpen && (
                <div className="modal-overlay">
                    <div className="auth-modal" style={{maxWidth:'500px'}}>
                        <h2>Додати науковий результат</h2>
                        
                        <div className="form-group">
                            <label>Назва публікації *</label>
                            <input 
                                className="search-input" 
                                value={resultFormData.name} 
                                onChange={e => setResultFormData({...resultFormData, name: e.target.value})} 
                                placeholder="Наприклад: ШІ в медицині"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Бібліографічний опис (повний) *</label>
                            <textarea 
                                className="search-input" 
                                style={{minHeight:'80px'}} 
                                value={resultFormData.full_name} 
                                onChange={e => setResultFormData({...resultFormData, full_name: e.target.value})} 
                                placeholder="Іванов І.І., ШІ в медицині // Вісник..."
                            />
                        </div>

                        <div className="form-group">
                            <label>Робота *</label>
                            <select 
                                className="search-input"
                                value={resultFormData.work_Id}
                                onChange={e => setResultFormData({...resultFormData, work_Id: e.target.value})}
                            >
                                <option value="">Виберіть роботу</option>
                                {activeProjects.map(work => (
                                    <option key={work.work_Id} value={work.work_Id}>
                                        {work.Proposal?.name || work.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Тип результату</label>
                            <select 
                                className="search-input"
                                value={resultFormData.result_type_Id}
                                onChange={e => setResultFormData({...resultFormData, result_type_Id: e.target.value})}
                            >
                                <option value="">Виберіть тип</option>
                                {resultTypes.map(type => (
                                    <option key={type.result_type_Id} value={type.result_type_Id}>
                                        {type.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{display:'flex', gap:'10px'}}>
                            <div className="form-group" style={{flex:1}}>
                                <label>Рік</label>
                                <input 
                                    type="number" 
                                    className="search-input" 
                                    value={resultFormData.year} 
                                    onChange={e => setResultFormData({...resultFormData, year: e.target.value})}
                                />
                            </div>
                            <div className="form-group" style={{flex:1}}>
                                <label>Сторінок</label>
                                <input 
                                    type="number" 
                                    className="search-input" 
                                    value={resultFormData.pages} 
                                    onChange={e => setResultFormData({...resultFormData, pages: e.target.value})}
                                />
                            </div>
                        </div>
                        
                        <div style={{display:'flex', justifyContent:'flex-end', gap:'10px', marginTop:'20px'}}>
                            <button 
                                onClick={() => setIsResultModalOpen(false)} 
                                className="action-btn" 
                                style={{background:'#ccc', color:'#000'}}
                            >
                                Скасувати
                            </button>
                            <button onClick={handleAddResult} className="action-btn">
                                <Save size={16} style={{marginRight:'5px'}}/> Зберегти
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
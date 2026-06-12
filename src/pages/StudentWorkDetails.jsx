import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_CONFIG from '../config/api';
import useAuthHeader from 'react-auth-kit/hooks/useAuthHeader';
import { ArrowLeft, Plus, FileText, CheckCircle, Clock, XCircle, Save } from 'lucide-react';
import './styles/ClientPages.css';

const StudentWorkDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const authHeader = useAuthHeader();
    
    const [work, setWork] = useState(null);
    const [results, setResults] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Форма додавання результату
    const [formData, setFormData] = useState({
        name: '',
        year: new Date().getFullYear(),
        pages: '',
        full_name: '',
        result_type_Id: 1
    });

    const fetchData = async () => {
        try {
            // 1. Отримуємо деталі роботи. 
            // Оскільки окремого getOne немає, беремо зі списку user's works (тимчасово)
            // Або можна додати route GET /work/:id в work.js для студента
            const authUser = JSON.parse(localStorage.getItem('_auth_state') || '{}');
            const userId = authUser.id || authUser.user_Id;

            // Запит робіт користувача
            const workRes = await axios.get(`${API_CONFIG.BASE_URL}/work/user/${userId}`, {
                headers: { 'Authorization': authHeader }
            });
            const currentWork = workRes.data.find(w => w.work_Id === parseInt(id));
            setWork(currentWork);

            // 2. Отримуємо результати цієї роботи
            const resRes = await axios.get(`${API_CONFIG.BASE_URL}/result/work/${id}`, {
                headers: { 'Authorization': authHeader }
            });
            setResults(resRes.data);

        } catch (error) {
            console.error("Error loading details:", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const handleAddResult = async () => {
        if(!formData.name || !formData.full_name) {
            alert("Заповніть назву та опис!");
            return;
        }

        try {
            await axios.post(`${API_CONFIG.BASE_URL}/result/create`, 
                {
                    ...formData,
                    work_Id: id
                },
                { headers: { 'Authorization': authHeader } }
            );
            alert("Результат додано! Очікуйте підтвердження.");
            setIsModalOpen(false);
            setFormData({ name: '', year: new Date().getFullYear(), pages: '', full_name: '', result_type_Id: 1 });
            fetchData(); 
        } catch (error) {
            console.error(error);
            alert("Помилка додавання: " + (error.response?.data?.message || error.message));
        }
    };

    const getStatusBadge = (status) => {
        switch(status) {
            case 'В обробці': return <span className="badge badge-yellow"><Clock size={14}/> На перевірці</span>;
            case 'Підтверджено': return <span className="badge badge-green"><CheckCircle size={14}/> Зараховано</span>;
            case 'Відхилено': return <span className="badge badge-red"><XCircle size={14}/> Відхилено</span>;
            default: return <span className="badge badge-gray">{status}</span>;
        }
    };

    if (!work) return <div className="loading">Завантаження даних...</div>;

    return (
        <div className="client-page">
            <button onClick={() => navigate('/dashboard')} className="back-btn">
                <ArrowLeft size={16} /> Назад до кабінету
            </button>

            <div className="item-card work-card-active" style={{marginTop: '20px'}}>
                <div className="card-header">
                    <h2>{work.Proposal?.name || work.name}</h2>
                    <span className="badge badge-green">{work.status}</span>
                </div>
                <p><strong>Мій коментар:</strong> {work.comment || "—"}</p>
                {work.review && <p><strong>Відгук викладача:</strong> {work.review}</p>}
            </div>

            <div className="dashboard-section">
                <div className="section-header-row" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <h2 className="section-title">Мої наукові результати</h2>
                    <button className="add-btn-small" onClick={() => setIsModalOpen(true)}>
                        <Plus size={16} /> Додати результат
                    </button>
                </div>

                {results.length > 0 ? (
                    <div className="results-list">
                        {results.map(res => (
                            <div key={res.result_Id} className="item-card result-item-card" style={{display:'flex', gap:'15px', alignItems:'center'}}>
                                <div className="res-icon" style={{background:'#f0f0f0', padding:'10px', borderRadius:'50%'}}>
                                    <FileText size={24} color="#555"/>
                                </div>
                                <div className="res-content" style={{flex:1}}>
                                    <h4 style={{margin:'0 0 5px 0'}}>{res.name}</h4>
                                    <p className="res-meta" style={{margin:0, color:'#666', fontSize:'0.9rem'}}>
                                        {res.full_name} ({res.year}, {res.pages} стор.)
                                    </p>
                                    {res.moderation_comment && (
                                        <p style={{color:'#d32f2f', fontSize:'0.85rem', marginTop:'5px'}}>
                                            ⚠️ Коментар викладача: {res.moderation_comment}
                                        </p>
                                    )}
                                </div>
                                <div className="res-status">
                                    {getStatusBadge(res.status)}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="empty-state">Результатів поки немає. Додайте статтю або тези.</p>
                )}
            </div>

            {/* Проста модалка */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="auth-modal" style={{maxWidth:'500px'}}>
                        <h2>Додати науковий результат</h2>
                        
                        <div className="form-group">
                            <label>Назва публікації</label>
                            <input className="search-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Наприклад: ШІ в медицині"/>
                        </div>
                        
                        <div className="form-group">
                            <label>Бібліографічний опис (повний)</label>
                            <textarea className="search-input" style={{minHeight:'80px'}} value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} placeholder="Іванов І.І., ШІ в медицині // Вісник..."/>
                        </div>

                        <div style={{display:'flex', gap:'10px'}}>
                            <div className="form-group" style={{flex:1}}>
                                <label>Рік</label>
                                <input type="number" className="search-input" value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})}/>
                            </div>
                            <div className="form-group" style={{flex:1}}>
                                <label>Сторінок</label>
                                <input type="number" className="search-input" value={formData.pages} onChange={e => setFormData({...formData, pages: e.target.value})}/>
                            </div>
                        </div>
                        
                        <div style={{display:'flex', justifyContent:'flex-end', gap:'10px', marginTop:'20px'}}>
                            <button onClick={() => setIsModalOpen(false)} className="action-btn" style={{background:'#ccc', color:'#000'}}>Скасувати</button>
                            <button onClick={handleAddResult} className="action-btn"><Save size={16} style={{marginRight:'5px'}}/> Зберегти</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentWorkDetails;
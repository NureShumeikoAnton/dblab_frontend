import React, { useEffect, useState } from 'react';
import axios from 'axios';
import API_CONFIG from '../config/api';
import useAuthUser from 'react-auth-kit/hooks/useAuthUser';
import useAuthHeader from 'react-auth-kit/hooks/useAuthHeader';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Filter, User, Tag, Info, Gauge, ArrowUpDown } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import './styles/ClientPages.css';
import './styles/StudentProposals.css';
import SimpleTooltip from '../components/Tooltip';
import ComplexityDots from '../components/ComplexityDots';

const StudentProposals = () => {
    const [proposals, setProposals] = useState([]);
    const [filteredProposals, setFilteredProposals] = useState([]);
    const [directions, setDirections] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [types, setTypes] = useState([]);
    const [works, setWorks] = useState([]);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDirections, setSelectedDirections] = useState([]);
    const [selectedTeacher, setSelectedTeacher] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [selectedComplexity, setSelectedComplexity] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [sortOrder, setSortOrder] = useState('name_asc');

    const authUser = useAuthUser();
    const authHeader = useAuthHeader();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { addToast } = useToast();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const results = await Promise.allSettled([
                    axios.get(`${API_CONFIG.BASE_URL}/proposal/getall`),
                    axios.get(`${API_CONFIG.BASE_URL}/direction/getall`),
                    axios.get(`${API_CONFIG.BASE_URL}/teacher/getall`),
                    axios.get(`${API_CONFIG.BASE_URL}/proposaltype/getall`),
                    axios.get(`${API_CONFIG.BASE_URL}/work/getFromDb`, {
                        headers: { 'Authorization': authHeader }
                    }).catch(() => ({ data: [] }))
                ]);

                const propRes = results[0].status === 'fulfilled' ? results[0].value : { data: [] };
                const dirRes = results[1].status === 'fulfilled' ? results[1].value : { data: [] };
                const teachRes = results[2].status === 'fulfilled' ? results[2].value : { data: [] };
                const typeRes = results[3].status === 'fulfilled' ? results[3].value : { data: [] };
                const workRes = results[4].status === 'fulfilled' ? results[4].value : { data: [] };

                setWorks(workRes.data);

                const enrichedProposals = propRes.data.map(p => {
                    const workForProposal = workRes.data.find(w => w.proposal_Id === p.proposal_Id);
                    return {
                        ...p,
                        teacherName: teachRes.data.find(t => t.teacher_Id === p.teacher_Id)?.full_name || 'Невідомий',
                        directionName: dirRes.data.find(d => d.direction_Id === p.direction_Id)?.name || 'Загальний',
                        typeName: typeRes.data.find(t => t.proposal_type_Id === p.proposal_type_Id)?.name || 'Загальний',
                        workId: workForProposal?.work_Id,
                        studentNickname: workForProposal?.User?.nickname
                    };
                });

                setProposals(enrichedProposals);
                setFilteredProposals(enrichedProposals);
                setDirections(dirRes.data);
                setTeachers(teachRes.data);
                setTypes(typeRes.data);
            } catch (error) {
                console.error("Critical error loading data:", error);
            }
        };
        fetchData();
    }, [authHeader]);

    useEffect(() => {
        const dirId = searchParams.get('directionId');
        if (dirId) {
            const id = parseInt(dirId);
            if (!isNaN(id)) {
                setSelectedDirections([id]);
                setSearchQuery('');
                setSelectedTeacher('');
                setSelectedType('');
                setSelectedComplexity('');
            }
        }
    }, [searchParams]);

    useEffect(() => {
        if (proposals.length === 0) return;

        let result = proposals;

        if (searchQuery) {
            result = result.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        if (selectedDirections.length > 0) {
            result = result.filter(p => selectedDirections.includes(p.direction_Id));
        }

        if (selectedTeacher) {
            result = result.filter(p => p.teacher_Id === parseInt(selectedTeacher));
        }

        if (selectedType) {
            result = result.filter(p => p.proposal_type_Id === parseInt(selectedType));
        }

        if (selectedComplexity) {
            result = result.filter(p => {
                if (!p.complexity) return false;
                const val = p.complexity.toLowerCase();
                const filter = selectedComplexity.toLowerCase();

                if (filter === 'низька') return val.includes('низька') || val.includes('low');
                if (filter === 'середня') return val.includes('середня') || val.includes('medium');
                if (filter === 'висока') return val.includes('висока') || val.includes('high');
                
                return val.includes(filter);
            });
        }

        if (selectedStatus) {
            if (selectedStatus === 'Запропоновано') {
                // "Доступні" показує "Запропоновано" та "Є записи"
                result = result.filter(p => p.status === 'Запропоновано' || p.status === 'Є записи');
            } else {
                result = result.filter(p => p.status === selectedStatus);
            }
        } else {
            // За замовчуванням показуємо всі статуси крім "Відкладено"
            result = result.filter(p => p.status !== 'Відкладено');
        }

        // Сортування
        result.sort((a, b) => {
            const nameA = a.name.toLowerCase();
            const nameB = b.name.toLowerCase();
            const teacherA = a.teacherName.toLowerCase();
            const teacherB = b.teacherName.toLowerCase();
            const directionA = a.directionName.toLowerCase();
            const directionB = b.directionName.toLowerCase();

            switch (sortOrder) {
                case 'name_asc':
                    return nameA.localeCompare(nameB);
                case 'name_desc':
                    return nameB.localeCompare(nameA);
                case 'teacher_asc':
                    return teacherA.localeCompare(teacherB);
                case 'teacher_desc':
                    return teacherB.localeCompare(teacherA);
                case 'direction_asc':
                    return directionA.localeCompare(directionB);
                case 'direction_desc':
                    return directionB.localeCompare(directionA);
                default:
                    return 0;
            }
        });

        setFilteredProposals(result);
        
    }, [proposals, searchQuery, selectedDirections, selectedTeacher, selectedType, selectedComplexity, selectedStatus, sortOrder]); 

    const handleDirectionChange = (id) => {
        setSelectedDirections(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const handleEnroll = async (proposalId) => {
        if (!authUser) { alert("Увійдіть в систему"); return; }
        if (authUser.role && authUser.role !== 'student' && authUser.role !== 'admin') { alert("Викладачі не можуть записуватися."); return; }
        const userId = authUser.user_Id || authUser.id;
        if (!window.confirm("Записатися на цю тему?")) return;

        try {
            await axios.post(`${API_CONFIG.BASE_URL}/work/student/create`, {
                name: "Нова робота (Заявка)", 
                begining_date: new Date(),
                proposal_Id: proposalId,
                user_Id: userId,
                review: "Очікує підтвердження",
                comment: "Заявка через сайт",
                file: "" 
            }, { headers: { 'Authorization': authHeader } });
            addToast("Заявку надіслано!", "success");
        } catch (error) {
            const msg = error.response?.data?.message || error.message;
            addToast(`Помилка: ${msg}`, "error");
        }
    };

    return (
        <div className="client-page">
            <h1 className="page-title">Доступні пропозиції</h1>

            <div className="filter-panel">
                <div className="search-box">
                    <Search className="search-icon" size={20} />
                    <input type="text" className="search-input" placeholder="Пошук..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>

                <div className="filters-group">
                    <div className="filter-label"><Tag size={18} /> Тип:</div>
                    <select className="search-input" style={{minWidth: '150px'}} value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
                        <option value="">Всі типи</option>
                        {types.map(t => <option key={t.proposal_type_Id} value={t.proposal_type_Id}>{t.name}</option>)}
                    </select>
                </div>

                <div className="filters-group">
                    <div className="filter-label"><User size={18} /> Викладач:</div>
                    <select className="search-input" style={{minWidth: '200px'}} value={selectedTeacher} onChange={(e) => setSelectedTeacher(e.target.value)}>
                        <option value="">Всі викладачі</option>
                        {teachers.map(t => <option key={t.teacher_Id} value={t.teacher_Id}>{t.full_name}</option>)}
                    </select>
                </div>

                <div className="filters-group">
                    <div className="filter-label"><Gauge size={18} /> Складність:</div>
                    <select className="search-input" style={{minWidth: '200px'}} value={selectedComplexity} onChange={(e) => setSelectedComplexity(e.target.value)}>
                        <option value="">Всі рівні</option>
                        <option value="Низька">Низька</option>
                        <option value="Середня">Середня</option>
                        <option value="Висока">Висока</option>
                    </select>
                </div>

                <div className="filters-group">
                    <div className="filter-label"><Info size={18} /> Статус:</div>
                    <select className="search-input" style={{minWidth: '200px'}} value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                        <option value="">Всі статуси</option>
                        <option value="Запропоновано">Доступні</option>
                        <option value="Підтверджено">Підтверджені</option>
                        <option value="Завершено">Завершені</option>
                    </select>
                </div>

                <div className="filters-group">
                    <label htmlFor="sort-order" className="filter-label">
                        <ArrowUpDown size={18} /> Сортування:
                    </label>
                    <select 
                        id="sort-order"
                        name="sortOrder"
                        className="search-input" 
                        style={{minWidth: '200px', paddingLeft: '15px'}}
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                    >
                        <option value="name_asc">За назвою (А-Я)</option>
                        <option value="name_desc">За назвою (Я-А)</option>
                        <option value="teacher_asc">За викладачем (А-Я)</option>
                        <option value="teacher_desc">За викладачем (Я-А)</option>
                        <option value="direction_asc">За напрямом (А-Я)</option>
                        <option value="direction_desc">За напрямом (Я-А)</option>
                    </select>
                </div>

                <div className="filters-group" style={{width: '100%', marginTop: '10px', flexDirection: 'column', alignItems: 'flex-start'}}>
                    <div className="filter-label"><Filter size={18} /> Напрями:</div>
                    <div className="checkbox-group">
                        {directions.map(dir => (
                            <label key={dir.direction_Id} className="custom-checkbox">
                                <input 
                                    type="checkbox" 
                                    checked={selectedDirections.includes(dir.direction_Id)}
                                    onChange={() => handleDirectionChange(dir.direction_Id)}
                                />
                                {dir.name}
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            <div className="cards-grid-list">
                {filteredProposals.length > 0 ? (
                    filteredProposals.map(proposal => {
                        const isCompleted = proposal.status === 'Завершено' || proposal.status === 'Підтверджено';
                        const handleClick = () => {
                            if (isCompleted && proposal.workId) {
                                navigate(`/workpage/${proposal.workId}`);
                            }
                        };
                        
                        return (
                            <div 
                                key={proposal.proposal_Id} 
                                className={`item-card proposal-card ${isCompleted && proposal.workId ? 'clickable-card' : ''}`}
                                onClick={isCompleted && proposal.workId ? handleClick : undefined}
                                style={isCompleted && proposal.workId ? { cursor: 'pointer' } : {}}
                            >
                                <div className="card-content">
                                    <div className="card-header">
                                        <h3 className="card-title">{proposal.name}</h3>
                                        <div className="card-badges">
                                            <span className="badge badge-blue">{proposal.directionName}</span>
                                            <span className={`badge ${
                                                proposal.status === 'Запропоновано' ? 'badge-green' : 
                                                proposal.status === 'Є записи' ? 'badge-green' :
                                                proposal.status === 'Підтверджено' ? 'badge-yellow' :
                                                proposal.status === 'Завершено' ? 'badge-blue' : 'badge-gray'
                                            }`}>
                                                {proposal.status}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="card-description-left">{proposal.description}</p>
                                    <div className="card-footer-col">
                                        <div className="proposal-type-row">
                                            <Tag size={14} /> 
                                            <span style={{fontWeight: 600}}>Тип:</span> {proposal.typeName}

                                            <ComplexityDots levelStr={proposal.complexity} />
                                        
                                        </div>
                                        <div className="card-footer-row">
                                            <div className="teacher-tags">
                                                <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: proposal.studentNickname ? '0.5rem' : '0'}}>
                                                    <span className="label">Керівник: </span>
                                                    <span className="teacher-tag">{proposal.teacherName}</span>
                                                </div>
                                                {proposal.studentNickname && (
                                                    <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                                                        <span className="label">Студент: </span>
                                                        <span className="teacher-tag">{proposal.studentNickname}</span>
                                                    </div>
                                                )}
                                            </div>
                                            {(proposal.status === 'Запропоновано' || proposal.status === 'Є записи') && (
                                                <button className="enroll-btn-small" onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEnroll(proposal.proposal_Id);
                                                }}>
                                                    Записатися
                                                </button>
                                            )}
                                            {isCompleted && proposal.workId && (
                                                <span style={{fontSize: '0.85rem', color: '#666', fontStyle: 'italic'}}>
                                                    Натисніть для перегляду роботи
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="no-results-message">
                        <p>За обраними критеріями пропозицій не знайдено.</p>
                        <button className="action-btn" onClick={() => {
                            setSelectedDirections([]); 
                            setSelectedTeacher(''); 
                            setSearchQuery(''); 
                            setSelectedType(''); 
                            setSelectedComplexity('');
                            setSelectedStatus('');
                            setSortOrder('name_asc');
                        }} style={{margin: '0 auto'}}>
                            Скинути фільтри
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentProposals;
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import API_CONFIG from '../config/api';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, ChevronRight, Calendar, ArrowUpDown } from 'lucide-react';
import './styles/ClientPages.css';
import './styles/StudentResults.css';

const StudentResults = () => {
    const [results, setResults] = useState([]);
    const [filteredResults, setFilteredResults] = useState([]);
    const [resultTypes, setResultTypes] = useState([]);
    const navigate = useNavigate();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState('All');
    const [startYear, setStartYear] = useState('');
    const [endYear, setEndYear] = useState('');
    const [sortOrder, setSortOrder] = useState('newest');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [resRes, typesRes] = await Promise.all([
                    axios.get(`${API_CONFIG.BASE_URL}/result/getall`),
                    axios.get(`${API_CONFIG.BASE_URL}/resultType/getall`)
                ]);

                if (resRes.data && typesRes.data) {
                    const enrichedResults = resRes.data.map(r => ({
                        ...r,
                        typeName: typesRes.data.find(t => t.result_type_Id === r.result_type_Id)?.name || 'Result'
                    }));

                    setResults(enrichedResults);
                    setFilteredResults(enrichedResults);
                    setResultTypes(typesRes.data);
                }
            } catch (error) {
                console.error("Error loading results:", error);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        let data = [...results];

        if (searchQuery) {
            data = data.filter(r => 
                r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (r.full_name && r.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        if (selectedType !== 'All') {
            data = data.filter(r => r.result_type_Id === parseInt(selectedType));
        }

        if (startYear || endYear) {
            data = data.filter(r => {
                const itemYear = r.year ? parseInt(r.year) : 0;
                const start = startYear ? parseInt(startYear) : -Infinity;
                const end = endYear ? parseInt(endYear) : Infinity;
                
                return itemYear >= start && itemYear <= end;
            });
        }

        data.sort((a, b) => {
            const yearA = a.year || 0;
            const yearB = b.year || 0;
            const nameA = a.name.toLowerCase();
            const nameB = b.name.toLowerCase();

            switch (sortOrder) {
                case 'newest': // Від найновіших до найстаріших
                    return yearB - yearA;
                case 'oldest': // Від найстаріших до найновіших
                    return yearA - yearB;
                case 'name_asc': // А-Я
                    return nameA.localeCompare(nameB);
                case 'name_desc': // Я-А
                    return nameB.localeCompare(nameA);
                default:
                    return 0;
            }
        });

        setFilteredResults(data);
    }, [searchQuery, selectedType, startYear, endYear, sortOrder, results]);

    return (
        <div className="client-page">
            <h1 className="page-title">Результати наших студентів</h1>

            <div className="filter-panel">
                {/* Пошук */}
                <div className="search-box">
                    <Search className="search-icon" size={20} />
                    <input 
                        type="text" 
                        id="search-query"
                        name="searchQuery"
                        className="search-input" 
                        placeholder="Пошук роботи або студента..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoComplete="off"
                    />
                </div>

                {/* Група фільтрів */}
                
                {/* Тип результату */}
                <div className="filters-group">
                    <label htmlFor="result-type-select" className="filter-label">
                        <BookOpen size={18} /> Тип:
                    </label>
                    <select 
                        id="result-type-select"
                        name="resultType"
                        className="search-input" 
                        style={{minWidth: '150px', paddingLeft: '15px'}}
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                    >
                        <option value="All">Всі типи</option>
                        {resultTypes.map(type => (
                            <option key={type.result_type_Id} value={type.result_type_Id}>
                                {type.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Інтерфейс вибору діапазону років */}
                <div className="filters-group">
                    <label className="filter-label">
                        <Calendar size={18} /> Рік:
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <input 
                            type="number"
                            id="start-year"
                            className="search-input"
                            style={{width: '80px', paddingLeft: '10px'}}
                            placeholder="З"
                            value={startYear}
                            onChange={(e) => setStartYear(e.target.value)}
                            min="2000"
                            max="2099"
                        />
                        <span style={{ color: '#666' }}>-</span>
                        <input 
                            type="number"
                            id="end-year"
                            className="search-input"
                            style={{width: '80px', paddingLeft: '10px'}}
                            placeholder="По"
                            value={endYear}
                            onChange={(e) => setEndYear(e.target.value)}
                            min="2000"
                            max="2099"
                        />
                    </div>
                </div>

                {/* Сортування */}
                <div className="filters-group">
                    <label htmlFor="sort-order" className="filter-label">
                        <ArrowUpDown size={18} /> Сортування:
                    </label>
                    <select 
                        id="sort-order"
                        name="sortOrder"
                        className="search-input" 
                        style={{minWidth: '180px', paddingLeft: '15px'}}
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                    >
                        <option value="newest">Спочатку нові</option>
                        <option value="oldest">Спочатку старі</option>
                        <option value="name_asc">За назвою (А-Я)</option>
                        <option value="name_desc">За назвою (Я-А)</option>
                    </select>
                </div>

            </div>

            <div className="cards-grid-results">
                {filteredResults.length > 0 ? (
                    filteredResults.map(result => {
                        const handleCardClick = () => {
                            if (result.work_Id) {
                                navigate(`/workpage/${result.work_Id}`);
                            }
                        };
                        
                        return (
                            <div 
                                key={result.result_Id} 
                                className="item-card result-card clickable-result-card"
                                onClick={result.work_Id ? handleCardClick : undefined}
                                style={result.work_Id ? { cursor: 'pointer' } : {}}
                            >
                                <div className="card-content">
                                    <div className="card-header">
                                        <h3 className="card-title">{result.name}</h3>
                                        <div className="card-badges">
                                            <span className="badge badge-blue">{result.typeName}</span>
                                            <span className="badge badge-gray">{result.year} рік</span>
                                        </div>
                                    </div>
                                    
                                    <p className="card-description-left">
                                        Автор: <strong>{result.full_name}</strong>
                                        <br/>
                                        {result.pages ? `Обсяг: ${result.pages} стор.` : ''}
                                    </p>
                                    
                                    {result.work_Id && (
                                        <div className="card-footer" onClick={(e) => e.stopPropagation()}>
                                            <button 
                                                className="action-btn" 
                                                onClick={handleCardClick}
                                            >
                                                Детальніше <ChevronRight size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="no-results">Результатів не знайдено.</div>
                )}
            </div>
        </div>
    );
};

export default StudentResults;
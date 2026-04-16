import React from 'react';
import { Search, Filter, User, Tag, Info } from 'lucide-react';
import Sparkline from './Sparkline';
import Tooltip from './Tooltip';
import './styles/FilterSidebar.css';

const FilterSidebar = ({ 
    searchQuery, setSearchQuery, 
    selectedType, setSelectedType, 
    selectedTeacher, setSelectedTeacher, 
    selectedDirections, handleDirectionChange,
    complexityRange, setComplexityRange,
    types, teachers, directions 
}) => {

    const LEVELS = ["низька", "середня", "висока"];

    const getFakeData = (id) => {
        const seed = id * 10;
        return [(seed % 10) + 2, (seed % 8) + 5, (seed % 12) + 3, (seed % 15) + 8, (seed % 5) + 10];
    };

    const handleRangeChange = (e, type) => {
        const value = parseInt(e.target.value);
        if (type === 'min') {
            setComplexityRange([Math.min(value, complexityRange[1]), complexityRange[1]]);
        } else {
            setComplexityRange([complexityRange[0], Math.max(value, complexityRange[0])]);
        }
    };

    return (
        <div className="filter-sidebar">
            <h3 className="filter-title">
                <Filter size={20} /> Фільтри
            </h3>

            {/* Пошук */}
            <div className="filter-group">
                <div className="search-box-sidebar">
                    <Search className="search-icon" size={16} />
                    <input 
                        type="text" 
                        className="search-input-sidebar" 
                        placeholder="Пошук..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Слайдер Складності (ОНОВЛЕНИЙ) */}
            <div className="filter-group">
                <div className="filter-header">
                    <span className="filter-label">Складність</span>
                    <Tooltip text="Фільтр за рівнем складності роботи">
                        <Info size={14} className="info-icon" />
                    </Tooltip>
                </div>
                
                <div className="range-slider-container">
                    {/* Відображаємо СЛОВА замість цифр */}
                    <div className="range-values" style={{textTransform: 'capitalize', fontSize: '0.9rem'}}>
                        <span>{LEVELS[complexityRange[0] - 1]}</span>
                        <span style={{margin: '0 5px'}}>-</span>
                        <span>{LEVELS[complexityRange[1] - 1]}</span>
                    </div>

                    <div className="slider-track-wrapper">
                        <div className="slider-track" />
                        
                        {/* Розрахунок позиції для 3 кроків (0%, 50%, 100%) */}
                        <div 
                            className="slider-range" 
                            style={{
                                left: `${(complexityRange[0] - 1) * 50}%`,
                                right: `${100 - (complexityRange[1] - 1) * 50}%`
                            }}
                        />
                        {/* Min Thumb (max=3) */}
                        <input 
                            type="range" min="1" max="3" step="1"
                            value={complexityRange[0]}
                            onChange={(e) => handleRangeChange(e, 'min')}
                            className="thumb thumb-left"
                        />
                        {/* Max Thumb (max=3) */}
                        <input 
                            type="range" min="1" max="3" step="1"
                            value={complexityRange[1]}
                            onChange={(e) => handleRangeChange(e, 'max')}
                            className="thumb thumb-right"
                        />
                    </div>
                    {/* Підписи під шкалою */}
                    <div style={{display:'flex', justifyContent:'space-between', marginTop:'5px', fontSize:'0.7rem', color:'#999'}}>
                        <span>Низька</span>
                        <span>Середня</span>
                        <span>Висока</span>
                    </div>
                </div>
            </div>

            {/* Інші фільтри (без змін) */}
            <div className="filter-group">
                <label className="filter-label"><Tag size={16}/> Тип пропозиції</label>
                <select className="select-sidebar" value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
                    <option value="">Всі типи</option>
                    {types.map(t => <option key={t.proposal_type_Id} value={t.proposal_type_Id}>{t.name}</option>)}
                </select>
            </div>

            <div className="filter-group">
                <label className="filter-label"><User size={16}/> Викладач</label>
                <select className="select-sidebar" value={selectedTeacher} onChange={(e) => setSelectedTeacher(e.target.value)}>
                    <option value="">Всі викладачі</option>
                    {teachers.map(t => <option key={t.teacher_Id} value={t.teacher_Id}>{t.full_name}</option>)}
                </select>
            </div>

            <div className="filter-group">
                <div className="filter-header">
                    <span className="filter-label">Напрями</span>
                </div>
                <div className="directions-list">
                    {directions.map(dir => (
                        <label key={dir.direction_Id} className="direction-row">
                            <div className="checkbox-wrapper">
                                <input 
                                    type="checkbox" 
                                    checked={selectedDirections.includes(dir.direction_Id)}
                                    onChange={() => handleDirectionChange(dir.direction_Id)}
                                />
                                <span className="dir-name">{dir.name}</span>
                            </div>
                            <div className="sparkline-wrapper">
                                <Sparkline data={getFakeData(dir.direction_Id)} />
                            </div>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FilterSidebar;
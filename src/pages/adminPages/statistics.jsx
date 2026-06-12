import React from 'react';
import { Link } from 'react-router-dom';
import './styles/Statistics.css';

const Statistics = () => {
    return (
        <div className="statistics-container">
            <h1>Статистика</h1>
            <div className="statistics-menu">
                <Link to="/apanel/statistics/magazines" className="stat-card">
                    <h2>Статистика по журналах</h2>
                    <p>Аналіз публікацій по журналах: кількість, середня кількість сторінок, останні публікації</p>
                </Link>
                <Link to="/apanel/statistics/period" className="stat-card">
                    <h2>Статистика за період</h2>
                    <p>Аналіз результатів за вказаний період з фільтрацією по датах</p>
                </Link>
            </div>
        </div>
    );
};

export default Statistics;
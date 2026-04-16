import React, { useState } from 'react';
import axios from 'axios';
import useAuthHeader from "react-auth-kit/hooks/useAuthHeader";
import API_CONFIG from '../../config/api.js';
import { Link } from 'react-router-dom';
import './styles/Statistics.css';

const PeriodStatistics = () => {
    const [startYear, setStartYear] = useState(new Date().getFullYear() - 5);
    const [endYear, setEndYear] = useState(new Date().getFullYear());
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const authHeader = useAuthHeader();

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        
        axios.post(`${API_CONFIG.BASE_URL}/statistics/period`, {
            startYear: parseInt(startYear),
            endYear: parseInt(endYear)
        }, {
            headers: {
                'Authorization': authHeader ? authHeader : '',
            }
        })
        .then((response) => {
            setData(response.data);
            setLoading(false);
        })
        .catch((error) => {
            console.error("Error fetching statistics:", error);
            setLoading(false);
            alert("Помилка при отриманні статистики: " + error.message);
        });
    };

    return (
        <div className="statistics-page">
            <div className="statistics-header">
                <Link to="/apanel/statistics" className="back-link">← Назад до статистики</Link>
                <h1>Статистика за період</h1>
            </div>

            <form onSubmit={handleSubmit} className="period-form">
                <div className="form-group">
                    <label htmlFor="startYear">Рік початку:</label>
                    <input
                        type="number"
                        id="startYear"
                        value={startYear}
                        onChange={(e) => setStartYear(e.target.value)}
                        min="2000"
                        max={new Date().getFullYear()}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="endYear">Рік кінця:</label>
                    <input
                        type="number"
                        id="endYear"
                        value={endYear}
                        onChange={(e) => setEndYear(e.target.value)}
                        min="2000"
                        max={new Date().getFullYear()}
                        required
                    />
                </div>
                <button type="submit" disabled={loading}>
                    {loading ? 'Завантаження...' : 'Отримати дані'}
                </button>
            </form>

            {data && (
                <div className="statistics-results">
                    <div className="period-info">
                        <h2>Період: {data.period.startYear} - {data.period.endYear}</h2>
                        <p>Всього знайдено результатів: {data.totalCount}</p>
                        <p>Дата формування: {new Date(data.generatedAt).toLocaleString('uk-UA')}</p>
                    </div>

                    {data.data.length === 0 ? (
                        <p>За вказаний період результатів не знайдено</p>
                    ) : (
                        <table className="statistics-table">
                            <thead>
                                <tr>
                                    <th>Назва</th>
                                    <th>Рік</th>
                                    <th>Тип результату</th>
                                    <th>Джерело публікації</th>
                                    <th>Тип джерела</th>
                                    <th>Сторінки</th>
                                    <th>Автор</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.data.map((item) => (
                                    <tr key={item.result_Id}>
                                        <td>{item.name || 'Не вказано'}</td>
                                        <td>{item.year || 'Не вказано'}</td>
                                        <td>{item.result_type_name || 'Не вказано'}</td>
                                        <td>{item.publication_source || 'Не вказано'}</td>
                                        <td>{item.publication_type}</td>
                                        <td>{item.pages || 'Не вказано'}</td>
                                        <td>{item.full_name || 'Не вказано'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
};

export default PeriodStatistics;
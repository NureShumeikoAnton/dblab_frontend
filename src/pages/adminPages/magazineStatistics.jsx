import React, { useEffect, useState } from 'react';
import axios from 'axios';
import useAuthHeader from "react-auth-kit/hooks/useAuthHeader";
import API_CONFIG from '../../config/api.js';
import { Link } from 'react-router-dom';
import './styles/Statistics.css';

const MagazineStatistics = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const authHeader = useAuthHeader();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = () => {
        setLoading(true);
        axios.get(`${API_CONFIG.BASE_URL}/statistics/magazines`, {
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
        });
    };

    if (loading) {
        return <div className="loading">Завантаження даних...</div>;
    }

    return (
        <div className="statistics-page">
            <div className="statistics-header">
                <Link to="/apanel/statistics" className="back-link">← Назад до статистики</Link>
                <h1>Статистика по журналах</h1>
            </div>
            
            {data.length === 0 ? (
                <p>Дані відсутні</p>
            ) : (
                <table className="statistics-table">
                    <thead>
                        <tr>
                            <th>Назва журналу</th>
                            <th>Видавець</th>
                            <th>Місто</th>
                            <th>Кількість публікацій</th>
                            <th>Середня кількість сторінок</th>
                            <th>Рік останньої публікації</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item) => (
                            <tr key={item.magazine_Id}>
                                <td>{item.magazine_name || 'Не вказано'}</td>
                                <td>{item.publisher || 'Не вказано'}</td>
                                <td>{item.city || 'Не вказано'}</td>
                                <td>{item.publications_count}</td>
                                <td>{parseFloat(item.avg_pages).toFixed(2)}</td>
                                <td>{item.last_publication_year || 'Немає публікацій'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default MagazineStatistics;


import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import API_CONFIG from '../config/api';
import './styles/ClientPages.css';
import './styles/StudentDirections.css';

const StudentDirections = () => {
    const [directions, setDirections] = useState([]);

    useEffect(() => {
        axios.get(`${API_CONFIG.BASE_URL}/direction/getall`)
            .then(response => {
                setDirections(response.data.map(d => ({
                    id: d.direction_Id,
                    name: d.name || d.direction_name,
                    description: d.description || d.direction_Description
                })));
            })
            .catch(error => console.error("Error loading directions:", error));
    }, []);

    return (
        <div className="client-page">
            <h1 className="page-title">Напрями</h1>
            
            <div className="cards-grid-squares">
                {directions.map(dir => (
                    <Link 
                        key={dir.id} 
                        // Посилання веде на сторінку пропозицій з фільтром
                        to={`/studentproposals?directionId=${dir.id}`} 
                        className="card-link-wrapper"
                    >
                        <div className="item-card skill-card-visual">
                            <h3 className="skill-title">{dir.name}</h3>
                            <p className="skill-description">
                                {dir.description || "Опис відсутній"}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default StudentDirections;
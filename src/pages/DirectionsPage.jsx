import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './styles/Directions.css';

const DirectionCard = ({name, link, image, description}) => (
    <a href={link} className='direction-card'>
        {/*<img src={image} alt={name} className='direction-card__img'/>*/}
        <div className='direction-card__img'></div>
        <p className='direction-card__name'>{name}</p>
        <p className='direction-card__description'>{description}</p>
    </a>
);

const DirectionsPage = () => {
    const [directions, setDirections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDirections = async () => {
            try {
                const response = await axios.get('http://localhost:5000/developmentDirection/getAll');
                setDirections(response.data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching directions:', err);
                setError('Failed to load directions. Please try again later.');
                setLoading(false);
            }
        };

        fetchDirections();
    }, []);

    if (loading) return <div className="loading">Loading directions...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="directions-container">
            <h1 className="directions-title">Directions</h1>
            <div className="directions-grid">
                {directions.map((direction) => (
                    <DirectionCard
                        key={direction.development_direction_Id}
                        name={direction.development_direction_name}
                        link={`/directions/${direction.development_direction_Id}`}
                        image={direction.image}
                        description={direction.development_direction_Description}
                    />
                ))}
            </div>
        </div>
    );
};

export default DirectionsPage;
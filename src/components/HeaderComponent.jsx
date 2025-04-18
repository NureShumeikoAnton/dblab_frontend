import React from 'react';
import {NavLink} from "react-router-dom";
import './styles/Header.css';
import {useState} from "react";
import AuthModalComponent from "./AuthModalComponent.jsx";

const HeaderComponent = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    return (
        <header>
            <AuthModalComponent
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
            <div className="header-container">
                <div className="title-text">
                    <i className="fas fa-database"></i>
                    <h1>DBLAB</h1>
                </div>
                <div className="nav-links">
                    <nav>
                        <ul>
                            <li><NavLink to="/" end>Головна</NavLink></li>
                            <li><NavLink to="/courses">Дисципліни</NavLink></li>
                            <li><NavLink to="/schedule">Розклад</NavLink></li>
                            <li><NavLink to="/contact">Контакти</NavLink></li>
                        </ul>
                    </nav>
                    <button className={"registration-button"} onClick={()=> setIsModalOpen(true)}>Реєстрація</button>
                </div>
            </div>
        </header>
    );
};

export default HeaderComponent;
import React from 'react';
import {NavLink} from "react-router-dom";
import './styles/HeaderComponent.css';

const HeaderComponent = () => {
    return (
        <header>
            <div className="title-text">

            </div>
            <nav>
                <ul>
                    <li><NavLink to="/" end>Home</NavLink></li>
                    <li><NavLink to="/about">About</NavLink></li>
                    <li><NavLink to="/contact">Contact</NavLink></li>
                </ul>
            </nav>
        </header>
    );
};

export default HeaderComponent;
import React from 'react';
import {NavLink} from "react-router-dom";
import './styles/Header.css';
import {useState} from "react";
import AuthModalComponent from "./AuthModalComponent.jsx";
import useAuthUser from "react-auth-kit/hooks/useAuthUser";
import useSignOut from "react-auth-kit/hooks/useSignOut";
import {LogOut} from "lucide-react";

const HeaderComponent = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const authUser = useAuthUser();
    const signOut = useSignOut();
    const username = authUser ? authUser.username : null;

    const handleSignOut = () => {
        signOut();
        window.location.reload();
    };

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
                    <div className="auth-buttons">
                        {username ? (
                        <div className="user-info">
                            <span>Ласкаво просимо, {username}!</span>
                            <div onClick={() => {
                                signOut();
                                window.location.reload();
                            }}><LogOut size={16}/></div>
                        </div>
                    ) : (
                        <button className={"registration-button"} onClick={() => setIsModalOpen(true)}>Реєстрація</button>
                    )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default HeaderComponent;
import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import './styles/Header.css';
import AuthModalComponent from './AuthModalComponent.jsx';
import useAuthUser from 'react-auth-kit/hooks/useAuthUser';
import useSignOut from 'react-auth-kit/hooks/useSignOut';
import { LogOut, ChevronDown } from 'lucide-react';

const NAV_GROUPS = [
    {
        label: 'Навчання',
        links: [
            { to: '/directions', label: 'Напрямки' },
            { to: '/courses',    label: 'Дисципліни' },
            { to: '/schedule',   label: 'Розклад' },
        ],
    },
    {
        label: 'Проєкти та ресурси',
        links: [
            { to: '/projects',  label: 'Проєкти' },
            { to: '/library',   label: 'Бібліотека' },
            { to: '/expertise', label: 'Експертиза' },
        ],
    },
    {
        label: 'Особисте',
        links: [
            { to: '/studentresults',   label: 'Результати' },
            { to: '/studentproposals', label: 'Пропозиції' },
            { to: '/dashboard',        label: 'Особистий кабінет' },
        ],
    },
];

const NavDropdown = ({ label, links }) => {
    const { pathname } = useLocation();
    const hasActive = links.some(({ to }) => pathname === to || pathname.startsWith(to + '/'));

    return (
        <li className="nav-dropdown">
            <span className={`nav-dropdown__trigger${hasActive ? ' nav-dropdown__trigger--active' : ''}`}>
                {label}
                <ChevronDown size={13} className="nav-dropdown__chevron" />
            </span>

            <ul className="nav-dropdown__menu">
                {links.map(({ to, label: linkLabel }) => (
                    <li key={to}>
                        <NavLink
                            to={to}
                            className={({ isActive }) =>
                                'nav-dropdown__item' + (isActive ? ' nav-dropdown__item--active' : '')
                            }
                        >
                            {linkLabel}
                        </NavLink>
                    </li>
                ))}
            </ul>
        </li>
    );
};

const HeaderComponent = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const authUser = useAuthUser();
    const signOut = useSignOut();
    const username = authUser ? authUser.username : null;

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
                            {NAV_GROUPS.map((group) => (
                                <NavDropdown key={group.label} {...group} />
                            ))}
                        </ul>
                    </nav>
                    <div className="auth-buttons">
                        {username ? (
                            <div className="user-info">
                                <span>Ласкаво просимо, {username}!</span>
                                <div onClick={() => { signOut(); window.location.reload(); }}>
                                    <LogOut size={16} />
                                </div>
                            </div>
                        ) : (
                            <button className="registration-button" onClick={() => setIsModalOpen(true)}>
                                Реєстрація
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default HeaderComponent;

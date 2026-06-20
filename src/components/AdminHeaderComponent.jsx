import React from 'react';
import { Link } from 'react-router-dom';
import './styles/AdminHeader.css';
import {DatabaseIcon, LogOut, Users} from "lucide-react";
import useSignOut from "react-auth-kit/hooks/useSignOut";
import useAuthUser from "react-auth-kit/hooks/useAuthUser";

const AdminHeaderComponent = () => {
    const authUser = useAuthUser();
    const sighOut = useSignOut();
    const username = authUser ? authUser.username : null;
    const handleLogout = () => {
        sighOut();
        window.location.reload();
    }
    return (
        <header>
            <div className="admin-header-container">
                <div className="admin-title-text">
                    <DatabaseIcon size={24} />
                    <h1>DBLAB Admin</h1>
                </div>
                <nav className="admin-header-nav">
                    <Link to="/apanel/experts" className="admin-header-nav__link">
                        <Users size={15} />
                        Управління експертами
                    </Link>
                </nav>
                <div className="admin-user-info">
                    <p>{username}</p>
                    <button className="logout-button" onClick={handleLogout}>
                        Logout
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default AdminHeaderComponent;
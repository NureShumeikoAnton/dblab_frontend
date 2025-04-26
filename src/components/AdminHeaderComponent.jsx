import React from 'react';
import './styles/AdminHeader.css';
import {DatabaseIcon, LogOut} from "lucide-react";

const AdminHeaderComponent = () => {
    return (
        <header>
            <div className="admin-header-container">
                <div className="admin-title-text">
                    <DatabaseIcon size={24} />
                    <h1>DBLAB Admin</h1>
                </div>
                <div className="admin-user-info">
                    <p>Admin Name</p>
                    <button className="logout-button">
                        Logout
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default AdminHeaderComponent;
import React from 'react';
import './styles/AdminHeader.css';
import {DatabaseIcon, LogOut} from "lucide-react";
import useSignOut from "react-auth-kit/hooks/useSignOut";
import useAuthUser from "react-auth-kit/hooks/useAuthUser";

const AdminHeaderComponent = ({upToDate}) => {
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
                    {upToDate[0].upToDate ? (
                        <h2 className="up-to-date-text">Дані збережено</h2>
                    ) : (
                        <h2 className="not-up-to-date-text">Дані не кешовані</h2>
                    )}
                </div>
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
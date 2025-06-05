import React, {createContext, createRef} from 'react';
import {Outlet, Link} from 'react-router-dom';
import './styles/AdminPage.css';
import axios from "axios";
import useAuthHeader from "react-auth-kit/hooks/useAuthHeader";
import ModalNotificationComponent from "../components/ModalNotificationComponent.jsx";
import API_CONFIG from '../config/api.js';

export const NotificationContext = createContext();

const AdminPageLayout = () => {
    const tables = [
        {name: 'Teachers', path: '/apanel/teachers'},
        {name: 'Disciplines', path: '/apanel/disciplines'},
        {name: 'Skills', path: '/apanel/skills'},
        {name: 'Levels', path: '/apanel/levels'},
        {name: 'Chapters', path: '/apanel/chapters'},
        {name: 'Languages', path: '/apanel/languages'},
        {name: 'Development Directions', path: '/apanel/developmentdirections'},
        {name: 'Discipline - Teacher', path: '/apanel/disciplineteacher'},
        {name: 'Discipline - Skill', path: '/apanel/disciplineskill'},
        {name: 'Lessons', path: '/apanel/lessons'},
        {name: 'Events', path: '/apanel/events'},
        {name: 'Materials', path: '/apanel/materials'},
    ];

    const authHeader = useAuthHeader();
    const notificationRef = createRef();

    const handleUpdate = () => {
        axios.post(`${API_CONFIG.BASE_URL}/cache/update`, null, {
            headers: {
                'Authorization': authHeader.split(' ')[1],
            }
        })
            .then(response => {
                console.log('Cache updated successfully:', response.data);
                alert("Cache updated successfully");
                window.location.reload();
            })
            .catch(error => {
                console.error('Error updating cache:', error);
                alert("Error updating cache");
            });
    }

    return (
        <div className="admin-page-layout">
            <aside className="sidebar">
                <button className="update-button" onClick={handleUpdate}>Update cache</button>
                <ul>
                    {tables.map((table) => (
                        <li key={table.name}>
                            <Link to={`${table.path}`}>
                                {table.name}
                            </Link>
                        </li>
                    ))}
                </ul>
            </aside>
            <main className="main-content">
                <NotificationContext.Provider value={notificationRef}>
                    <Outlet />
                </NotificationContext.Provider>
            </main>
            <ModalNotificationComponent ref={notificationRef}/>
        </div>
    );
};

export default AdminPageLayout;
